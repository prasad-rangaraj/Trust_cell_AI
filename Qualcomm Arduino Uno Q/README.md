# 🔌 Low-Level Sensor Drivers & Device Interfaces Manual — Arduino Uno Q (STM32U585)

This document provides a highly detailed, professional engineering reference for the low-level sensor drivers and peripheral communications on the **Arduino Uno Q** board running **Zephyr RTOS v3.6**. These drivers manage core hardware registers, implement custom bit-banging communication protocols, execute structured Analog-to-Digital conversions, and calculate dynamic calibration metrics.

---

## 🏗️ Hardware Driver Registry & Interfaces

```
                          ┌────────────────────────┐
                          │   STM32U585 Peripheral │
                          └───────────┬────────────┘
                                      │
         ┌────────────┬───────────────┼───────────────┬────────────┐
         │ (GPIO PA12)│ (I2C1 PB6/7)  │ (ADC1 CH4)    │ (ADC1 CH5) │ (ADC1 CH0-3)
         ▼            ▼               ▼               ▼            ▼
     [DS18B20]    [MPU6050]       [ACS712]         [MQ-7]      [Resistors]
     Thermal      Vibration       Current          Outgassing  Voltage Div
     Probe        Sensor          Sensor           Gas Sensor  Taps
```

| Driver Node | Hardware bus / Pin | Zephyr Node Label | Resolution | Ingestion Rate |
| :--- | :--- | :--- | :--- | :--- |
| **DS18B20** | GPIO Pin `PA12` | `/ds18b20_ds` | 12-Bit | 10 Hz (100ms task) |
| **MPU-6050** | $I^2C$ PB6 (SCL), PB7 (SDA) | `&i2c1` | 16-Bit | 20 Hz (50ms task) |
| **ACS712** | ADC1 Channel `CH4` (PA4) | `&adc1` (CH4) | 12-Bit | 20 Hz (50ms task) |
| **MQ-7** | ADC1 Channel `CH5` (PA5) | `&adc1` (CH5) | 12-Bit | 2 Hz (500ms task) |
| **Volts Div**| ADC1 Channel `CH0-3` (PA0-3)| `&adc1` (CH0-3)| 12-Bit | 20 Hz (50ms task) |

---

## 💻 Driver Header Architecture
All drivers compile within the CMake framework of Zephyr RTOS and interface through these system headers:
```c
#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/drivers/adc.h>
#include <zephyr/sys/printk.h>
#include <math.h>
```

---

## 📚 Driver Implementations & Conversion Physics

