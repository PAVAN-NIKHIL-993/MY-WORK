// ---------------------------------------------------------------------------
// web_ui.h - the dashboard, served from flash as a single self-contained page.
//
// Kept in its own translation unit so the .ino stays readable and so the HTML can
// be edited without touching the measurement code. Stored with PROGMEM and served
// via send_P(), so it never occupies RAM.
// ---------------------------------------------------------------------------
#pragma once

#include <Arduino.h>

extern const char kIndexHtml[] PROGMEM;
