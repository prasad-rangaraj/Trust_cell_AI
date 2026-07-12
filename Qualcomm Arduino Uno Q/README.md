# 🛡️ Qualcomm Arduino Uno Q (STM32U585) — Sensor Ingestion & Trust Engine (Zephyr RTOS)

An edge-native, real-time telemetry ingestion node built on **Zephyr RTOS v3.6** for the STM32U585 microcontroller (Arduino Uno Q). This component acts as the physical layer of the **Trust Cell AI** ecosystem, managing deterministic multi-sensor scans, checking data drift integrity through an onboard **Sensor Trust Engine**, and writing structured packets to the Snapdragon PC co-processor.

---

## ⚡ Key Architecture & Features

```
          ┌────────────────────────────────────────────────────────┐
          │                    STM32U585 BOARD                     │
          │                   (Zephyr RTOS v3.6)                   │
          └───────────────────────────┬────────────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        │             │               │               │             │
        ▼             ▼               ▼               ▼             ▼
   [Thread A]    [Thread B]      [Thread E]      [Thread C]    [Thread D]
    Voltage       Temp Bus       Vibration        Gas ADC      Diagnostics
   Ingestion     (DS18B20)       (MPU6050)        (MQ-7)       JSON Out
    (50ms)        (100ms)         (50ms)          (500ms)       (100ms)
        │             │               │               │             │
        └─────────────┴───────┬───────┴───────────────┴─────────────┘
                              │
                    [ Joint Mutex Lock Check ]
                              │
                              ▼
                 ┌───────────────────────────┐
                 │    Sensor Trust Engine    │
                 │   - Analog Drift Check    │
                 │   - Range Constraints     │
                 └────────────┬──────────────┘
                              │
                              ▼
               (UART Serial telemetry @ 115200)
```

1. **Deterministic Multi-Threading**: Executes 5 preemptive threads with strict kernel priority levels, preventing CPU blocking from slower thermal or gas buses.
2. **Sensor Trust Engine (STE)**: Continuously validates inputs against physical bounds (e.g., cell voltages $\in [0.5, 4.5]\text{V}$, thermistor averages $\in [-40, 120]^\circ\text{C}$). Detects anomalies and packages trust vectors.
3. **Optimized Device Tree Matrix**: Custom overlay assigns STM32 ADC dividers, Bit-Banged Dallas 1-Wire buses, and hardware $I^2C$ registers to minimize active footprint.
4. **Low-Energy Footprint**: Utilizes Zephyr's tickless idle features to put unused cores down sleep while awaiting Timer triggers.

---

## 📑 Pin Connections & Hardware Layout

```
   ┌───────────────────────┐                    ┌──────────────────────┐
   │     ARDUINO UNO Q     │                    │  GY-521 ACCEL/GYRO   │
   │      (STM32U585)      │                    │     (MPU-6050)       │
   │               VCC 5V  ├───────────────────►│ VCC                  │
   │                  GND  ├───────────────────►│ GND                  │
   │        I2C1 SCL (PB6) ├───────────────────►│ SCL                  │
   │        I2C1 SDA (PB7) ├───────────────────►│ SDA                  │
   │                       │                    └──────────────────────┘
   │                       │                    ┌──────────────────────┐
   │        ADC1_CH0 (PA0) ├◄─ Resistor Div ────┤ Cell 1 Voltage Tap   │
   │        ADC1_CH1 (PA1) ├◄─ Resistor Div ────┤ Cell 2 Voltage Tap   │
   │        ADC1_CH2 (PA2) ├◄─ Resistor Div ────┤ Cell 3 Voltage Tap   │
   │        ADC1_CH3 (PA3) ├◄─ Resistor Div ────┤ Cell 4 Voltage Tap   │
   │        ADC1_CH4 (PA4) ├◄─ Analog Signal ───┤ Onboard ACS712 Hall  │
   │        ADC1_CH5 (PA5) ├◄─ Analog Signal ───┤ MQ-7 Carbon Monoxide │
   │                       │                    └──────────────────────┘
   │                       │                    ┌──────────────────────┐
   │           D12 (PA12)  │◄─── OneWire ───────┤ DS18B20 Temp Probe 1 │
   │           D11 (PA11)  │◄─── OneWire ───────┤ DS18B20 Temp Probe 2 │
   │                       │                    └──────────────────────┘
   │      USART1 TX (PA9)  ├──────── 115200 ───► (To MPU Gateway PC)   │
   └───────────────────────┘
```

