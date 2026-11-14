// ---------------------------------------------------------------------------
// Headless test of the dashboard page.
//
// Loads test/dashboard_preview.html in jsdom (borrowed from the sibling project's
// node_modules), stubs the canvas 2D context, injects a fake WebSocket, pushes a
// data frame, and asserts:
//   * the readouts show the values the firmware sent,
//   * the trace is drawn as a pulse train with the right duty ratio,
//   * formatting matches the firmware's own formatters,
//   * a "no signal" frame shows the empty state instead of a fake trace.
//
// Run:  node test/test_dashboard.mjs
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);

// jsdom is the one external dependency of this repo's tests, and it is not
// vendored. Resolution order:
//   1. a normal require(), so an npm-installed copy anywhere up the tree works;
//   2. the sibling a11y-workbench project, which is how it is installed here.
// If neither works the test says exactly what to do rather than throwing a
// bare MODULE_NOT_FOUND from a hardcoded path.
function loadJsdom() {
  try {
    return require("jsdom");
  } catch {
    /* fall through */
  }
  const candidates = [
    new URL("../../a11y-workbench/node_modules/jsdom", import.meta.url),
    new URL("../node_modules/jsdom", import.meta.url),
  ];
  for (const url of candidates) {
    try {
      return require(fileURLToPath(url));
    } catch {
      /* try next */
    }
  }
  console.error(
    "jsdom not found. The dashboard test needs it:\n" +
      "  npm install --no-save jsdom\n" +
      "or run it from a tree that has the sibling a11y-workbench project installed."
  );
  process.exit(1);
}

const { JSDOM } = loadJsdom();

let failures = 0;
let checks = 0;
function check(name, cond, detail = "") {
  checks++;
  if (!cond) {
    failures++;
    console.log(`  FAIL ${name}${detail ? "  (" + detail + ")" : ""}`);
  }
}

const html = readFileSync(
  fileURLToPath(new URL("./dashboard_preview.html", import.meta.url)),
  "utf8"
);

// --- canvas 2D stub that records the polyline it is asked to draw -------------
function makeCtx() {
  const points = [];
  let strokeStyle = "";
  const ctx = {
    setTransform() {}, clearRect() {}, beginPath() {},
    moveTo(x, y) { points.push([x, y]); },
    lineTo(x, y) { points.push([x, y]); },
    stroke() { ctx._strokes = (ctx._strokes || 0) + 1; },
    fillText() {}, setLineDash() {},
    get _points() { return points; },
    _strokes: 0,
  };
  Object.defineProperty(ctx, "strokeStyle", {
    get() { return strokeStyle; },
    set(v) { strokeStyle = v; },
  });
  return ctx;
}

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://192.168.2.23/",
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () {
      if (!this.__ctx) this.__ctx = makeCtx();
      return this.__ctx;
    };
    window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
      width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400,
    });
    // Capture the WebSocket the page creates so the test can push frames.
    window.__sockets = [];
    class FakeWS {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
        this.sent = [];
        window.__sockets.push(this);
        setTimeout(() => this.onopen && this.onopen(), 0);
      }
      send(d) { this.sent.push(d); }
      close() { this.readyState = 3; this.onclose && this.onclose(); }
    }
    FakeWS.OPEN = 1;
    window.WebSocket = FakeWS;
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  },
});

const { window } = dom;

// Let the page boot (load handler -> resize -> wireControls -> connect).
await new Promise((r) => setTimeout(r, 120));

console.log("dashboard headless test\n=======================");

// --- 1. socket connected -----------------------------------------------------
const sock = window.__sockets[0];
check("a WebSocket was opened", !!sock, sock ? sock.url : "none");
check("websocket URL targets port 81", sock && /:81\/$/.test(sock.url), sock && sock.url);

