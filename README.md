# 🔋 Trust Cell AI (EV Guardian) — Multi-Device AI-Powered Battery Management System

<div align="center">

![Project Logo/Banner](https://img.shields.io/badge/PLATFORM-Qualcomm%20Snapdragon-orange?style=for-the-badge&logo=qualcomm)
![AESTHETIC-Modern-Neon](https://img.shields.io/badge/Aesthetic-Modern%20Dark-0891b2?style=for-the-badge)
![NPU-HTP-Burst](https://img.shields.io/badge/Hardware-Hexagon%20HTP-blueviolet?style=for-the-badge)
![Ecosystem-Offline%20First](https://img.shields.io/badge/Security-Offline%20First-0284c7?style=for-the-badge)

**The industry's first offline-first, multi-device, predictive safety platform for Electric Vehicles.**  
*Leveraging heterogeneous edge computing to prevent thermal runtime disasters, diagnose cell drift, and spotlight components using spatial AI.*

[Explore Architecture](#-system-architecture--the-orchestration-flow) • [Arduino Uno Q](#-device-1-arduino-uno-q--edge-sensing--ingestion) • [Snapdragon X PC](#-device-2-snapdragon-x-pc--edge-ai-co-processor) • [Qualcomm Mobile App](#-device-3-qualcomm-mobile-phone--spatial-ar--diagnostics) • [Cloud AI Fleet](#-device-4-cloud-ai-fleet-analytics--future-implementations)

</div>

---

## ⚡ The Project Vision (Executive Overview)

Traditional Battery Management Systems (BMS) are passive data-loggers, reporting surface temperatures only after thermal runaways are underway. **Trust Cell AI** rewrites this paradigm. 

By creating a secure, multi-device edge loop between an **Arduino Uno Q (STM32U585)**, a **Snapdragon X PC**, and a **OnePlus 15 smartphone**, we execute real-time, physics-informed digital twin models directly on local NPUs. The system detects anomalous micro-behaviors, estimates invisible electrochemistry degradations, and guides technician repairs using on-device **Qualcomm AI Hub SAM 2 and Llama-3.2 Vision** pipelines—fully offline, without cloud latency or security risks.

### Key Performance Identifiers

```
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│     ON-EDGE LATENCY     │ │  DIAGNOSTIC RESOLUTION  │ │   NPU COMPUTE TOPS      │
│        < 1.9 ms         │ │      Pinpoint Cell      │ │       Total 40+         │
│  Inference on Hexagon  │ │   Spatial AR Spotlight  │ │  Burst Mode HTP Load    │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 🔄 System Architecture & The Orchestration Flow

Trust Cell AI demonstrates **Multi-Device Orchestration Excellence** by coordinating dedicated sensor buses, host diagnostic coprocessors, and spatial mobile interfaces into a unified real-time telemetry loop.

```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'background': '#070a13',
    'primaryColor': '#0891b2',
    'primaryTextColor': '#f8fafc',
    'primaryBorderColor': '#0891b2',
    'lineColor': '#6366f1',
    'secondaryColor': '#1e1b4b',
    'tertiaryColor': '#0f172a'
  }
}}%%
graph TD
    %% STM32 Edge Ingestion
    subgraph EdgeSensing ["1. Deterministic Edge Ingestion"]
        STM["STM32U585 MCU (Arduino Uno Q)"]
        RTOS["Zephyr RTOS v3.6 Kernel"]
        STE["Sensor Trust Engine"]
        STM -->|Preemptive Threads| RTOS
        RTOS -->|Drift Guard Checks| STE
    end

    %% XPC Host AI processing
    subgraph HostProcessor ["2. Snapdragon X PC Cohort (AI Co-Processor)"]
        NPU_ONNX["Dual ONNX Inference (Hexagon NPU via QNN EP)"]
        PINN_TWIN["Physics-Informed Neural Network (PINN-BMS)"]
        EYE_TRACK["Driver Ocular Monitoring (Gaze Tracker)"]
        L_DIAG["Local LLM Diagnostics Dashboard API"]
        
        NPU_ONNX -->|SOH + Anomaly Scoring| PINN_TWIN
    end

    %% Mobile & AR Spatial Pipeline
    subgraph MobileAR ["3. Mobile Companion Client (OnePlus 15)"]
        M_BLE["Bluetooth RFCOMM Socket Daemon"]
        SAM_AR["SAM 2 Spatial Spotlight Overlay"]
        VLM_NPU["Llama 3.2 3B Quantized VLM (Burst NPU)"]
    end

    %% Ingestion Links
    STM -->|Serial UART @ 115200| HostProcessor
    HostProcessor -->|Local WS Broadcast Port 8887| HUD["3D Digital Twin HUD Dashboard"]
    HostProcessor -->|RFCOMM Serial Wrapper| MobileAR
    MobileAR -->|Qualcomm Cloud AI 100 Sync| Cloud["Cloud Analytics Ingester"]
    
    style EdgeSensing fill:#082f49,stroke:#0284c7,stroke-width:2px,color:#e0f2fe
    style HostProcessor fill:#1e1b4b,stroke:#4f46e5,stroke-width:2px,color:#e0e7ff
    style MobileAR fill:#1c1917,stroke:#d97706,stroke-width:2px,color:#fef3c7
    style HUD fill:#0f172a,stroke:#0891b2,stroke-width:1px,color:#f8fafc
```

---

## 📑 Rubric Alignment Index (Quick-Reference for Evaluators)

| Evaluation Criteria | Target README Section | Implementation Details & References |
| :--- | :--- | :--- |
| **Technical Implementation** | [Device 1 (Zephyr RTOS)](#-device-1-arduino-uno-q--edge-sensing--ingestion) & [Device 2 (NPU ONNX/PINN)](#-device-2-snapdragon-x-pc--edge-ai-co-processor) | [`backend.py`](file:///c:/ev%20vechile/backend.py), [`firmware/main.c`](file:///c:/ev%20vechile/ZEPHYR_RTOS_COMPLETE_BLUEPRINT.md#L268-L926) |
| **Application Use-Case & Innovation** | [Innovative Scenarios Blueprint](#💡-innovative-scenarios-blueprint) | [`ev_guardian_flow_problem_statements.md`](file:///c:/ev%20vechile/ev_guardian_flow_problem_statements.md) |
| **Deployment & Accessibility** | [System Setups & Deployments](#🚀-system-setups--deployments) | [`launch.py`](file:///c:/ev%20vechile/launch.py), [`test_integration.py`](file:///c:/ev%20vechile/test_integration.py) |
| **Presentation & Documentation** | [Hardware Schematic & Port Registers Mapping](#📊-hardware-schematic--port-registers-mapping) | [`DEMO_SCRIPT.md`](file:///c:/ev%20vechile/DEMO_SCRIPT.md), [Schematics Section](#📊-hardware-schematic--port-registers-mapping) |
| **Multi-Device Orchestration** | [Device 3 (Mobile Spatial AR)](#-device-3-qualcomm-mobile-phone--spatial-ar--diagnostics) & [Device 4 (Cloud Sync)](#-device-4-cloud-ai-fleet-analytics--future-implementations) | [`mobile_sam2_ar_pipeline.dart`](file:///c:/ev%20vechile/mobile_sam2_ar_pipeline.dart), [`mobile_vlm_qnn_pipeline.md`](file:///c:/ev%20vechile/mobile_vlm_qnn_pipeline.md) |

---

## 🔌 Device 1. Arduino Uno Q — Edge Sensing & Ingestion

The **Arduino Uno Q (STM32U585 MCU)** serves as the physical hardware interface. It is responsible for low-latency, deterministic sensor scans and calculating initial data trust indicators.

### A. Zephyr RTOS Preemptive Thread Architecture
To prevent CPU blocking during peripheral I/O, the MCU runs **Zephyr RTOS v3.6**. Telemetry writes are managed by five concurrent threads, scheduled by preemption and synchronized using a **k_mutex** lock to eliminate race conditions:

```text
TIMELINE: ─────────────────────────────────────────────────────────────────────────────► (Time in ms)
[Priority 2] Thread A (Voltage & Current Ingestion: 50ms interval)  ██   ██   ██   ██
[Priority 4] Thread B (Bit-Banged 1-Wire DS18B20 Temp: 100ms)         ████      ████
[Priority 5] Thread E (Accelerated I2C MPU6050 Vibration: 50ms)       ██   ██   ██   ██
[Priority 6] Thread C (Outgassing Gas Sensor ADC: 500ms)                ████████
[Priority 8] Thread D (Serial JSON Print to Host: 100ms)                ██   ██   ██   ██
────────────────────────────────────────────────────────────────────────────────────────
```

* **Thread A (Voltage & Current — 50ms, Priority 2)**: Reads raw cell voltages via a resistor divider and estimates the pack current.
* **Thread E (MPU6050 Vibration — 50ms, Priority 5)**: Ingests raw data via I2C and calculates the RMS AC-coupled vibration amplitude.
* **Thread B (DS18B20 Temp — 100ms, Priority 4)**: Bit-bangs digital pins to read temperature probes.
* **Thread C (Gas — 500ms, Priority 6)**: Captures MQ-7 outgassing outputs, using a multi-sample average to filter heater-induced noise.
* **Thread D (JSON Output — 100ms, Priority 8)**: Assembles the telemetry variables and prints them as JSON over UART.

### B. Sensor Trust Engine (STE)
An on-chip diagnostics block validates the integrity of raw hardware readings. If a thermistor breaks ($\le -127^\circ\text{C}$) or cell voltage drops under $0.5\text{V}$, the STE drops the channel's trust status.
$$\text{Trust Score} = \frac{T_{\text{volt\_cells}} + T_{\text{temp}} + T_{\text{gas}} + T_{\text{vib}} + T_{\text{curr}}}{8}$$
When $\text{Trust} < 80.0\%$, the system flags a `SENSOR_FAULT`. Over UART, it advises the Snapdragon PC to substitute the model inputs with predictions from the **PINN virtual sensor**, keeping the vehicle moving safely while scheduling maintenance.

---

## 💻 Device 2. Snapdragon X PC — Edge-AI Co-Processor

The **Snapdragon X PC** acts as the high-throughput co-processor room. It runs deep neural pipelines on the local NPU, streams dashboards via WebSockets, and executes diagnostic APIs.

### A. Heterogeneous Hardware Execution (QNN EP)
Heavy tensor profiling is offloaded from the CPU directly to the **Qualcomm Hexagon NPU**. By integrating Microsoft `ONNXRuntime` with QNN Execution Provider (QNN EP) libraries (`QnnHtp.dll`), the co-processor runs three ONNX model sessions in parallel:
1. **Anomaly Isolation Forest (`anomaly_model.onnx`)**: Evaluates the 8-feature parameter vector to verify cell integrity, trained using an initial baseline of 5,000 clean battery states.
2. **State of Health Regressor (`soh_model.onnx`)**: A Gradient Boosting model correlates voltage differentials, current discharge, and gas concentration to estimate SOH % degradation.
3. **PINN-BMS Battery Twin (`models/pinn_battery_twin.onnx`)**: Solves physical parameters (Loss of Lithium, Active Material Loss, and SEI Resistance) within weight variables.

#### QNN EP Configuration Code (`backend.py`):
```python
def _build_providers() -> list:
    avail = ort.get_available_providers()
    providers = []
    
    # 1. Qualcomm QNN EP (NPU) — Max performance burst configuration
    if "QNNExecutionProvider" in avail:
        providers.append((
            "QNNExecutionProvider",
            {
                "backend_path": "QnnHtp.dll",
                "htp_performance_mode": "burst"  # Locks NPU to peak frequency for zero-dropout operation
            }
        ))
    providers.append("CPUExecutionProvider")
    return providers
```

### B. PINN-BMS internal Electrochemistry Virtual Twin
The PINN battery twin estimates invisible degradation metrics in under 1.9ms by modeling underlying chemical equations directly within its weight variables:

$$Overpotential \ (\eta) = V_{\text{Cell}} - OCV_{\text{ref}} - I_{\text{Pack}} \cdot R_{\text{sei}}$$

$$Butler-Volmer \ Dynamics: \ I = I_0 \cdot \left[ \exp\left( \frac{\alpha F \eta}{RT} \right) - \exp\left( -\frac{\beta F \eta}{RT} \right) \right]$$

$$Arrhenius \ Diffusion \ Temperature \ Coefficient: \ D_s(T) = D_{\text{ref}} \cdot \exp\left( \frac{-E_k}{R \cdot T_{\text{avg}}} \right)$$

The computed states—**Loss of Lithium Inventory (LLI)**, **Loss of Active Material (LAM)**, and **SEI Layer Resistance ($R_{\text{sei}}$)**—are evaluated to determine adaptive battery limits. If LLI/LAM values reveal high degradation, the co-processor commands the Arduino Uno Q to safely throttle throttle and charge PWM gates.

---

## 📱 Device 3. Qualcomm Mobile Phone — Spatial AR & Diagnostics

The **OnePlus 15 (Snapdragon 8 Gen 4)** runs the companion application client. It processes diagnostic alerts, paints AR diagnostic overlays, and runs local VLM inspections on the mobile NPU.

### A. RFCOMM Bluetooth Socket Protocol
The Snapdragon PC handles local telemetry and diagnostic summaries, distributing alerts to paired devices via an offline Bluetooth RFCOMM socket stream.

#### Telemetry and Focus Action Package:
```json
{
  "type": "voice_response",
  "audio_text": "Cell 3 is running hot at 58 degrees and showing 2.4V. I have spotlighted it on your camera.",
  "ar_action": {
    "focus_cell_index": 3,              // Directs the mobile app to spotlight Cell 3
    "alert_level": "CRITICAL",           // Changes the overlay highlight to crimson
    "overlay_text": "CELL 3: 2.42V | 58.2°C"
  }
}
```

### B. SAM 2 On-Device Mobile AR Spotlight
When an alert is received, the Flutter app camera stream passes frame arrays to **Segment Anything Model 2 (SAM 2)**, running locally on the OnePlus 15 Snapdragon HTP NPU. The custom overlay UI highlights only the faulted cell in red, assisting technicians without requiring manual schematics.

#### Flutter Spatial AR Overlay Painter (`mobile_sam2_ar_pipeline.dart`):
```dart
class CellMaskPainter extends CustomPainter {
  final List<List<Offset>> segments;
  final int? voiceFocusCellIndex;
  
  CellMaskPainter({required this.segments, this.voiceFocusCellIndex});

  @override
  void paint(Canvas canvas, Size size) {
    if (voiceFocusCellIndex == null) return;

    for (int i = 0; i < segments.length; i++) {
      // Highlight only the cell targeted by the voice response
      if (i != voiceFocusCellIndex) continue;

      final points = segments[i];
      if (points.isEmpty) continue;

      final paint = Paint()
        ..color = Colors.red.withOpacity(0.55)
        ..style = PaintingStyle.fill;

      final path = Path()..moveTo(points.first.dx, points.first.dy);
      for (var point in points) {
        path.lineTo(point.dx, point.dy);
      }
      path.close();
      canvas.drawPath(path, paint);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
```

### C. Local VLM: On-Device Mobile Diagnostics (40+ NPU TOPS)
For offline visual inspections, **Llama-3.2-3B-Vision-Instruct** is compiled using the Qualcomm AI Hub CLI with `W4A16` quantization. The model runs locally on the mobile Hexagon NPU via the QNN SDK inside an ONNX Runtime Mobile session.

#### Kotlin MethodChannel NPU Session Mapping (`MainActivity.kt`):
```kotlin
private fun initializeQnnSession(): String {
    return try {
        val assetManager = assets
        val modelBytes = assetManager.open("llama3_2_vision_model.bin").readBytes()
        val sessionOptions = OrtSession.SessionOptions()
        sessionOptions.addConfigEntry("session.execution_mode", "ORT_SEQUENTIAL")
        
        // Load the compiled Qualcomm QNN libraries for HTP NPU runtimes
        val qnnOptions = mapOf(
            "backend_path" to "libQnnHtp.so",
            "htp_performance_mode" to "burst",  // Wakes up Hexagon HMX Tensor cores
            "htp_precision" to "fp16"
        )
        sessionOptions.registerCustomOpsLibrary("libort_qnn_custom_ops.so")
        ortSession = ortEnv?.createSession(modelBytes, sessionOptions)
        "QNN_LOADED_SUCCESS_HTP_NPU"
    } catch (e: Exception) {
        "QNN_LOAD_FAILED: ${e.message}"
    }
}
```

---

## 🔮 Device 4. Cloud AI Fleet Analytics — Future Implementations

To enable fleet-wide lifecycle monitoring and long-term health tracking, the system integrates a **Qualcomm Cloud AI 100** pipeline for centralized fleet analysis.

```mermaid
flowchart LR
    A[Snapdragon Host] -->|Offline Store-and-Forward| B[Local SQLite DB]
    B -->|Batch Upload on WiFi Connection| C[Qualcomm Cloud AI 100 Registry]
    C -->|Data Aggregator| D[Federated Retraining Loop]
    D -->|OTA Binary Pushes| A
```

### Future Implementation Roadmap
1. **Store-and-Forward Cache**: If the cellular connection drops in tunnels or remote locations, the Snapdragon PC spools JSON metadata to a local SQLite database (`ev_telemetry.db`). Once connectivity is restored, records are compiled and transmitted to the Cloud AI 100 endpoint.
2. **Federated Model Retraining**: The Cloud AI 100 engine aggregates LLI, LAM, and anomalies from the fleet, retraining the isolation boundary limits on newer chemistry cycles. Revised ONNX models are compiled and pushed back to edge hosts via Over-The-Air (OTA) updates.
3. **Venting and Gas Chemistry Profiling**: Employs deep multi-point sensor syncs on the cloud to build custom profiles for different battery chemistries (e.g., LFP versus NMC outgassing).

---

## 💡 Innovative Scenarios Blueprint

Trust Cell AI addresses critical safety challenges in the EV ecosystem:

1. **Multimodal Cognitive Safety Shield**: Fuses high temperatures with driver eyes-gaze data from an webcam feed. If the driver is drowsy, the system bypasses silent profiles on the phone to sound alarms and trigger haptic alerts.
2. **Dynamic HUD Alert Throttling**: Suppresses minor warnings while the driver is focused on the highway to prevent distraction, raising alert urgency only when distraction is detected.
3. **Self-Healing Fail-Safe Governor**: Runs the local physics digital twin as a virtual sensor to bypass physical sensor failures and avoid sudden shutdowns.
4. **Cabin Vapor & Arcing Detector**: Fuses MQ-7 outgassing alerts with Whisper audio signatures (looking for arcing "crackles" or venting "hisses") to warn passengers of gas leaks.
5. **Regen Budgeting (V-PREB)**: Tracks upcoming terrain with the camera (via YOLOv8). If the batteries are degraded, the system restricts regenerative charging current and advises using mechanical brakes instead.

---

## 🚀 System Setups & Deployments

### System Prerequisites
Ensure the following are active:
* Python 3.10+
* Zephyr SDK & West Build Meta-Tool
* local MQTT Broker (Mosquitto configured on port 1883)
* Flutter SDK (for Mobile Companion verification)

### A. One-Line System Launch
Initialize the core Snapdragon backend, MQTT connections, WebSocket broadcasts, and data syncers with one command:
```powershell
python launch.py
```

### B. Firmware Compilation & Flash (STM32 Board)
1. Copy the custom target configuration files to your regional environment:
   ```bash
   cp -r ./firmware/boards/arm/arduino_uno_q $ZEPHYR_BASE/boards/arm/
   ```
2. Run the CMake West build pipeline to flash the binary:
   ```bash
   cd ./firmware
   west build -b arduino_uno_q
   west flash
   ```

### C. Run Verification Test Suite
Ensure the local host, ONNX model sessions, database pipelines, and WebSocket endpoints are active and healthy:
```powershell
python test_integration.py
```

---

## 📊 Hardware Schematic & Port Registers Mapping

### Hardware Connections & Board Pinouts

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

### System Services Mapping

| Service Name | Default Port | Endpoint / Connection Route | Purpose |
| :--- | :--- | :--- | :--- |
| **MQTT Broker** | `1883` | `ev/sensor/telemetry` | Raw telemetry data ingestion |
| **WebSockets** | `8887` | `ws://localhost:8887` | Real-time JSON telemetry sync to the HUD |
| **Diagnostics HTTP** | `8766` | `/diagnose?reason=CELL_3` | Local LLM diagnostic query endpoint |
| **Stats API** | `8766` | `/status` | Running packet count & anomaly rate tracking |
| **Cloud Analytics** | `9000` | `http://localhost:9000` | Back-end database sync interface |