### 1. DS18B20 Thermal Probe Driver (1-Wire Protocol)
Because the STM32U585 lacks a native hardware 1-Wire controller, this driver uses bit-banged GPIO delays to interact with the [DS18B20](file:///c:/ev%20vechile/Qualcomm%20Arduino%20Uno%20Q/driver_code/README.md) sensor.

#### A. Timing Diagram & Code Verification
The host pin `PA12` alternates between output mode (driving the line low) and input mode (releasing the line to pull high via an external $4.7\text{k}\Omega$ resistor).

```
         Reset Loop                           Write 1 Time Slot
Host  ──┐            ┌─────────               ────────┐      ┌────────
        │            │                                │      │
        └────────────┘                                └──────┘
         ◄──480us───► ◄─70us─►                        ◄─6us─► ◄─54us─►
```

```c
/* Low-level timing-critical write bit sequence */
static void onewire_write_bit(const struct gpio_dt_spec *spec, uint8_t bit) {
    gpio_pin_configure_dt(spec, GPIO_OUTPUT_INACTIVE); // Drive Low
    k_busy_wait(6); // Hold for tx initiation window
    
    if (bit) {
        gpio_pin_configure_dt(spec, GPIO_INPUT); // Release to pull up for '1'
        k_busy_wait(64);
    } else {
        k_busy_wait(64); // Hold low for '0'
        gpio_pin_configure_dt(spec, GPIO_INPUT);
    }
    k_busy_wait(2); // Recovery time slot
}
```

#### B. Conversion Physics
1. **Reset Sequence**: Transmits a bus reset signal.
2. **Device Address Bypass**: Sends command byte `0xCC` (Skip ROM) to address all devices on the bus.
3. **Trigger Value Scan**: Sends command byte `0x44` (Convert T) to start the temperature conversion.
4. **Data Acquisition**: Reads MSB and LSB bytes from the scratchpad using command byte `0xBE` (Read Scratchpad):
   $$\text{Temperature} = \frac{(\text{MSB} \ll 8) \mid \text{LSB}}{16.0}$$
   If $\text{MSB} \ \& \ 0xF800$, the value is negative. The driver performs a two's complement step before scaling.

---

### 2. MPU-6050 Acceleration & Vibration Driver (I2C)
Communicates via Zephyr's `<zephyr/drivers/i2c.h>` library on the I2C1 bus.

#### A. Hardware Register Specifications

| Register Address (Hex) | Register Name | Access Type | Config Value | Function Description |
| :--- | :--- | :--- | :--- | :--- |
| **`0x6B`** | `PWR_MGMT_1` | Read / Write | `0x00` | Power Management (removes device from sleep mode) |
| **`0x1B`** | `GYRO_CONFIG` | Read / Write | `0x00` | Sets Gyro Full-Scale Range ($\pm 250^\circ/\text{s}$, Sensitivity: $131\text{ LSB}/(^\circ/\text{s})$) |
| **`0x1C`** | `ACCEL_CONFIG`| Read / Write | `0x00` | Sets Accel Full-Scale Range ($\pm 2\text{g}$, Sensitivity: $16384\text{ LSB}/\text{g}$) |
| **`0x3B`** | `ACCEL_XOUT_H`| Read-Only | `Raw MSB` | Most Significant Byte of X-Axis Acceleration |

#### B. Telemetry Ingestion Loop
```c
static int mpu6050_read_accel(const struct device *i2c_dev, int16_t *ax, int16_t *ay, int16_t *az) {
    uint8_t raw_data[6];
    uint8_t reg_addr = 0x3B; // Address of ACCEL_XOUT_H
    
    // Read raw xyz outputs (6 bytes sequentially)
    if (i2c_write_read(i2c_dev, 0x68, &reg_addr, 1, raw_data, 6) != 0) {
        return -EIO;
    }
    
    *ax = (int16_t)((raw_data[0] << 8) | raw_data[1]);
    *ay = (int16_t)((raw_data[2] << 8) | raw_data[3]);
    *az = (int16_t)((raw_data[4] << 8) | raw_data[5]);
    return 0;
}
```

* **Vibration RMS Analysis**: Computes root-mean-square variation over a window of 50 samples to isolate structural vibration from steady acceleration:
  $$\text{Accel (g)} = \frac{\text{Raw Output LSB}}{16384}$$
  $$\text{Vibration RMS} = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(a_i - \bar{a})^2}$$

---

### 3. ACS712 Current Sensor Driver (ADC)
This driver reads Hall-effect voltages on ADC1 Channel 4 to calculate pack currents.

#### A. Ingestion Configuration
* **Reference Voltage**: $3.3\text{V}$ internal reference.
* **Resolution**: 12-bit configuration ($2^{12} = 4096$ quantization levels).
* **Quantization Factor**: $3.3\text{V} / 4096 = 0.8056\text{mV}/\text{LSB}$.
* **Hardware Offset**: Reads raw voltages under zero-current conditions.
  $$V_{\text{offset}} \approx 2.50\text{V}$$
* **Sensitivity Factor**: $185\text{mV}/\text{A}$ ratio.

