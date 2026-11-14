// ---------------------------------------------------------------------------
// Verifies that firmware/esp32_web_scope/web_ui.cpp is valid C++ and that the
// dashboard page survived being embedded in a raw string literal.
//
// This is not a substitute for compiling the sketch: it only builds the one
// translation unit that contains the HTML. But it does catch the class of error
// that is otherwise invisible until a device boots -- a stray delimiter, a
// truncated literal, or an edit made to the page and not to the embedded copy.
//
// Build:  make embedded
// ---------------------------------------------------------------------------

#include <cstdio>
#include <cstring>

#include "web_ui.h"

namespace {
int g_checks = 0;
int g_failures = 0;

void check(const char* name, bool ok, const char* detail = "") {
  ++g_checks;
  if (!ok) {
    ++g_failures;
    if (detail[0]) {
      printf("  FAIL %s  (%s)\n", name, detail);
    } else {
      printf("  FAIL %s\n", name);
    }
  }
}

bool contains(const char* haystack, const char* needle) {
  return strstr(haystack, needle) != nullptr;
}
}  // namespace

int main() {
  printf("embedded dashboard checks\n=========================\n");

  const size_t len = strlen(kIndexHtml);

  check("the literal is not empty", len > 1000);
  check("it starts with a doctype", strncmp(kIndexHtml, "<!DOCTYPE html>", 15) == 0);
  // The page ends with a newline, so compare against the last non-space run.
  {
    size_t end = len;
    while (end > 0 && (kIndexHtml[end - 1] == '\n' || kIndexHtml[end - 1] == '\r' ||
                       kIndexHtml[end - 1] == ' ' || kIndexHtml[end - 1] == '\t')) {
      --end;
    }
    const bool ok = end >= 7 && strncmp(kIndexHtml + end - 7, "</html>", 7) == 0;
    check("it ends with a closing html tag", ok);
  }

  // Balanced structural tags: each must appear exactly once.
  check("exactly one opening <script>", [&] {
    int n = 0;
    for (const char* p = kIndexHtml; (p = strstr(p, "<script>")); ++p) ++n;
    return n == 1;
  }());
  check("exactly one closing </script>", [&] {
    int n = 0;
    for (const char* p = kIndexHtml; (p = strstr(p, "</script>")); ++p) ++n;
    return n == 1;
  }());

  // Content that must be present: the honest label and the essentials.
  check("labels the trace as reconstructed", contains(kIndexHtml, "reconstructed pulse train"));
  check("documents the two-port behaviour", contains(kIndexHtml, "function wsUrl()"));
  check("exposes formatters for tests", contains(kIndexHtml, "window.fmtFreq"));
  check("has the no-signal overlay", contains(kIndexHtml, "No signal detected"));
  check("declares the input voltage limit", contains(kIndexHtml, "3.3 V max"));
  check("mentions the 6-8 kHz ADC limit in a comment",
        contains(kIndexHtml, "6-8 kHz") || contains(kIndexHtml, "6-8"));

  // The raw-string delimiter must not occur inside the page, or the literal
  // would end early and the rest of the file would fail to compile (or, worse,
  // silently compile into something else).
  check("no delimiter collision inside the page", !contains(kIndexHtml, ")HTMLPAGE"));

  printf("\n=========================\n");
  printf("%d checks, %d failure(s)\n", g_checks, g_failures);
  return g_failures == 0 ? 0 : 1;
}
