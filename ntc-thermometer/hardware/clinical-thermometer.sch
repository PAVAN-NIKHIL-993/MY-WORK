kicadEESchema Schematic File Version 4
EELAYER 30 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title "Clinical Digital Thermometer - STC15W408AS"
Date "2025-01-30"
Rev "1.0"
Comp "Real Production Design"
Comment1 "Based on STC15W408AS 8051 MCU"
Comment2 "NTC thermistor + direct LCD drive"
Comment3 "±0.1°C accuracy after factory calibration"
Comment4 ""
$EndDescr

# Power Source
$Comp
L Device:Battery_Cell BT1
U 1 1 60000001
P 1000 1500
F 0 "BT1" H 1118 1596 50  0000 L CNN
F 1 "CR2032" H 1118 1505 50  0000 L CNN
F 2 "Battery:BatteryHolder_Linx_BAT-HLD-001" V 1000 1560 50  0001 C CNN
F 3 "~" V 1000 1560 50  0001 C CNN
    1    1000 1500
    1    0    0    -1  
$EndComp

# Power and Ground symbols
$Comp
L power:+3V0 #PWR01
U 1 1 60000002
P 1000 1200
F 0 "#PWR01" H 1000 1050 50  0001 C CNN
F 1 "+3V0" H 1015 1373 50  0000 C CNN
F 2 "" H 1000 1200 50  0001 C CNN
F 3 "" H 1000 1200 50  0001 C CNN
    1    1000 1200
    1    0    0    -1  
$EndComp

$Comp
L power:GND #PWR02
U 1 1 60000003
P 1000 1800
F 0 "#PWR02" H 1000 1550 50  0001 C CNN
F 1 "GND" H 1005 1627 50  0000 C CNN
F 2 "" H 1000 1800 50  0001 C CNN
F 3 "" H 1000 1800 50  0001 C CNN
    1    1000 1800
    1    0    0    -1  
$EndComp

Wire Wire Line
    1000 1200 1000 1300
Wire Wire Line
    1000 1600 1000 1800

# Decoupling Capacitors
$Comp
L Device:C C1
U 1 1 60000004
P 1500 1500
F 0 "C1" H 1615 1546 50  0000 L CNN
F 1 "100nF" H 1615 1455 50  0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 1538 1350 50  0001 C CNN
F 3 "~" H 1500 1500 50  0001 C CNN
    1    1500 1500
    1    0    0    -1  
$EndComp

$Comp
L Device:C C2
U 1 1 60000005
P 2000 1500
F 0 "C2" H 2115 1546 50  0000 L CNN
F 1 "10uF" H 2115 1455 50  0000 L CNN
F 2 "Capacitor_SMD:C_0603_1608Metric" H 2038 1350 50  0001 C CNN
F 3 "~" H 2000 1500 50  0001 C CNN
    1    2000 1500
    1    0    0    -1  
$EndComp

$Comp
L power:+3V0 #PWR03
U 1 1 60000006
P 1500 1200
F 0 "#PWR03" H 1500 1050 50  0001 C CNN
F 1 "+3V0" H 1515 1373 50  0000 C CNN
F 2 "" H 1500 1200 50  0001 C CNN
F 3 "" H 1500 1200 50  0001 C CNN
    1    1500 1200
    1    0    0    -1  
$EndComp

$Comp
L power:GND #PWR04
U 1 1 60000007
P 1500 1800
F 0 "#PWR04" H 1500 1550 50  0001 C CNN
F 1 "GND" H 1505 1627 50  0000 C CNN
F 2 "" H 1500 1800 50  0001 C CNN
F 3 "" H 1500 1800 50  0001 C CNN
    1    1500 1800
    1    0    0    -1  
$EndComp

Wire Wire Line
    1500 1200 1500 1350
Wire Wire Line
    1500 1650 1500 1800
Wire Wire Line
    2000 1350 2000 1200
Wire Wire Line
    2000 1200 1500 1200
Connection ~ 1500 1200
Wire Wire Line
    2000 1650 2000 1800
Wire Wire Line
    2000 1800 1500 1800
Connection ~ 1500 1800

# Microcontroller STC15W408AS
$Comp
L MCU_8051:STC15W408AS U1
U 1 1 60000008
P 4500 3500
F 0 "U1" H 4500 4681 50  0000 C CNN
F 1 "STC15W408AS" H 4500 4590 50  0000 C CNN
F 2 "Package_SO:SOP-20_7x12.8mm_P1.27mm" H 4500 3500 50  0001 C CNN
F 3 "http://www.stcmicro.com/datasheet/STC15W408AS.pdf" H 4500 3500 50  0001 C CNN
    1    4500 3500
    1    0    0    -1  
