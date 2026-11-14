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

// --- 7. trace geometry: the trace must be a square wave, not a ramp ---------
// This is the regression test for the worst bug found in review: the renderer
// toggled the level and then advanced by the wrong duration, so every
// transition landed at a different x and a 50 % square drew as a sawtooth.
console.log("\ntrace geometry");
const geom = window.traceGeometry;

if (typeof geom !== "function") {
  check("traceGeometry is exposed for testing", false);
} else {
  const PX = 800, PYW = 400;
  const mkControls = (over) => Object.assign(
    { xOffsetPct: 0, xZoomX10: 10, tbIdx: 5, yOffsetPct: 50, yZoomX10: 10,
      vIdx: 2, trigMv: 1650, bwSize: 4, c1: 25, c2: 75, bwOn: false, curOn: false },
    over || {}
  );
  const zeroY = PYW / 2;

  // A 1 MHz, 50 % square at 5 us/div spans 50 us = 50 cycles across the screen.
  const g = geom({ period_ns: 1000, high_ns: 500, low_ns: 500, duty_permille: 500 },
                 mkControls(), PX, PYW, zeroY, 0.5, 8);
  check("geometry is produced", !!g);

  if (g) {
    check("exactly two voltage levels are used", new Set(g.points.map(p => Math.round(p[1]))).size === 2,
          "levels=" + new Set(g.points.map(p => Math.round(p[1]))).size);

    // Every transition must be a vertical pair: two consecutive points sharing
    // an x and differing in y. A diagonal ramp would have none.
    let verticals = 0;
    for (let i = 1; i < g.points.length; i++) {
      const [x1, y1] = g.points[i - 1];
      const [x2, y2] = g.points[i];
      if (x1 === x2 && y1 !== y2) verticals++;
    }
    check("transitions are vertical edges, not ramps", verticals > 10, verticals + " vertical edges");

    // And there must be no diagonal transition at all: any two consecutive
    // points differing in both x and y is a ramp segment.
    let diagonals = 0;
    for (let i = 1; i < g.points.length; i++) {
      const [x1, y1] = g.points[i - 1];
      const [x2, y2] = g.points[i];
      if (x1 !== x2 && y1 !== y2) diagonals++;
    }
    check("no diagonal transitions exist", diagonals === 0, diagonals + " diagonals");

    // For a 50 % duty the two levels must occupy equal horizontal distance.
    const topY = Math.min(...g.points.map(p => p[1]));
    const botY = Math.max(...g.points.map(p => p[1]));
    let topLen = 0, botLen = 0;
    for (let i = 1; i < g.points.length; i++) {
      const [x1, y1] = g.points[i - 1];
      const [x2, y2] = g.points[i];
      if (y1 !== y2) continue;
      const len = Math.abs(x2 - x1);
      if (Math.round(y1) === Math.round(topY)) topLen += len;
      if (Math.round(y1) === Math.round(botY)) botLen += len;
    }
    const ratio = topLen / (topLen + botLen);
    check("50 % duty draws equal high and low spans", Math.abs(ratio - 0.5) < 0.05,
          "high fraction = " + ratio.toFixed(3));
  }

  // A 25 % duty signal must draw a top span a third the size of the bottom.
  const g25 = geom({ period_ns: 1000, high_ns: 250, low_ns: 750, duty_permille: 250 },
                   mkControls(), PX, PYW, zeroY, 0.5, 8);
  if (g25) {
    const topY = Math.min(...g25.points.map(p => p[1]));
    const botY = Math.max(...g25.points.map(p => p[1]));
    let topLen = 0, botLen = 0;
    for (let i = 1; i < g25.points.length; i++) {
      const [x1, y1] = g25.points[i - 1];
      const [x2, y2] = g25.points[i];
      if (y1 !== y2) continue;
      const len = Math.abs(x2 - x1);
      if (Math.round(y1) === Math.round(topY)) topLen += len;
      if (Math.round(y1) === Math.round(botY)) botLen += len;
    }
    const ratio = topLen / (topLen + botLen);
    check("25 % duty draws a 25 % high span", Math.abs(ratio - 0.25) < 0.05,
          "high fraction = " + ratio.toFixed(3));
  }

  // X position must move the trace, and X position must also move the BW overlay
  // with it (the overlay previously ignored it and sat half a screen out).
  const a0 = geom({ period_ns: 1000, high_ns: 500 }, mkControls({ xOffsetPct: 0 }),
                  PX, PYW, zeroY, 0.5, 8);
  const a40 = geom({ period_ns: 1000, high_ns: 500 }, mkControls({ xOffsetPct: 40 }),
                   PX, PYW, zeroY, 0.5, 8);
  // The polyline is snapped to start at x=0 either way, so comparing the first
  // point proves nothing.
  //
  // Note what is and is not being claimed: the waveform is PERIODIC, so a pan of
  // D pixels moves every feature by D modulo the on-screen period. That is
  // correct behaviour, not a limit of the code -- a periodic signal cannot show
  // an absolute shift. The test therefore uses one cycle per screen, where the
  // modulo is unambiguous, and asserts the exact pixel shift.
  const firstEdgeX = (g) => {
    for (let i = 1; i < g.points.length; i++) {
      if (g.points[i][0] === g.points[i - 1][0] &&
          g.points[i][1] !== g.points[i - 1][1]) return g.points[i][0];
    }
    return NaN;
  };
  // span = 5 us/div * 10 div = 50 us; choose period = 50 us = one cycle/screen.
  const ONE = 50000;
  const p0 = geom({ period_ns: ONE, high_ns: ONE / 2 }, mkControls({ xOffsetPct: 0 }),
                  PX, PYW, zeroY, 0.5, 8);
  const p10 = geom({ period_ns: ONE, high_ns: ONE / 2 }, mkControls({ xOffsetPct: 10 }),
                   PX, PYW, zeroY, 0.5, 8);
  if (p0 && p10) {
    // One cycle spans the full screen width, so an 80 px pan is equivalent to a
    // -720 px wrap. This assertion only confirms SOMETHING moved.
    check("X position changes the edge positions",
          firstEdgeX(p10) !== firstEdgeX(p0),
          `${firstEdgeX(p0)} -> ${firstEdgeX(p10)}`);
  } else {
    check("X position changes the edge positions", false, "no geometry");
  }

  // A real pan: pick a timebase where the period does NOT divide the span, so
  // whole-cycle wrap cannot mask the shift.
  const q0 = geom({ period_ns: 700, high_ns: 350 }, mkControls({ xOffsetPct: 0 }),
                  PX, PYW, zeroY, 0.5, 8);
  const q5 = geom({ period_ns: 700, high_ns: 350 }, mkControls({ xOffsetPct: 5 }),
                  PX, PYW, zeroY, 0.5, 8);
  {
    // Compare EDGE positions, not every point: both traces begin at x=0 with
    // whatever level is current there, so the first point legitimately matches.
    //
    // The offset is 5 %, not 7 %: 7 % of a 50 us span is exactly 5 cycles of a
    // 700 ns signal, so the phase is genuinely unchanged and the trace really is
    // identical. Picking an offset that is a whole number of periods would make
    // this test assert something false.
    const edgesOf = (g) => {
      const out = [];
      for (let i = 1; i < g.points.length; i++) {
        if (g.points[i][0] === g.points[i - 1][0] &&
            g.points[i][1] !== g.points[i - 1][1]) out.push(+g.points[i][0].toFixed(3));
      }
      return out;
    };
    const e0 = edgesOf(q0), e5 = edgesOf(q5);
    const moved = e0.length === e5.length && e0.some((x, i) => Math.abs(x - e5[i]) > 0.5);
    check("different X positions move the visible edges", moved,
          `first edges ${e0[0]} vs ${e5[0]}`);
  }

  if (typeof window.boxcarTrace === "function" && q0 && q5) {
    // Same trap as above: use an offset that is not a whole number of cycles,
    // or the overlay is correctly identical and the test asserts something false.
    const bw0 = window.boxcarTrace(q0, 4);
    const bw5 = window.boxcarTrace(q5, 4);
    check("boxcar overlay is produced", Array.isArray(bw0) && bw0.length > 100,
          String(bw0 && bw0.length));

    const differs = bw0.some((p, i) => Math.abs(p[1] - (bw5[i] ? bw5[i][1] : p[1])) > 1);
    check("boxcar overlay tracks X position", differs);

    // A boxcar must smooth the hard edges: its values must include intermediate
    // levels that the ideal trace does not have.
    const levels = new Set(bw0.map(p => Math.round(p[1])));
    check("boxcar produces intermediate levels between the rails", levels.size > 2,
          levels.size + " distinct levels");

    // And it must stay inside the rails rather than overshooting.
    const lo = Math.min(q0.vTop, q0.vBot);
    const hi = Math.max(q0.vTop, q0.vBot);
    const inRange = bw0.every(p => p[1] >= lo - 0.5 && p[1] <= hi + 0.5);
    check("boxcar stays within the two rails", inRange);
  }
}

console.log("\n=======================");
console.log(`${checks} checks, ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
