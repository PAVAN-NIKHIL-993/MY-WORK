kicadEESchema Schematic File Version 4
EELAYER 30 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title "Ultrasonic Mist Maker - 108kHz Driver, 555 astable + AO3400A"
Date "2025-11-28"
Rev "2.0"
Comp "Corrected design - see docs/CORRECTIONS.md"
Comment1 "5V USB Type-C input, 108kHz ultrasonic atomizer driver"
Comment2 "Rev 1 BOM had resistor/inductor/timing errors; Rev 2 fixes them"
Comment3 "NOT the original module IC - a documented 555 alternative"
Comment4 ""
$EndDescr

# ---------------------------------------------------------------------------
# USB-C 5V power input with CC resistors (needed for a Type-C receptacle)
# ---------------------------------------------------------------------------
$Comp
L Connector:USB_C_Receptacle_USB2.0 J1
U 1 1 60000001
P 1500 3000
F 0 "J1" H 1500 4200 50 0000 C CNN
F 1 "USB_C_Receptacle_USB2.0" H 1500 4110 50 0000 C CNN
F 2 "Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12" H 1500 3000 50 0001 C CNN
F 3 "~" H 1500 3000 50 0001 C CNN
	1	1500 3000
	1	0	0	-1
$EndComp

# CC1/CC2 5.1k pulldowns - REQUIRED or a USB-C charger will not deliver 5V
$Comp
L Device:R R5
U 1 1 60000002
P 2400 2600
F 0 "R5" H 2470 2646 50 0000 L CNN
F 1 "5k1" H 2470 2555 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 2400 2600 50 0001 C CNN
F 3 "~" H 2400 2600 50 0001 C CNN
	1	2400 2600
	1	0	0	-1
$EndComp

$Comp
L Device:R R6
U 1 1 60000003
P 3000 2600
F 0 "R6" H 3070 2646 50 0000 L CNN
F 1 "5k1" H 3070 2555 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 3000 2600 50 0001 C CNN
F 3 "~" H 3000 2600 50 0001 C CNN
	1	3000 2600
	1	0	0	-1
$EndComp

$Comp
L power:GND #PWR01
U 1 1 60000004
P 2400 3300
F 0 "#PWR01" H 2400 3150 50 0001 C CNN
F 1 "GND" H 2405 3227 50 0000 C CNN
F 2 "" H 2400 3300 50 0001 C CNN
F 3 "" H 2400 3300 50 0001 C CNN
	1	2400 3300
	1	0	0	-1
$EndComp

$Comp
L power:GND #PWR02
U 1 1 60000005
P 3000 3300
F 0 "#PWR02" H 3000 3150 50 0001 C CNN
F 1 "GND" H 3005 3227 50 0000 C CNN
F 2 "" H 3000 3300 50 0001 C CNN
F 3 "" H 3000 3300 50 0001 C CNN
	1	3000 3300
	1	0	0	-1
$EndComp

Wire Wire Line
	2400 2600 2400 3300
Wire Wire Line
	3000 2600 3000 3300

# ---------------------------------------------------------------------------
# VBUS rail, resettable fuse and bulk decoupling
# ---------------------------------------------------------------------------
$Comp
L Device:Polyfuse F1
U 1 1 60000006
P 1500 4600
F 0 "F1" H 1500 4746 50 0000 C CNN
F 1 "500mA hold" H 1500 4655 50 0000 C CNN
F 2 "Fuse:Fuse_1206_3216Metric" H 1500 4600 50 0001 C CNN
F 3 "~" H 1500 4600 50 0001 C CNN
	1	1500 4600
	1	0	0	-1
$EndComp

# 500mA hold for a 300mA load: 1.67x margin. A 300mA hold part would nuisance-trip.

$Comp
L Device:C C3
U 1 1 60000007
P 2400 5600
F 0 "C3" H 2515 5646 50 0000 L CNN
F 1 "100uF/16V" H 2515 5555 50 0000 L CNN
F 2 "Capacitor_SMD:CP_Elec_6.3x5.4" H 2400 5600 50 0001 C CNN
F 3 "~" H 2400 5600 50 0001 C CNN
	1	2400 5600
	1	0	0	-1
$EndComp

