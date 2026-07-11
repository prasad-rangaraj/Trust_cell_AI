# EV Guardian 🔋
**AI-Powered Battery Safety Intelligence Platform**

*Detect Early. Act Smart. Stay Safe.*

This repository contains the complete ecosystem for the EV Guardian Battery Management System (BMS). It features a Python/FastAPI web dashboard, a local NPU AI integration (GenieX / Qwen 2.5), and a dedicated Kotlin/Ktor mobile backend serving a native Android app.

---

## 🚀 How to Install & Run (For New Developers)

When pulling this project on a new system, follow these steps to get everything running.

### 1. Web Dashboard & Simulator (Python)
This handles the web UI and the built-in telemetry simulator.

```bash
# 1. Navigate to the server folder
cd server

# 2. Create a virtual environment and activate it
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# 3. Install dependencies
pip install fastapi uvicorn python-socketio paho-mqtt sqlalchemy psycopg2-binary psutil

# 4. Start the server
uvicorn main:socket_app --reload --port 3001
```
*(The web dashboard will now be available at `http://localhost:3001`)*

### 2. Mobile Backend API (Kotlin / Ktor)
This is the dedicated backend serving dynamic data (Maps, Profiles, Chat) to the Android mobile app.

```bash
# 1. Navigate to the Kotlin server folder
cd android-app/server

# 2. Run the Ktor server using Gradle wrapper
./gradlew run
```
*(The mobile backend runs on `http://localhost:8080`)*

### 3. Native Android App (Kotlin / Compose)
To run the Android app, you will need **Android Studio**.

1. Open Android Studio.
2. Click **Open** and select the `android-app/client` folder.
3. Wait for Gradle to sync.
4. Set up an Android Emulator or plug in a physical Android phone via USB (Recommended for ARM/Copilot+ PCs).
5. Click the green **Run** button at the top right of Android Studio.

> **Note:** If you are testing on a physical device, ensure the `SERVER_URL` in `BmsViewModel.kt` is set to your computer's local Wi-Fi IP address (e.g., `192.168.x.x`) instead of `localhost`.

---

## 📁 Repository Structure

- `/server` - Python FastAPI backend + HTML/JS Dashboard. Runs the battery simulation.
- `/client` - React frontend (Legacy/Alternative dashboard).
- `/android-app/client` - Native Android Kotlin app built with Jetpack Compose.
- `/android-app/server` - Kotlin Ktor server serving the mobile app APIs.

## 🧠 Local Edge AI (NPU)
The Web Dashboard chatbot is powered by a local, offline LLM running on the Snapdragon NPU using **GenieX**.

1. Download the model: `geniex infer bartowski/Qwen_Qwen2.5-VL-7B-Instruct-GGUF:q4_k_m`
2. Start the GenieX server: `geniex serve --host 127.0.0.1:8080`
3. Ensure `.env` is configured with `GENIEX_URL` and `AI_MODEL`.

## 🛠 Tech Stack
- **Web Backend**: Python, FastAPI, Socket.IO, SQLAlchemy
- **Web AI**: Qualcomm GenieX, Qwen 2.5 7B, llama.cpp
- **Mobile Backend**: Kotlin, Ktor, JetBrains Exposed
- **Mobile App**: Kotlin, Jetpack Compose
- **Communication**: WebSockets, REST APIs, MQTT