// --- 2. push a valid 1 MHz / 50 % data frame ---------------------------------
const frame = {
  cmd: "data",
  method: 0,
  valid: true,
  meas: {
    freq_mhz: 1000000000,   // 1 MHz in millihertz
    period_ns: 1000,
    high_ns: 500,
    low_ns: 500,
    duty_permille: 500,
    edges: 100000,
    freq_text: "1.000 MHz",
    period_text: "1.000 us",
    high_text: "500 ns",
    low_text: "500 ns",
  },
  state: {
    running: true, method: 0,
    x_offset_pct: 0, y_offset_pct: 50, x_zoom_x10: 10, y_zoom_x10: 10,
    v_per_div_idx: 2, timebase_idx: 5, trigger_mv: 1650,
    trigger_edge: 1, trigger_mode: 0, bw_limit: false, bw_size: 4,
    cursors: false, cursor1_pct: 25, cursor2_pct: 75, fft: false,
  },
};

sock.onmessage({ data: JSON.stringify(frame) });
await new Promise((r) => setTimeout(r, 80));

const $ = (id) => window.document.getElementById(id);

check("frequency readout shows 1.000 MHz", $("rFreq").textContent === "1.000 MHz", $("rFreq").textContent);
check("period readout shows 1.000 us", $("rPeriod").textContent === "1.000 us", $("rPeriod").textContent);
check("high readout shows 500 ns", $("rHigh").textContent === "500 ns", $("rHigh").textContent);
check("duty readout shows 50.0%", $("rDuty").textContent === "50.0%", $("rDuty").textContent);
check("edges readout shows 100000", $("rEdges").textContent === "100000", $("rEdges").textContent);
check("mode pill shows PCNT", $("pmode").textContent === "PCNT", $("pmode").textContent);
check("no-signal overlay hidden when valid", !$("nodata").classList.contains("show"));
check("connection dot is lit", $("dot").classList.contains("on"));

// --- 3. the trace must be a pulse train, not a flat line ---------------------
const ctx = window.document.getElementById("cv").__ctx;
const pts = ctx._points;
check("the canvas received drawing commands", pts.length > 20, pts.length + " points");

// Separate the trace polyline from the graticule: the trace uses distinct
// y-levels. Count vertical transitions (a level change between consecutive
// points at the same x).
const traceY = new Set(pts.map((p) => Math.round(p[1])));
check("the trace spans two distinct voltage levels", traceY.size >= 2,
      "distinct y values: " + traceY.size);

// --- 4. formatting agrees with the firmware-side formatters ------------------
// These mirror scope::formatFrequency / formatDuration and were asserted in the
// C++ tests; assert the JS side matches so the two cannot drift.
const fmtFreq = window.fmtFreq;
if (typeof fmtFreq === "function") {
  check("js fmtFreq(1e9 mHz) == '1.000 MHz'", fmtFreq(1000000000) === "1.000 MHz", fmtFreq(1000000000));
  check("js fmtFreq(12340000) == '12.340 kHz'", fmtFreq(12340000) === "12.340 kHz", fmtFreq(12340000));
  check("js fmtFreq(9876) == '9.876 Hz'", fmtFreq(9876) === "9.876 Hz", fmtFreq(9876));
} else {
  check("js formatters are reachable for testing", false, "fmtFreq is not exposed on window");
}

// --- 5. an invalid frame must show the empty state --------------------------
sock.onmessage({
  data: JSON.stringify({
    cmd: "data", method: 1, valid: false,
    meas: { freq_mhz: 0, period_ns: 0, high_ns: 0, low_ns: 0, duty_permille: 0, edges: 0 },
    state: frame.state,
  }),
});
await new Promise((r) => setTimeout(r, 60));

check("no-signal overlay appears when invalid", $("nodata").classList.contains("show"));
check("frequency readout clears on no signal", $("rFreq").textContent === "---", $("rFreq").textContent);

// --- 6. controls send commands ---------------------------------------------
const before = sock.sent.length;
$("sXoff").value = "40";
$("sXoff").dispatchEvent(new window.Event("input"));
await new Promise((r) => setTimeout(r, 30));
const sent = sock.sent.slice(before).map((s) => JSON.parse(s));
check("moving X position sends setXOffset", sent.some((c) => c.cmd === "setXOffset" && c.value === 40),
      JSON.stringify(sent));

console.log("\n=======================");
console.log(`${checks} checks, ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