$Comp
L Device:C C1
U 1 1 60000008
P 3000 5600
F 0 "C1" H 3115 5646 50 0000 L CNN
F 1 "100nF" H 3115 5555 50 0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 3000 5600 50 0001 C CNN
F 3 "~" H 3000 5600 50 0001 C CNN
	1	3000 5600
	1	0	0	-1
$EndComp

$Comp
L power:+5V #PWR03
U 1 1 60000009
P 2400 4900
F 0 "#PWR03" H 2400 4750 50 0001 C CNN
F 1 "+5V" H 2415 4873 50 0000 C CNN
F 2 "" H 2400 4900 50 0001 C CNN
F 3 "" H 2400 4900 50 0001 C CNN
	1	2400 4900
	1	0	0	-1
$EndComp

$Comp
L power:+5V #PWR04
U 1 1 6000000A
P 3000 4900
F 0 "#PWR04" H 3000 4750 50 0001 C CNN
F 1 "+5V" H 3015 4873 50 0000 C CNN
F 2 "" H 3000 4900 50 0001 C CNN
F 3 "" H 3000 4900 50 0001 C CNN
	1 3000 4900
	1	0	0	-1
$EndComp

$Comp
L power:GND #PWR05
U 1 1 6000000B
P 2400 6200
F 0 "#PWR05" H 2400 6050 50 0001 C CNN
F 1 "GND" H 2405 6127 50 0000 C CNN
F 2 "" H 2400 6200 50 0001 C CNN
F 3 "" H 2400 6200 50 0001 C CNN
	1 2400 6200
	1	0	0	-1
$EndComp

$Comp
L power:GND #PWR06
U 1 1 6000000C
P 3000 6200
F 0 "#PWR06" H 3000 6050 50 0001 C CNN
F 1 "GND" H 3005 6127 50 0000 C CNN
F 2 "" H 3000 6200 50 0001 C CNN
F 3 "" H 3000 6200 50 0001 C CNN
	1 3000 6200
	1 0 0	-1
$EndComp

Wire Wire Line
	1500 3000 1500 4400
Wire Wire Line
	1500 4800 2400 4900
Wire Wire Line
	2400 4900 3000 4900
Wire Wire Line
	2400 5300 2400 4900
Wire Wire Line
	3000 5300 3000 4900
Wire Wire Line
	2400 5900 2400 6200
Wire Wire Line
	3000 5900 3000 6200
Connection ~ 2400 4900

# ---------------------------------------------------------------------------
# NE555 astable carrier generator (~107.5 kHz)
#   f = 1.44 / ((Ra + 2*Rb) * C)     Ra = R3 = 1k0, Rb = R4 = 6k2, C = C2 = 1nF
#   duty = (Ra + Rb) / (Ra + 2*Rb) = 53.7 %
# ---------------------------------------------------------------------------
$Comp
L Timer:NE555P U4
U 1 1 6000000D
P 5200 4000
F 0 "U4" H 5200 5100 50 0000 C CNN
F 1 "NE555P" H 5200 5009 50 0000 C CNN
F 2 "Package_DIP:DIP-8_W7.62mm" H 5200 4000 50 0001 C CNN
F 3 "~" H 5200 4000 50 0001 C CNN
	1	5200 4000
	1	0	0	-1
$EndComp

$Comp
L Device:R R3
U 1 1 6000000E
P 3800 3400
F 0 "R3" H 3870 3446 50 0000 L CNN
F 1 "1k0" H 3870 3355 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 3800 3400 50 0001 C CNN
F 3 "~" H 3800 3400 50 0001 C CNN
	1 3800 3400
	1	0	0	-1
$EndComp

$Comp
L Device:R R4
U 1 1 6000000F
P 3800 4400
F 0 "R4" H 3870 4446 50 0000 L CNN
F 1 "6k2" H 3870 4355 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 3800 4400 50 0001 C CNN
F 3 "~" H 3800 4400 50 0001 C CNN
	1 3800 4400
	1	0	0	-1
$EndComp

$Comp
L Device:C C2
U 1 1 60000010
P 4600 5200
F 0 "C2" H 4715 5246 50 0000 L CNN
F 1 "1nF" H 4715 5155 50 0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 4600 5200 50 0001 C CNN
F 3 "~" H 4600 5200 50 0001 C CNN
	1 4600 5200
	1	0	0	-1