$EndComp

# MCU Power Pins
$Comp
L power:+3V0 #PWR05
U 1 1 60000009
P 4500 2400
F 0 "#PWR05" H 4500 2250 50  0001 C CNN
F 1 "+3V0" H 4515 2573 50  0000 C CNN
F 2 "" H 4500 2400 50  0001 C CNN
F 3 "" H 4500 2400 50  0001 C CNN
    1    4500 2400
    1    0    0    -1  
$EndComp

$Comp
L power:GND #PWR06
U 1 1 6000000A
P 4500 4700
F 0 "#PWR06" H 4500 4450 50  0001 C CNN
F 1 "GND" H 4505 4527 50  0000 C CNN
F 2 "" H 4500 4700 50  0001 C CNN
F 3 "" H 4500 4700 50  0001 C CNN
    1    4500 4700
    1    0    0    -1  
$EndComp

Wire Wire Line
    4500 2400 4500 2600
Wire Wire Line
    4500 4400 4500 4700

# NTC Thermistor Voltage Divider
$Comp
L Device:R R1
U 1 1 6000000B
P 2500 2800
F 0 "R1" H 2570 2846 50  0000 L CNN
F 1 "100k 1%" H 2570 2755 50  0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" V 2430 2800 50  0001 C CNN
F 3 "~" H 2500 2800 50  0001 C CNN
    1    2500 2800
    1    0    0    -1  
$EndComp

$Comp
L Device:Thermistor_NTC RT1
U 1 1 6000000C
P 2500 3400
F 0 "RT1" H 2597 3446 50  0000 L CNN
F 1 "NTC 100k B3950" H 2597 3355 50  0000 L CNN
F 2 "Custom:NTC_Semitec_103AT" H 2500 3450 50  0001 C CNN
F 3 "~" H 2500 3450 50  0001 C CNN
    1    2500 3400
    1    0    0    -1  
$EndComp

$Comp
L power:+3V0 #PWR07
U 1 1 6000000D
P 2500 2500
F 0 "#PWR07" H 2500 2350 50  0001 C CNN
F 1 "+3V0" H 2515 2673 50  0000 C CNN
F 2 "" H 2500 2500 50  0001 C CNN
F 3 "" H 2500 2500 50  0001 C CNN
    1    2500 2500
    1    0    0    -1  
$EndComp

$Comp
L power:GND #PWR08
U 1 1 6000000E
P 2500 3700
F 0 "#PWR08" H 2500 3450 50  0001 C CNN
F 1 "GND" H 2505 3527 50  0000 C CNN
F 2 "" H 2500 3700 50  0001 C CNN
F 3 "" H 2500 3700 50  0001 C CNN
    1    2500 3700
    1    0    0    -1  
$EndComp

Wire Wire Line
    2500 2500 2500 2650
Wire Wire Line
    2500 2950 2500 3100
Wire Wire Line
    2500 3550 2500 3700

# ADC Input Connection
Wire Wire Line
    2500 3100 3200 3100
Connection ~ 2500 3100
Wire Wire Line
    2500 3100 2500 3250
Text Label 3200 3100 0    50   ~ 0
ADC_NTC
Wire Wire Line
    3700 3200 3200 3200
Text Label 3200 3200 0    50   ~ 0
ADC_NTC

# Power Button
$Comp
L Switch:SW_Push SW1
U 1 1 6000000F
P 2500 4500
F 0 "SW1" V 2546 4452 50  0000 R CNN
F 1 "POWER" V 2455 4452 50  0000 R CNN
F 2 "Button_Switch_SMD:SW_SPST_SKQG_WithStem" H 2500 4700 50  0001 C CNN
F 3 "~" H 2500 4700 50  0001 C CNN
    1    2500 4500
    0    -1   -1   0   
$EndComp

$Comp
L Device:R R2
U 1 1 60000010
P 2500 4100
F 0 "R2" H 2570 4146 50  0000 L CNN
F 1 "10k" H 2570 4055 50  0000 L CNN
F 2 "Resistor_SMD:R_0603_1608Metric" V 2430 4100 50  0001 C CNN
F 3 "~" H 2500 4100 50  0001 C CNN
    1    2500 4100
    1    0    0    -1  
$EndComp

$Comp
L power:GND #PWR09
U 1 1 60000011
P 2500 4900
F 0 "#PWR09" H 2500 4650 50  0001 C CNN
F 1 "GND" H 2505 4727 50  0000 C CNN
F 2 "" H 2500 4900 50  0001 C CNN
F 3 "" H 2500 4900 50  0001 C CNN
    1    2500 4900
    1    0    0    -1  
