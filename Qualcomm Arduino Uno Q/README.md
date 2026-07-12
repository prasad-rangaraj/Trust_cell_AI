# EV Guardian - Edge AI & Battery Engine (Qualcomm Arduino Uno Q)

## 📖 Application Description
This module is a core component of the EV Guardian ecosystem, specifically designed to run locally on low-power Edge devices and Qualcomm hardware. It houses the offline ML inference models for real-time driver drowsiness monitoring (using Qualcomm AI Hub models) and the Integrated BMS Engine (LSTM, Autoencoder) for predictive battery health and anomaly detection. 
All data processing happens natively on the edge to ensure zero latency and preserve privacy without relying on cloud computation.

## 🚀 Setup & Installation Instructions
The module is split into two independent Python environments.

**Prerequisites:** Python 3.10+, Git.

**1. Driver Monitor Setup:**
```bash
cd driver_monitor
python -m venv venv
# On Windows: .\venv\Scripts\Activate.ps1
# On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

**2. Integrated BMS Engine Setup:**
```bash
cd "integrated_bms_engine(optimised)"
python -m venv venv
# On Windows: .\venv\Scripts\Activate.ps1
# On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

## 🏃 Run and Usage Instructions
**Driver Monitor:**
```bash
cd driver_monitor
python monitor.py
```
*(This will open your webcam and use FaceDetLite to monitor eye openness.)*

**BMS Engine:**
```bash
cd "integrated_bms_engine(optimised)"
python run_engine.py
```
*(This will connect to the MQTT broker via WebSockets and start scoring real-time battery telemetry using the ONNX models).*

## 🧪 Tests
- Cover your eyes for 10 frames while `monitor.py` is running to verify the FaceAttribNet sleep detection triggers a red warning.
- Watch the console output of `run_engine.py` to verify it successfully connects to `ws://test.mosquitto.org:8080` and prints inference scores.

## 📝 Notes & References
- **Edge Native:** Over 90% of this module's computation runs strictly on the edge.
- **References:** Utilizes `qai_hub_models` (Qualcomm AI Hub) for facial analysis and `onnxruntime` for lightweight battery telemetry inference. 
- Code is well-commented, detailing the temporal smoothing and LSTM logic.
