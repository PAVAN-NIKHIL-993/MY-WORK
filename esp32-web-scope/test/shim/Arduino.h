// Minimal stand-in for <Arduino.h>, used only to compile web_ui.cpp on a host so
// the embedded page can be checked without an ESP32 toolchain. It provides the
// handful of macros that file actually uses and nothing else.
#pragma once
#define PROGMEM
