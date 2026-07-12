# EV Guardian 🔋
**AI-Powered Battery Safety Intelligence Platform**

*Detect Early. Act Smart. Stay Safe.*

## 📖 Application Description
EV Guardian is a comprehensive Battery Management System (BMS) and driver safety platform designed for electric vehicles. By leveraging advanced Edge AI capabilities (specifically optimized for Qualcomm Snapdragon NPUs and edge hardware), it provides real-time battery telemetry analysis, predictive maintenance, cell anomaly detection, and driver drowsiness monitoring. 

The ecosystem is built to process the majority of critical data directly on the edge to ensure zero-latency responses, enhancing safety without relying entirely on cloud connectivity. It features:
- A high-performance Python/FastAPI web dashboard powered by a local NPU AI integration (GenieX / Qwen 2.5).
- A robust AI inference engine running LSTM and Autoencoder models for predictive battery health.
- A dedicated Kotlin/Ktor mobile backend serving a native Android app for on-the-go monitoring.

## 👥 Team Members
- **[Your Name 1]** - [Your Email 1]
- **[Your Name 2]** - [Your Email 2]
- **[Your Name 3]** - [Your Email 3]
*(Please update this section with your actual team details)*

---

## 🚀 Setup & Installation Instructions

This project is divided into three main components, each optimized for different Qualcomm platforms. Follow these instructions to set them up from scratch.

### Prerequisites
- Python 3.10+
- Node.js (v18+)
- Android Studio
- Git

### 1. Web Dashboard & Server (`Qualcomm Snapdragon X Elite pc`)
This handles the web UI, the backend server, and the built-in telemetry simulator.

```bash
# Navigate to the server folder
cd "Qualcomm Snapdragon X Elite pc/server"

# Create a virtual environment and activate it
python -m venv venv
# On Windows: .\venv\Scripts\Activate.ps1
# On Mac/Linux: source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the Python server
uvicorn main:app --reload --port 3001
```

To run the React Frontend Dashboard:
```bash
# Open a new terminal and navigate to the client folder
cd "Qualcomm Snapdragon X Elite pc/client"

# Install frontend dependencies
npm install

# Start the development server
npm run dev
# Or for the electron app: npm run electron:dev
```

### 2. Edge AI & Battery Engine (`Qualcomm Arduino Uno Q`)
This folder contains the locally running edge models: the AI driver monitor and the optimized integrated BMS engine.

**Driver Drowsiness Monitor:**
```bash
cd "Qualcomm Arduino Uno Q/driver_monitor"
python -m venv venv
# Activate the venv (.\venv\Scripts\Activate.ps1)
pip install -r requirements.txt
python monitor.py
```

**Integrated BMS Engine (Optimized):**
```bash
cd "Qualcomm Arduino Uno Q/integrated_bms_engine(optimised)"
python -m venv venv
# Activate the venv (.\venv\Scripts\Activate.ps1)
pip install -r requirements.txt
python run_engine.py
```
*(The BMS Engine will automatically listen to MQTT data over WebSocket and run real-time inference on the edge).*

### 3. Native Android App (`Qualcomm Snapdragon Mobile`)
To run the Android app companion:

1. Open **Android Studio**.
2. Click **Open** and select the `Qualcomm Snapdragon Mobile/client/app` folder.
3. Wait for Gradle to sync automatically.
4. Set up an Android Emulator or plug in a physical Android phone via USB (Recommended for ARM/Copilot+ PCs).
5. Click the green **Run** button at the top right of Android Studio.

> **Note:** If testing on a physical device, ensure the `SERVER_URL` in `BmsViewModel.kt` is set to your computer's local Wi-Fi IP address (e.g., `192.168.x.x`) instead of `localhost`.

---

## 🏃 Run and Usage Instructions

1. **Start the Edge AI LLM (GenieX):**
   EV Guardian leverages local NPU AI. Start your local LLM engine:
   ```bash
   geniex infer bartowski/Qwen_Qwen2.5-VL-7B-Instruct-GGUF:q4_k_m
   geniex serve --host 127.0.0.1:8080
   ```
2. **Start the Web Dashboard Server:** (See Step 1 above).
3. **Start the BMS Engine:** (See Step 2 above). It will process simulated or real hardware telemetry in real-time.
4. **Access the Dashboard:** Open `http://localhost:3001` or your React frontend URL in a browser. You can interact with the AI assistant, monitor live cell analytics, and view predictive faults all processed locally on the edge.

---

## 🧪 Tests and Testing Instructions
To verify the setup is working correctly:
1. Ensure the Mosquitto MQTT broker is active (the backend defaults to `ws://test.mosquitto.org:8080`).
2. Start the FastAPI server; it will automatically begin publishing simulated battery telemetry if hardware is not connected.
3. Check the terminal running `run_engine.py`. You should see `AI Diagnostics Result:` printed every second, confirming the edge model is actively scoring the data stream.
4. Open the driver monitor (`monitor.py`) and cover your eyes for 10 frames to test the Qualcomm FaceDetLite drowsiness alert trigger.

---

## 📝 Notes & References
- **Edge Architecture:** The majority of this application's heavy lifting (LLM Chat, LSTM Battery Predictions, Face Detection) runs locally on the device (Edge/NPU), strictly minimizing cloud dependency for critical safety functions.
- **References:** 
  - Qualcomm AI Hub Models (`qai_hub_models`): Used for FaceDetLite and FaceAttribNet in the driver monitor.
  - GenieX / llama.cpp: Utilized for high-performance offline generative AI chat on the dashboard.
- The codebase is thoroughly commented to explain the implementation of sliding windows, temporal smoothing, and AI integration.

---

## 📄 License
This project is open-source and available to the public under the **MIT License**. See the [LICENSE](LICENSE) file for more details.