$EndComp

# Control pin 5 decoupling: 10nF is the datasheet-specified value
$Comp
L Device:C C4
U 1 1 60000011
P 6400 2900
F 0 "C4" H 6515 2946 50 0000 L CNN
F 1 "10nF" H 6515 2855 50 0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 6400 2900 50 0001 C CNN
F 3 "~" H 6400 2900 50 0001 C CNN
	1 6400 2900
	1	0	0	-1
$EndComp

$Comp
L power:GND #PWR07
U 1 1 60000012
P 6400 3300
F 0 "#PWR07" H 6400 3150 50 0001 C CNN
F 1 "GND" H 6405 3227 50 0000 C CNN
F 2 "" H 6400 3300 50 0001 C CNN
F 3 "" H 6400 3300 50 0001 C CNN
	1 6400 3300
	1 0 0 -1
$EndComp

Wire Wire Line
	3800 3200 3800 3000
Wire Wire Line
	3800 3000 5200 3000
Wire Wire Line
	3800 3600 3800 4200
Wire Wire Line
	3800 4600 3800 5000
Wire Wire Line
	4600 5000 4600 5200
Wire Wire Line
	4600 5400 4600 5600
Wire Wire Line
	6400 2900 6400 2600
Wire Wire Line
	6400 3100 6400 3300

$Comp
L power:+5V #PWR08
U 1 1 60000013
P 5200 2500
F 0 "#PWR08" H 5200 2350 50 0001 C CNN
F 1 "+5V" H 5215 2473 50 0000 C CNN
F 2 "" H 5200 2500 50 0001 C CNN
F 3 "" H 5200 2500 50 0001 C CNN
	1 5200 2500
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR09
U 1 1 60000014
P 5200 5600
F 0 "#PWR09" H 5200 5450 50 0001 C CNN
F 1 "GND" H 5205 5527 50 0000 C CNN
F 2 "" H 5200 5600 50 0001 C CNN
F 3 "" H 5200 5600 50 0001 C CNN
	1 5200 5600
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR010
U 1 1 60000015
P 3800 5000
F 0 "#PWR010" H 3800 4850 50 0001 C CNN
F 1 "GND" H 3805 4927 50 0000 C CNN
F 2 "" H 3800 5000 50 0001 C CNN
F 3 "" H 3800 5000 50 0001 C CNN
	1 3800 5000
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR011
U 1 1 60000016
P 4600 5600
F 0 "#PWR011" H 4600 5450 50 0001 C CNN
F 1 "GND" H 4605 5527 50 0000 C CNN
F 2 "" H 4600 5600 50 0001 C CNN
F 3 "" H 4600 5600 50 0001 C CNN
	1 4600 5600
	1 0 0 -1
$EndComp

# 100nF Vcc decoupling directly at the 555
$Comp
L Device:C C5
U 1 1 60000017
P 6400 4400
F 0 "C5" H 6515 4446 50 0000 L CNN
F 1 "100nF" H 6515 4355 50 0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 6400 4400 50 0001 C CNN
F 3 "~" H 6400 4400 50 0001 C CNN
	1 6400 4400
	1 0 0 -1
$EndComp

$Comp
L power:+5V #PWR012
U 1 1 60000018
P 6400 4000
F 0 "#PWR012" H 6400 3850 50 0001 C CNN
F 1 "+5V" H 6415 3973 50 0000 C CNN
F 2 "" H 6400 4000 50 0001 C CNN
F 3 "" H 6400 4000 50 0001 C CNN
	1 6400 4000
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR013
U 1 1 60000019
P 6400 4800
F 0 "#PWR013" H 6400 4650 50 0001 C CNN
F 1 "GND" H 6405 4727 50 0000 C CNN
F 2 "" H 6400 4800 50 0001 C CNN
F 3 "" H 6400 4800 50 0001 C CNN
	1 6400 4800
	1 0 0 -1
$EndComp

Wire Wire Line
	6400 4000 6400 4200
Wire Wire Line
	6400 4600 6400 4800

