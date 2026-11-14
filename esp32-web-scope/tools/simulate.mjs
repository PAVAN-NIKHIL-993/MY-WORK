// ---------------------------------------------------------------------------
// simulate.mjs - run the dashboard on a laptop against a synthetic device.
//
// Serves test/dashboard_preview.html over HTTP and a WebSocket on port 81, with a
// fake ESP32 that streams data frames and accepts every command the firmware
// accepts. The measurement numbers are generated, NOT measured - this exists so
// the UI can be developed and demonstrated without hardware. It is not evidence
// that the firmware works.
//
//   node tools/simulate.mjs [--port 8080]
//   then open http://localhost:8080/
// ---------------------------------------------------------------------------

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { WebSocketServer } = require(
  path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../a11y-workbench/node_modules/ws")
);

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const PORT = portArg >= 0 ? Number(args[portArg + 1]) : 8080;
const WS_PORT = PORT;  // same port: the dashboard derives this from location.port

const html = readFileSync(
  fileURLToPath(new URL("../test/dashboard_preview.html", import.meta.url)),
  "utf8"
);

// --- fake device state, mirroring ScopeState in the .ino --------------------
const state = {
  running: true,
  method: 0,
  x_offset_pct: 0,
  y_offset_pct: 50,
  x_zoom_x10: 10,
  y_zoom_x10: 10,
  v_per_div_idx: 2,
  timebase_idx: 5,
  trigger_mv: 1650,
  trigger_edge: 1,
  trigger_mode: 0,
  bw_limit: false,
  bw_size: 4,
  cursors: false,
  cursor1_pct: 25,
  cursor2_pct: 75,
  fft: false,
};

// A signal the user can change: 1 MHz, 25 % duty by default. Chosen because it
// is the case the original sketch could not measure (its 1 us RMT tick would
// report 0 % or 100 %).
let signal = { freqHz: 1e6, dutyPct: 25 };

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function measurement() {
  if (!state.running) return { valid: false };
  const periodNs = Math.round(1e9 / signal.freqHz);
  const highNs = Math.round((periodNs * signal.dutyPct) / 100);
  const lowNs = periodNs - highNs;
  const mhz = Math.round(1e12 / periodNs);
  return {
    valid: true,
    freq_mhz: mhz,
    period_ns: periodNs,
    high_ns: highNs,
    low_ns: lowNs,
    duty_permille: Math.round((highNs * 1000) / periodNs),
    edges: 128,
  };
}

function fmtFreq(mhz) {
  const hz = mhz / 1000;
  if (hz >= 1e6) return (hz / 1e6).toFixed(3) + " MHz";
  if (hz >= 1e3) return (hz / 1e3).toFixed(3) + " kHz";
  return hz.toFixed(3) + " Hz";
}
function fmtTime(ns) {
  if (!ns) return "---";
  if (ns >= 1e6) return (ns / 1e6).toFixed(3) + " ms";
  if (ns >= 1e3) return (ns / 1e3).toFixed(3) + " us";
  return ns + " ns";
}

function frame() {
  const m = measurement();
  return {
    cmd: "data",
    method: state.method,
    valid: m.valid,
    meas: m.valid
      ? {
          ...m,
          freq_text: fmtFreq(m.freq_mhz),
          period_text: fmtTime(m.period_ns),
          high_text: fmtTime(m.high_ns),
          low_text: fmtTime(m.low_ns),
        }
      : { freq_mhz: 0, period_ns: 0, high_ns: 0, low_ns: 0, duty_permille: 0, edges: 0 },
    state,
  };
}

// --- HTTP: serve the page and an endpoint to change the fake signal ---------
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/signal") {
    // Lets the demo exercise the UI with different signals.
    const f = Number(url.searchParams.get("freq"));
    const d = Number(url.searchParams.get("duty"));
    if (Number.isFinite(f) && f > 0) signal.freqHz = clamp(f, 0.1, 1.2e6);
    if (Number.isFinite(d)) signal.dutyPct = clamp(d, 0, 100);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(signal));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

// --- WebSocket on PORT+1, matching what the page expects (host:81) ----------
// Attach the WebSocket server to the HTTP server so one port carries both. The
// page detects a non-80 port and connects back to the same origin.
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

// Command handling that mirrors handleCommand() in the .ino, so every control on
// the page can be exercised before the firmware exists.
function applyCommand(cmd, doc) {
  const val = (k, d) => (Number.isFinite(doc[k]) ? doc[k] : d);
  switch (cmd) {
    case "run":    state.running = true; break;
    case "stop":   state.running = false; break;
    case "single": state.running = true; break;
    case "setMethod":  state.method = clamp(val("value", 0), 0, 2); break;
    case "setXOffset": state.x_offset_pct = clamp(val("value", 0), -100, 100); break;
    case "setYOffset": state.y_offset_pct = clamp(val("value", 50), 0, 100); break;
    case "setXZoom":   state.x_zoom_x10 = clamp(val("value", 10), 10, 200); break;
    case "setYZoom":   state.y_zoom_x10 = clamp(val("value", 10), 10, 100); break;
    case "setVScale":  state.v_per_div_idx = clamp(val("value", 2), 0, 5); break;
    case "setTB":      state.timebase_idx = clamp(val("value", 5), 0, 13); break;
    case "setTrigger":
      state.trigger_mv = clamp(val("level_mv", 1650), 0, 3300);
      state.trigger_edge = val("edge", 1) < 0 ? -1 : 1;
      state.trigger_mode = clamp(val("mode", 0), 0, 2);
      break;
    case "setBWLimit":
      state.bw_limit = !!doc.enabled;
      state.bw_size = clamp(val("size", 4), 1, 16);
      break;
    case "setCursor":
      state.cursors = !!doc.enabled;
      state.cursor1_pct = clamp(val("c1", 25), 0, 100);
      state.cursor2_pct = clamp(val("c2", 75), 0, 100);
      break;
    case "setFFT": state.fft = !!doc.enabled; break;
  }
}

wss.on("connection", (sock) => {
  sock.send(JSON.stringify(frame()));
  sock.on("message", (data) => {
    let doc;
    try { doc = JSON.parse(data.toString()); } catch { return; }
    if (doc && typeof doc.cmd === "string") applyCommand(doc.cmd, doc);
  });
});

setInterval(() => {
  const msg = JSON.stringify(frame());
  for (const c of wss.clients) {
    if (c.readyState === 1) c.send(msg);
  }
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`dashboard:  http://localhost:${PORT}/`);
  console.log(`websocket:  ws://localhost:${WS_PORT}/`);
  console.log(`signal:     ${signal.freqHz} Hz, ${signal.dutyPct} % duty`);
  console.log(`change it:  http://localhost:${PORT}/api/signal?freq=50000&duty=50`);
});
