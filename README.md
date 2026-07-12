# EV Guardian 🔋
**AI-Powered Battery Safety & Intelligence Platform**

*Detect Early. Act Smart. Stay Safe.*

---

## 📖 Project Description

**EV Guardian** is a comprehensive, multi-platform Battery Management System (BMS) and driver safety platform designed specifically for electric vehicles. By leveraging advanced Edge AI capabilities optimized for Qualcomm Snapdragon processors (such as the Snapdragon X Elite, Snapdragon Mobile SoC, and low-power edge units), EV Guardian provides real-time battery telemetry analysis, predictive maintenance, cell anomaly detection, and driver drowsiness monitoring.

The system is designed with an **edge-first** philosophy, processing the majority of critical safety and diagnostic data locally. This ensures sub-second, zero-latency feedback loops and works seamlessly even without active cloud or internet connectivity. 

### Core Features:
- **3D Digital Twin & Dashboard:** A real-time React web dashboard with a interactive 3D representation of the battery pack, showcasing cell temperatures, voltages, and charge levels.
- **Local Edge AI Assistant:** An offline LLM (Qwen 3 0.6B / Qwen 2.5 7B) running locally on the Snapdragon Hexagon NPU using **GenieX**, facilitating on-device chat and battery health insight generation.
- **Driver Drowsiness Monitoring:** An Edge AI camera feed running Qualcomm AI Hub models (`FaceDetLite` and `FaceAttribNet`) locally to alert drivers of fatigue.
- **Predictive BMS Engine:** Local execution of LSTM and Autoencoder models for early anomaly detection and cell fault classification.
- **Native Android Companion App:** A Jetpack Compose application running local ONNX telemetry classification models on Snapdragon Mobile SoCs, keeping safety alerts running off-grid.

---

## 👥 Team Members

- **Boomika** — [boomikas2007@gmail.com](mailto:boomikas2007@gmail.com)
- **Monishwaran R** — [monishwaran96@gmail.com](mailto:monishwaran96@gmail.com)
- **Prasad Rangaraj** — [prasad.rangaraj@gmail.com](mailto:prasad.rangaraj@gmail.com) or [prasad@crayond.co](mailto:prasad@crayond.co)
- **Sujan Durai** — [sujanduraisujan@gmail.com](mailto:sujanduraisujan@gmail.com)
- **Vigneshan S** — [vigneshan.me23@bitsathy.ac.in](mailto:vigneshan.me23@bitsathy.ac.in)

---

## 🛠️ Dependencies Required

To set up the entire project, you need the following system-level tools:
- **Python 3.10+** (with virtualenv)
- **Node.js (v18+)** & npm
- **JDK 17** & Gradle
- **Android Studio** (for compiling and deploying the mobile app)
- **PostgreSQL** (for telemetry data persistence)
- **Mosquitto MQTT Broker** (or equivalent, for telemetry publish-subscribe architecture)

### Component Dependencies

