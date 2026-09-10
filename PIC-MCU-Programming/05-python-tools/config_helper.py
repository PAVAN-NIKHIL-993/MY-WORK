#!/usr/bin/env python3
"""config_helper.py — print a safe `#pragma config` block for workspace chips.

Usage:
    python config_helper.py --chip 16F877A --osc HS
    python config_helper.py --chip 16F18345
    python config_helper.py --chip 18F45K22 --list    (show osc options)

This prints the same tested blocks used in 02-basics/03-intermediate, with
notes. For full GUI control use MPLAB X: Window -> Target Memory Views ->
Configuration Bits -> Generate Source Code.
"""

import argparse

BLOCKS = {
    "16F877A": {
        "desc": "PIC16F877A (classic, external crystal typical)",
        "oscs": ("HS", "XT", "LP", "EXTRC"),
        "block": [
            "#pragma config FOSC = {osc}     // HS: crystal >= 4 MHz (e.g. 20 MHz)",
            "#pragma config WDTE = OFF    // watchdog off while learning",
            "#pragma config PWRTE = ON    // power-up timer on (safer startup)",
            "#pragma config BOREN = ON    // brown-out reset on",
            "#pragma config LVP = OFF     // program with PICkit (HVP)",
            "#pragma config CPD = OFF     // EEPROM protection off (dev)",
            "#pragma config WRT = OFF     // flash write protection off (dev)",
            "#pragma config CP = OFF      // code protection off (dev)",
        ],
    },
    "16F18345": {
        "desc": "PIC16F18345 (modern, internal oscillator)",
        "oscs": ("INT",),
        "block": [
            "#pragma config FEXTOSC = OFF     // no external oscillator",
            "#pragma config RSTOSC = HFINTOSC // start on HFINTOSC, set OSCFRQ in code",
            "#pragma config MCLRE = ON        // MCLR enabled (10k pull-up!)",
            "#pragma config WDTE = OFF        // watchdog off while learning",
            "#pragma config LVP = OFF         // program with PICkit (HVP)",
        ],
    },
    "18F45K22": {
        "desc": "PIC18F45K22 (modern, more memory; internal osc starter)",
        "oscs": ("INT", "HS"),
        "block": [
            "// Starter block: internal oscillator. VERIFY in MPLAB X",
            "// Configuration Bits window before shipping!",
            "#pragma config FOSC = INTIO67   // internal osc, RA6/RA7 as I/O",
            "#pragma config PLLCFG = OFF     // 4x PLL off",
            "#pragma config PRICLKEN = ON    // primary clock can be disabled in sleep",
            "#pragma config FCMEN = OFF      // fail-safe monitor off (dev)",
            "#pragma config IESO = OFF       // internal/external switchover off",
            "#pragma config PWRTEN = ON      // power-up timer on",
            "#pragma config BOREN = SBORDIS  // brown-out on (software bit)",
            "#pragma config WDTEN = OFF      // watchdog off while learning",
            "#pragma config LVP = OFF        // program with PICkit (HVP)",
            "#pragma config MCLRE = EXTMCLR  // MCLR pin enabled",
            "#pragma config CP0 = OFF        // code protection off (dev)",
        ],
    },
}


def main() -> None:
    ap = argparse.ArgumentParser(description="PIC #pragma config helper")
    ap.add_argument("--chip", required=True, choices=sorted(BLOCKS),
                    help="Target chip")
    ap.add_argument("--osc", default=None, help="Oscillator choice (chip-dependent)")
    ap.add_argument("--list", action="store_true", help="List osc options and exit")
    args = ap.parse_args()

    info = BLOCKS[args.chip]
    if args.list:
        print(f"{args.chip}: {info['desc']}")
        print("osc options:", ", ".join(info["oscs"]))
        return

    osc = args.osc or info["oscs"][0]
    if osc not in info["oscs"]:
        print(f"ERROR: osc '{osc}' invalid for {args.chip}. "
              f"Options: {', '.join(info['oscs'])}")
        raise SystemExit(2)

    print(f"// {info['desc']}  |  osc={osc}")
    print(f"// Paste at the top of main.c (replace any existing config block)")
    for line in info["block"]:
        print(line.format(osc=osc))
    print("// Then set _XTAL_FREQ to match the REAL clock, and FOSC/OSCFRQ to match.")


if __name__ == "__main__":
    main()