# ---------------------------------------------------------------------------
# Gate drive: 555 OUT (pin 3) -> R7 100R -> gate of AO3400A
# R7 damps the gate ringing that a hard 555 edge causes; 100R -> ~32ns charge
# ---------------------------------------------------------------------------
$Comp
L Device:R R7
U 1 1 6000001A
P 7600 4000
F 0 "R7" H 7670 4046 50 0000 L CNN
F 1 "100R" H 7670 3955 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 7600 4000 50 0001 C CNN
F 3 "~" H 7600 4000 50 0001 C CNN
	1 7600 4000
	1 0 0 -1
$EndComp

# Pull-down keeps the FET off while the 555 is starting up
$Comp
L Device:R R8
U 1 1 6000001B
P 8400 4600
F 0 "R8" H 8470 4646 50 0000 L CNN
F 1 "10k" H 8470 4555 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 8400 4600 50 0001 C CNN
F 3 "~" H 8400 4600 50 0001 C CNN
	1 8400 4600
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR014
U 1 1 6000001C
P 8400 5000
F 0 "#PWR014" H 8400 4850 50 0001 C CNN
F 1 "GND" H 8405 4927 50 0000 C CNN
F 2 "" H 8400 5000 50 0001 C CNN
F 3 "" H 8400 5000 50 0001 C CNN
	1 8400 5000
	1 0 0 -1
$EndComp

Wire Wire Line
	5200 4000 7400 4000
Wire Wire Line
	7800 4000 8400 4000
Wire Wire Line
	8400 4000 8400 4400
Wire Wire Line
	8400 4800 8400 5000

# ---------------------------------------------------------------------------
# Power switch Q1 (AO3400A, N-channel MOSFET, 30V/5.7A, SOT-23)
# NOTE: this is a MOSFET, NOT the NPN the first BOM claimed.
# ---------------------------------------------------------------------------
$Comp
L Device:Q_NMOS_GSD Q1
U 1 1 6000001D
P 8400 4000
F 0 "Q1" H 8620 4072 50 0000 L CNN
F 1 "AO3400A" H 8620 3981 50 0000 L CNN
F 2 "Package_TO_SOT_SMD:SOT-23" H 8560 3900 50 0001 C CNN
F 3 "~" H 8400 4000 50 0001 C CNN
	1 8400 4000
	1 0 0 -1
$EndComp

# ---------------------------------------------------------------------------
# Resonant tank: L1 1.0mH from +5V to drain, D1 flyback clamp, C6 DC block,
# piezo transducer on PH2.0. L = 1/((2*pi*f)^2 * Cdisc) -> 107kHz at 2.2nF
# ---------------------------------------------------------------------------
$Comp
L Device:L L1
U 1 1 6000001E
P 9000 3000
F 0 "L1" H 9070 3046 50 0000 L CNN
F 1 "1.0mH" H 9070 2955 50 0000 L CNN
F 2 "Inductor_TH:L_Axial_L16.0mm_D9.0mm_P20.32mm_Horizontal" H 9000 3000 50 0001 C CNN
F 3 "~" H 9000 3000 50 0001 C CNN
	1 9000 3000
	1 0 0 -1
$EndComp

$Comp
L power:+5V #PWR015
U 1 1 6000001F
P 9000 2400
F 0 "#PWR015" H 9000 2250 50 0001 C CNN
F 1 "+5V" H 9015 2373 50 0000 C CNN
F 2 "" H 9000 2400 50 0001 C CNN
F 3 "" H 9000 2400 50 0001 C CNN
	1 9000 2400
	1 0 0 -1
$EndComp

Wire Wire Line
	9000 2400 9000 2800
Wire Wire Line
	9000 3200 9000 3800
Wire Wire Line
	8400 4200 9000 3800

# Flyback / clamp diode across the inductor
$Comp
L Device:D_Schottky D1
U 1 1 60000020
P 9800 3000
F 0 "D1" H 9910 3046 50 0000 L CNN
F 1 "SS34" H 9910 2955 50 0000 L CNN
F 2 "Diode_SMD:D_SMA" H 9800 3000 50 0001 C CNN
F 3 "~" H 9800 3000 50 0001 C CNN
	1 9800 3000
	1 0 0 -1
$EndComp

Wire Wire Line
	9000 2400 9800 2400
Wire Wire Line
	9800 2400 9800 2800
Wire Wire Line
	9800 3200 9800 3800