#### B. Real-Time Conversion Formula
The driver scales raw values to Amps:
$$V_{\text{measured}} = \text{Raw ADC Value} \cdot \left(\frac{3.3\text{V}}{4096}\right)$$
$$\text{Current (Amps)} = \frac{V_{\text{measured}} - V_{\text{offset}}}{0.185\text{V}/\text{A}}$$

---

### 4. MQ-7 Carbon Monoxide Gas Driver (2-Phase Heater Protocol)
The MQ-7 sensor uses a heating and cooling cycle to prevent cell saturation by managing the output of an external heating gate on a digital pin.

```
       Phase 1 (60s): Heating (5V)           Phase 2 (90s): Measuring (1.4V)
V_heat ───┐                                  ───┐
          │                                     │          Data Capture (Last 10s)
          └─────────────────────────────────────┘          ██████████
```

* **High-Heater Voltage Phase (60 seconds)**: Drives the diagnostic heating gate high to clear target residues.
* **Low-Heater Voltage Phase (90 seconds)**: Drops the heater output. The driver averages ADC1 Channel 5 readings during the final 10 seconds of this phase.
* **PPM Curve Calculation**: Converts raw sensor resistance to gas concentrations:
  $$R_s = R_L \cdot \left(\frac{V_{\text{ref}} - V_{\text{measured}}}{V_{\text{measured}}}\right)$$
  $$\text{CO (PPM)} = 100 \cdot \left(\frac{R_s}{R_0}\right)^{-1.53}$$
  Where $R_L$ is the physical pull-down resistor value ($10\text{k}\Omega$) and $R_0$ is the baseline sensor resistance in clean air.

---

### 5. Resistor Taps Voltage Divider Calibration
Analog inputs map voltages across a series of 4 battery cells. High cell potential values are stepped down to match the MCU's $3.3\text{V}$ input limit using high-tolerance ($0.1\%$) resistor dividers.
* **Ideal Scale Ratio**:
  $$\text{Scale Ratio} = \frac{R_1 + R_2}{R_2} = \frac{10\text{k}\Omega + 2.2\text{k}\Omega}{2.2\text{k}\Omega} = 5.5454$$
* **Software Calibration Factor**: Evaluated to $5.8159$ to compensate for trace resistance and minor component variance:
  $$\text{Cell Volts} = V_{\text{Raw ADC}} \cdot \left(\frac{3.3\text{V}}{4096}\right) \cdot 5.8159$$

---

## 🛠️ Troubleshooting & Alignment Guide

### A. DS18B20 Failures (`SENSOR_FAULT`)
* **Typical Cause**: Missing pull-up resistor or open-circuit along the 1-Wire bus line.
* **System Response**: If the device reads $\le -127^\circ\text{C}$ or does not return a presence pulse, the driver drops the channel's trust status and flags a `SENSOR_FAULT`.
* **Alignment Protocol**:
  1. Inspect the physical $4.7\text{k}\Omega$ pull-up resistor across the signal and VCC lines.
  2. Verify the configuration by reviewing the device logs over the console:
     ```bash
     picocom -b 115200 /dev/ttyUSB0
     ```

### B. MPU-6050 $I^2C$ Bus Lockups
* **Typical Cause**: Hardware clock drift or intermediate power dips on the 3.3V line.
* **System Response**: Address calls return device timeout flags (`-ETIMEDOUT`).
* **Alignment Protocol**:
  1. If communication times out, the firmware executes a standard reset pin sequence on the $I^2C$ line, driving the SCL line low to release the SDA bus.
  2. Check for physical pull-up resistors on the SCL/SDA lines.

### C. ADC Calibration Errors (ACS712 Current Sensor)
* **Typical Cause**: Zero-current voltage offset ($V_{\text{offset}}$) drift over time.
* **System Response**: Current readings show static current values when the pack is idle.
* **Alignment Protocol**:
  1. Ensure no current is running through the sensor during startup.
  2. Execute the offset calibration routine over the system console to reset the zero-point baseline.
