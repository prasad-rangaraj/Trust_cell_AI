# EV Guardian - Web Dashboard & Server (Qualcomm Snapdragon X Elite PC)

## 📖 Application Description
This module serves as the central command hub for EV Guardian, highly optimized for Snapdragon X Elite PCs. It features a Python FastAPI backend that handles MQTT telemetry, WebSocket streaming, and database persistence, paired with a high-performance React/Vite frontend. The dashboard integrates local GenieX LLM processing to provide offline, edge-based AI chat and insights without relying on external cloud APIs for core functionality.

## 🚀 Setup & Installation Instructions
**Prerequisites:** Python 3.10+, Node.js (v18+).

**1. Backend Server Setup:**
```bash
cd server
python -m venv venv
# On Windows: .\venv\Scripts\Activate.ps1
# On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

**2. Frontend Dashboard Setup:**
```bash
cd client
npm install
```

## 🏃 Run and Usage Instructions
**1. Start Local Edge AI (GenieX):**
To run the local chat assistant, install the [GenieX CLI](https://github.com/geniex/geniex) and run:
```bash
geniex infer Qwen/Qwen3-0.6B-Instruct-GGUF:q4_k_m
geniex serve --host 127.0.0.1:8080
```

**2. Start the Backend:**
```bash
cd server
uvicorn main:socket_app --reload --port 3001
```

**3. Start the Frontend:**
```bash
cd client
npm run dev
# (Or npm run electron:dev for desktop app)
```
Open `http://localhost:3001` to view the dashboard.

## 🧪 Tests
- Ensure `uvicorn` starts without errors and the React app displays the 3D battery pack.
- Submit a chat message to verify the local GenieX server responds correctly, confirming Edge AI functionality.

## 📝 Notes & References
- **Edge Native:** All LLM queries and data aggregations are processed on the local PC hardware (Edge), fulfilling the requirement for local execution.
- **References:** Utilizes Framer Motion, React Three Fiber for UI, and GenieX/Sarvam AI for intelligence.
- The codebase is thoroughly commented for readability.