Wire Wire Line
	9800 3800 9000 3800
Connection ~ 9000 3800

# DC blocking capacitor to the transducer
$Comp
L Device:C C6
U 1 1 60000021
P 9700 4600
F 0 "C6" H 9815 4646 50 0000 L CNN
F 1 "1uF/25V" H 9815 4555 50 0000 L CNN
F 2 "Capacitor_SMD:C_0805_2012Metric" H 9700 4600 50 0001 C CNN
F 3 "~" H 9700 4600 50 0001 C CNN
	1 9700 4600
	1 0 0 -1
$EndComp

Wire Wire Line
	9000 3800 9000 4400
Wire Wire Line
	9000 4400 9700 4400
Wire Wire Line
	9700 4400 9700 4400
Wire Wire Line
	9700 4800 9700 5200

# Output connector to the piezo disc
$Comp
L Connector:Conn_01x02 J2
U 1 1 60000022
P 10300 5600
F 0 "J2" H 10300 5900 50 0000 C CNN
F 1 "PH2.0 2-pin" H 10300 5810 50 0000 C CNN
F 2 "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical" H 10300 5600 50 0001 C CNN
F 3 "~" H 10300 5600 50 0001 C CNN
	1 10300 5600
	1 0 0 -1
$EndComp

Wire Wire Line
	9700 5200 9700 5400
Wire Wire Line
	9700 5400 10300 5400

$Comp
L power:GND #PWR016
U 1 1 60000023
P 11000 5400
F 0 "#PWR016" H 11000 5250 50 0001 C CNN
F 1 "GND" H 11005 5327 50 0000 C CNN
F 2 "" H 11000 5400 50 0001 C CNN
F 3 "" H 11000 5400 50 0001 C CNN
	1 11000 5400
	1 0 0 -1
$EndComp

Wire Wire Line
	10300 5400 11000 5400

# ---------------------------------------------------------------------------
# Power indicator LED
# ---------------------------------------------------------------------------
$Comp
L Device:R R9
U 1 1 60000024
P 4600 2400
F 0 "R9" H 4670 2446 50 0000 L CNN
F 1 "1k" H 4670 2355 50 0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" H 4600 2400 50 0001 C CNN
F 3 "~" H 4600 2400 50 0001 C CNN
	1 4600 2400
	1 0 0 -1
$EndComp

$Comp
L Device:LED D2
U 1 1 60000025
P 4600 1800
F 0 "D2" H 4680 1846 50 0000 L CNN
F 1 "LED" H 4680 1755 50 0000 L CNN
F 2 "LED_SMD:LED_0603_1608Metric" H 4600 1800 50 0001 C CNN
F 3 "~" H 4600 1800 50 0001 C CNN
	1 4600 1800
	1 0 0 -1
$EndComp

$Comp
L power:+5V #PWR017
U 1 1 60000026
P 4600 1400
F 0 "#PWR017" H 4600 1250 50 0001 C CNN
F 1 "+5V" H 4615 1473 50 0000 C CNN
F 2 "" H 4600 1400 50 0001 C CNN
F 3 "" H 4600 1400 50 0001 C CNN
	1 4600 1400
	1 0 0 -1
$EndComp

$Comp
L power:GND #PWR018
U 1 1 60000027
P 4600 2900
F 0 "#PWR018" H 4600 2750 50 0001 C CNN
F 1 "GND" H 4605 2827 50 0000 C CNN
F 2 "" H 4600 2900 50 0001 C CNN
F 3 "" H 4600 2900 50 0001 C CNN
	1 4600 2900
	1 0 0 -1
$EndComp

Wire Wire Line
	4600 1400 4600 1600
Wire Wire Line
	4600 2000 4600 2200
Wire Wire Line
	4600 2600 4600 2900

# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------
Text Notes 1000 1100 0    79   ~ 16
5V USB-C Input + Protection
Text Notes 3500 1500 0    79   ~ 16
Power LED
Text Notes 3500 5700 0    79   ~ 16
555 Astable 107.5kHz
Text Notes 7000 5700 0    79   ~ 16
Gate Drive + MOSFET Switch
Text Notes 9200 2000 0    79   ~ 16
Resonant Tank + Transducer

$EndSCHEMATC