$EndComp

Wire Wire Line
    2500 3700 2500 3950
Wire Wire Line
    2500 4250 2500 4300
Wire Wire Line
    2500 4700 2500 4900
Wire Wire Line
    2500 4300 3200 4300
Connection ~ 2500 4300
Text Label 3200 4300 0    50   ~ 0
BTN_PWR
Wire Wire Line
    3700 3300 3200 3300
Text Label 3200 3300 0    50   ~ 0
BTN_PWR

# Piezo Buzzer
$Comp
L Device:Buzzer BZ1
U 1 1 60000012
P 6500 3100
F 0 "BZ1" H 6652 3129 50  0000 L CNN
F 1 "Piezo" H 6652 3038 50  0000 L CNN
F 2 "Buzzer_Beeper:Buzzer_Murata_PKM13EPYH" V 6475 3200 50  0001 C CNN
F 3 "~" V 6475 3200 50  0001 C CNN
    1    6500 3100
    1    0    0    -1  
$EndComp

$Comp
L Device:R R3
U 1 1 60000013
P 6000 3000
F 0 "R3" V 5793 3000 50  0000 C CNN
F 1 "1k" V 5884 3000 50  0000 C CNN
F 2 "Resistor_SMD:R_0603_1608Metric" V 5930 3000 50  0001 C CNN
F 3 "~" H 6000 3000 50  0001 C CNN
    1    6000 3000
    0    1    1    0   
$EndComp

$Comp
L power:GND #PWR010
U 1 1 60000014
P 6400 3400
F 0 "#PWR010" H 6400 3150 50  0001 C CNN
F 1 "GND" H 6405 3227 50  0000 C CNN
F 2 "" H 6400 3400 50  0001 C CNN
F 3 "" H 6400 3400 50  0001 C CNN
    1    6400 3400
    1    0    0    -1  
$EndComp

Wire Wire Line
    5300 3000 5850 3000
Wire Wire Line
    6150 3000 6400 3000
Wire Wire Line
    6400 3200 6400 3400
Text Label 5600 3000 0    50   ~ 0
BUZZER

# Custom LCD Display (Direct Drive)
Text Notes 7000 2500 0    79   ~ 16
Custom Segment LCD\n(Direct Multiplex Drive)

Wire Wire Line
    5300 3200 5800 3200
Wire Wire Line
    5300 3300 5800 3300
Wire Wire Line
    5300 3400 5800 3400
Wire Wire Line
    5300 3500 5800 3500
Wire Wire Line
    5300 3600 5800 3600
Wire Wire Line
    5300 3700 5800 3700
Wire Wire Line
    5300 3800 5800 3800
Wire Wire Line
    5300 3900 5800 3900

Text Label 5600 3200 0    50   ~ 0
LCD_SEG0
Text Label 5600 3300 0    50   ~ 0
LCD_SEG1
Text Label 5600 3400 0    50   ~ 0
LCD_SEG2
Text Label 5600 3500 0    50   ~ 0
LCD_SEG3
Text Label 5600 3600 0    50   ~ 0
LCD_COM0
Text Label 5600 3700 0    50   ~ 0
LCD_COM1
Text Label 5600 3800 0    50   ~ 0
LCD_SEG4
Text Label 5600 3900 0    50   ~ 0
LCD_SEG5

# LCD Symbol (Simplified - represents custom 14-seg display)
$Comp
L Display_Character:Custom_LCD LCD1
U 1 1 60000015
P 7500 3500
F 0 "LCD1" H 7500 4267 50  0000 C CNN
F 1 "3.5digit TN" H 7500 4176 50  0000 C CNN
F 2 "Custom:LCD_COG_14seg" H 7500 3500 50  0001 C CNN
F 3 "~" H 7500 3500 50  0001 C CNN
    1    7500 3500
    1    0    0    -1  
$EndComp

Wire Wire Line
    5800 3200 7000 3200
Wire Wire Line
    5800 3300 7000 3300
Wire Wire Line
    5800 3400 7000 3400
Wire Wire Line
    5800 3500 7000 3500
Wire Wire Line
    5800 3600 7000 3600
Wire Wire Line
    5800 3700 7000 3700

# Notes and Labels
Text Notes 1000 900  0    79   ~ 16
Power Supply
Text Notes 2300 2200 0    79   ~ 16
Temperature Sensor
Text Notes 2300 3900 0    79   ~ 16
User Interface
Text Notes 6300 2700 0    79   ~ 16
Audio Feedback

$EndSCHEMATC
