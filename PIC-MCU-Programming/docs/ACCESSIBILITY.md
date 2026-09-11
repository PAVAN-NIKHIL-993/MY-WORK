# ACCESSIBILITY

> There is **no GUI** in this topic (firmware + terminal CLIs + Markdown docs),
> so GUI-focused criteria (focus rings, contrast ratios, ARIA, touch targets)
> are **not applicable** — stated here instead of padded. What applies:

## 1. CLI accessibility (implemented)

- **stdout vs stderr separated:** data goes to stdout (pipeable to files/other
  tools); diagnostics + `ERROR:` go to stderr. Screen-reader and script friendly.
- **Exit codes 0/1/2/3** ([contract](TESTING.md#3-exit-codes-contract-tested))
  let assistive tooling detect failure without parsing prose.
- **No color-only signaling:** no ANSI colors at all; status is plain words
  (`OK`, `WARN`, `ERROR`, `FAIL`) — nothing is lost in monochrome or speech output.
- **`--help` on every tool;** errors include the fix (`run with --list…`).
- **ASCII-only output** (charts, banners) — renders in any terminal/reader.

## 2. Documentation accessibility

- Plain Markdown, semantic headings, tables with header rows, code fences with
  language tags; Mermaid diagrams always paired with a text equivalent nearby.
- No information conveyed by color or images alone (there are no images).

## 3. Hardware accessibility notes

- Heartbeat/activity LEDs mirror key states (sample, RX byte, scan) for
  deaf/hard-of-hearing bench use; no buzzer/audio cues are required anywhere.
- Firmware needs no precise timing interaction (buttons debounced; no
  double-click patterns).

## 4. Known limitations

- MPLAB X IDE accessibility is inherited from Microchip's product (out of scope).
- Oscilloscope-based debugging steps assume sighted use; UART-text equivalents
  exist for every waveform check (echo text, scan text, CSV stream).