#### 1. Web Dashboard & Server (`Qualcomm Snapdragon X Elite pc`)
- **Backend (Python):** 
  - Defined in [requirements.txt](file:///d:/ev_guardian/Qualcomm%20Snapdragon%20X%20Elite%20pc/server/requirements.txt): `fastapi`, `uvicorn[standard]`, `python-socketio`, `paho-mqtt`, `sqlalchemy`, `psycopg[binary]`, `pydantic`, `pydantic-settings`, `google-genai`, `python-dotenv`
- **Frontend (Node/JS):**
  - React 19, Vite, Three.js, `@react-three/fiber` (for 3D rendering), Recharts, Electron (optional for desktop app packaging)

#### 2. Edge AI & Battery Engine (`Qualcomm Arduino Uno Q`)
- **Driver Drowsiness Monitor:** 
  - Imports within [monitor.py](file:///d:/ev_guardian/Qualcomm%20Arduino%20Uno%20Q/driver_monitor/monitor.py): `opencv-python` (cv2), `torch` (PyTorch), `numpy`, `pillow` (PIL), and Qualcomm's `qai-hub-models`
- **Integrated BMS Engine:**
  - Defined in [requirements.txt](file:///d:/ev_guardian/Qualcomm%20Arduino%20Uno%20Q/integrated_bms_engine(optimised)/requirements.txt): `numpy`, `pandas`, `joblib`, `onnxruntime`, `xgboost`, `scikit-learn`, `paho-mqtt`

#### 3. Mobile Companion (`Qualcomm Snapdragon Mobile`)
- **Mobile Server (Ktor/Kotlin):**
  - Configured in [build.gradle.kts](file:///d:/ev_guardian/Qualcomm%20Snapdragon%20Mobile/server/build.gradle.kts): `Ktor Server Core/Netty/CORS`, `exposed-core/dao/jdbc`, `postgresql` driver, `eclipse.paho.client.mqttv3`, `logback`
- **Android Client (Kotlin):**
  - Jetpack Compose UI, ONNX Runtime Mobile (`onnxruntime-android`), Socket.IO client, Ktor client, 3D/graphing UI libraries

#### 4. Edge LLM Server (GenieX CLI)
- Global npm package: `geniex-cli`

---

## 🚀 Setup & Installation Instructions (From Scratch)

### 1. Database & MQTT Setup
Before starting any software module, ensure you have running database and messaging services:
1. **PostgreSQL:** Create a database named `evguardian`.
2. **MQTT:** Start a Mosquitto MQTT broker. (Defaults to `ws://test.mosquitto.org:8080` if using mock testing, but local configuration is recommended).

---

### 2. Web Dashboard & Server (`Qualcomm Snapdragon X Elite pc`)
The main server manages database storage, MQTT telemetry streaming via WebSockets, and hosts the React 3D twin frontend.

#### A. Backend Server Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd "Qualcomm Snapdragon X Elite pc/server"
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside `Qualcomm Snapdragon X Elite pc/server/` containing:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/evguardian"
   MQTT_BROKER="mqtt://localhost:1883"
   LLM_MODEL="qwen3:0.6b"
   GENIEX_URL="http://127.0.0.1:8080/v1/chat/completions"
   SARVAM_API_KEY="your_sarvam_ai_api_key"
   ```

#### B. React Dashboard Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd "Qualcomm Snapdragon X Elite pc/client"
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```

---

### 3. Edge AI & Battery Engine (`Qualcomm Arduino Uno Q`)
This module handles camera-based driver face diagnostics and the core anomaly scoring model pipeline.

#### A. Driver Monitor Setup
1. Navigate to the directory:
   ```bash
   cd "Qualcomm Arduino Uno Q/driver_monitor"
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install opencv-python torch numpy pillow qai-hub-models
   ```

#### B. Integrated BMS Engine Setup
1. Navigate to the directory:
   ```bash
   cd "Qualcomm Arduino Uno Q/integrated_bms_engine(optimised)"
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

### 4. Native Android App & Ktor Server (`Qualcomm Snapdragon Mobile`)

#### A. Mobile Server (Ktor Backend)
1. Navigate to the server folder:
   ```bash
   cd "Qualcomm Snapdragon Mobile/server"
   ```
2. Build the project using Gradle wrapper:
   ```bash
   ./gradlew build
   ```

#### B. Android Application Client
1. Open **Android Studio**.
2. Click **Open Project** and navigate to `Qualcomm Snapdragon Mobile/client/app`.
3. Allow Gradle to sync dependencies, including the ONNX Runtime Mobile packages.
4. Open `BmsViewModel.kt` and set `SERVER_URL` to your computer's local Wi-Fi IP address (e.g., `192.168.x.x`).
5. Place your compiled `bms_anomaly.onnx` model file in `client/app/src/main/assets/`.

---

## 🏃 Run and Usage Instructions

To boot up the ecosystem, run the services in the following order:

### Step 1: Start the Local Edge AI (GenieX LLM Server)
To host the chat capabilities offline on the Snapdragon NPU:
1. Install the GenieX CLI tool:
   ```bash
   npm install -g geniex-cli
   ```
2. Start the inference model download and engine:
   ```bash
   geniex infer Qwen/Qwen3-0.6B-Instruct-GGUF:q4_k_m
   ```
3. Run the local serve API mock:
   ```bash
   geniex serve --host 127.0.0.1:8080
   ```

### Step 2: Start the Web Dashboard Backend
1. Navigate to `Qualcomm Snapdragon X Elite pc/server`.
2. Activate your virtual environment and start FastAPI:
   ```bash
   uvicorn main:socket_app --reload --port 3001
   ```

### Step 3: Run the Web Dashboard Client
1. Navigate to `Qualcomm Snapdragon X Elite pc/client`.
2. Launch the React dashboard:
   ```bash
   npm run dev
   # Or to run as a native desktop Electron window:
   npm run electron:dev
   ```
3. Open `http://localhost:3001` (or the printed Vite address) in your browser.

### Step 4: Run the Driver Drowsiness Monitor
1. Navigate to `Qualcomm Arduino Uno Q/driver_monitor`.
2. Run the monitoring script to boot the camera:
   ```bash
   python monitor.py
   ```
*Press 'q' inside the webcam window to safely exit.*

### Step 5: Run the Integrated BMS Engine
1. Navigate to `Qualcomm Arduino Uno Q/integrated_bms_engine(optimised)`.
2. Start the telemetry processing script:
   ```bash
   python run_engine.py
   ```

### Step 6: Launch the Android App & Mobile Backend
1. **Run the Ktor server:**
   ```bash
   cd "Qualcomm Snapdragon Mobile/server"
   ./gradlew run
   ```
2. **Deploy the Android App:**
   - Plug in your Android device (ensure Developer Options and USB Debugging are active).
   - In Android Studio, select the target device and click **Run** (Play button).
   - Once opened, view live diagnostics and local ONNX classifications side-by-side.

---

## 🧪 Testing Instructions

Verify that everything is operating normally by performing these test scenarios:
1. **Telemetry Feed Check:** Boot the web server dashboard. The UI contains a synthetic simulator that automatically starts streaming battery telemetry if live sensors are not connected. Ensure the 3D twin updates its color coding.
2. **Offline AI Chat Verification:** Disconnect your internet connection. Ask the assistant chatbot a question about battery safety. Ensure it processes using local NPU GenieX without failure.
3. **Face Sleep Trigger:** Block or close your eyes for 10 consecutive frames in front of the drowsiness camera feed (`monitor.py`). Check if the console outputs an alert indicator.
4. **Android Offline Mode:** Disconnect your phone's cellular/Wi-Fi connection. Verify that the Android companion continues to classify incoming telemetry using the on-device `bms_anomaly.onnx` classifier.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](file:///d:/ev_guardian/LICENSE) file for the full license text.