---

## 🛠️ Configuration Blueprints

### A. Zephyr Project Parameters (`prj.conf`)
Enables required serial channels, hardware interface access, multithreading, and float configurations:
```ini
CONFIG_GPIO=y
CONFIG_SERIAL=y
CONFIG_RING_BUFFER=y
CONFIG_UART_CONSOLE=y
CONFIG_ADC=y
CONFIG_I2C=y
CONFIG_POLL=y

# Enable floating point formatting for printing sensor curves
CONFIG_CBPRINTF_FP_SUPPORT=y
CONFIG_NEWLIB_LIBC=y
CONFIG_NEWLIB_LIBC_FLOAT_PRINTF=y

# Power constraints adjustments
CONFIG_PM=y
CONFIG_PM_DEVICE=y
```

### B. Device Tree Pin-Routing (`arduino_uno_q.overlay`)
Maps custom MCU analog and communication pins:
```dts
/ {
    chosen {
        zephyr,console = &usart1;
        zephyr,shell-uart = &usart1;
    };

    // Sensor ADC acquisition routing config
    ev_adc {
        compatible = "zephyr,adc-channel";
        io-channels = <&adc1 0>, <&adc1 1>, <&adc1 2>, <&adc1 3>, <&adc1 4>, <&adc1 5>;
    };
};

&usart1 {
    status = "okay";
    current-speed = <115200>;
    pinctrl-0 = <&usart1_tx_pa9 &usart1_rx_pa10>;
    pinctrl-names = "default";
};

&i2c1 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_FAST>; /* 400kHz burst rate for raw MPU6050 */
    pinctrl-0 = <&i2c1_scl_pb6 &i2c1_sda_pb7>;
    pinctrl-names = "default";
};
```

---

## 🧵 RTOS Thread Implementation

```c
/* Shared telemetry structured definitions, locked by a joint mutex key */
struct telemetry_data {
    float voltage[4];
    float current;
    float temperature[2];
    short carbon_monoxide_ppm;
    float vibration_rms;
    float trust_allocation;
};

K_MUTEX_DEFINE(telemetry_mutex);
```

* **Thread A (Voltage & Current Ingestion: Priority 2)**: Reads raw cell voltages via a resistor divider and estimates the pack current.
* **Thread E (MPU6050 Vibration: Priority 5)**: Ingests raw data via I2C and calculates the RMS AC-coupled vibration amplitude.
* **Thread B (DS18B20 Temp: Priority 4)**: Bit-bangs digital pins to read temperature probes.
* **Thread C (Gas: Priority 6)**: Captures MQ-7 outgassing outputs, using a multi-sample average to filter heater-induced noise.
* **Thread D (JSON Output: Priority 8)**: Assembles the telemetry variables and prints them as JSON over UART.

---

## 📤 Output JSON Schema (Forwarded over UART @ 115200)

Packets are pushed over serial every 100ms:
```json
{
  "voltages": [3.82, 3.84, 2.42, 3.81],
  "current": 12.84,
  "temperatures": [32.4, 58.2],
  "gas_co_ppm": 240,
  "vibration_g": 0.85,
  "trust": 92.5
}
```

---

## 🚀 Compiling and Flashing

Ensure the **Zephyr SDK (v0.16+)** and **West Build Tool** are configured in your development environment.

1. Initialize the board configuration directory:
   ```bash
   cp -r ./boards/arm/arduino_uno_q $ZEPHYR_BASE/boards/arm/
   ```
2. Build the project image:
   ```bash
   west build -b arduino_uno_q
   ```
3. Connect the board via ST-Link and flash the image:
   ```bash
   west flash
   ```
4. Verify the serial output by launching a terminal client:
   ```bash
   picocom -b 115200 /dev/ttyUSB0
   ```
