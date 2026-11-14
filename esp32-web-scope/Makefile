# Verification entry points for esp32-web-scope.
#
#   make test      everything that can be verified without ESP32 hardware
#   make core      compile and run the portable C++ measurement tests
#   make embedded  check the embedded page is in sync and survived embedding
#   make dashboard headless test of the web page (needs node + sibling jsdom)
#   make netlist   check the carrier netlist against the BOM
#   make clean     remove build products
#
# The ESP32 firmware itself cannot be built here: there is no xtensa toolchain
# in this environment. See docs/BUILD.md.

CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -Wno-comment -I.
BUILD    ?= build

CORE_SRC  = firmware/esp32_web_scope/scope_core.cpp
TEST_SRC  = test/test_core.cpp
TEST_BIN  = $(BUILD)/test_core
UI_BIN    = $(BUILD)/test_embedded_ui

.PHONY: test core embedded dashboard netlist clean all

all: test

# ---------------------------------------------------------------------------
# Portable measurement core
# ---------------------------------------------------------------------------
$(TEST_BIN): $(CORE_SRC) $(TEST_SRC) firmware/esp32_web_scope/scope_core.h
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -o $(TEST_BIN) $(TEST_SRC) $(CORE_SRC)

core: $(TEST_BIN)
	@./$(TEST_BIN)

# ---------------------------------------------------------------------------
# The embedded dashboard: compiles web_ui.cpp on the host and checks the page
# survived embedding. Catches a broken raw-string literal before it reaches a
# device, which is otherwise invisible until boot.
# ---------------------------------------------------------------------------
$(UI_BIN): firmware/esp32_web_scope/web_ui.cpp test/test_embedded_ui.cpp \
           firmware/esp32_web_scope/web_ui.h test/shim/Arduino.h \
           test/dashboard_preview.html tools/embed_page.py
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -Itest/shim -Ifirmware/esp32_web_scope -o $(UI_BIN) \
	  test/test_embedded_ui.cpp firmware/esp32_web_scope/web_ui.cpp

embedded: $(UI_BIN)
	@python3 tools/embed_page.py --check
	@./$(UI_BIN)

# ---------------------------------------------------------------------------
# Web dashboard: headless DOM test of the real page
# ---------------------------------------------------------------------------
dashboard:
	@node test/test_dashboard.mjs

# ---------------------------------------------------------------------------
# Carrier board netlist
# ---------------------------------------------------------------------------
netlist:
	@python3 tools/check_netlist.py

# ---------------------------------------------------------------------------
# Everything
# ---------------------------------------------------------------------------
test: core embedded dashboard netlist
	@echo ""
	@echo "all verifiable checks passed"
	@echo "(the ESP32 firmware itself is NOT compiled - see docs/BUILD.md)"

clean:
	rm -rf $(BUILD)
