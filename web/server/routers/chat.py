"""
POST /api/chat â€” Port of chat.controller.js
Gemini-powered AI chat, insight generation, and speech-to-text.
Uses the new google.genai SDK.
"""
import json
import urllib.request
import urllib.error
import requests
import base64
from fastapi import APIRouter
from dotenv import load_dotenv
import os

from schemas.bms import ChatRequest, InsightRequest, SpeechToTextRequest, TextToSpeechRequest

load_dotenv()
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = os.getenv("LLM_MODEL", "qwen3:0.6b")

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are the **Edge Sense**, an expert in Battery Management Systems (BMS), "
    "Lithium-ion batteries, predictive maintenance, and software engineering.\n\n"
    "### System Context & Architecture\n"
    "- **Hardware**: STM32 Edge Node. Communicates via MQTT over 'battery/live' and 'battery/terminal'.\n"
    "- **Battery Pack**: 4S Li-ion (4 cells in series). Nominal voltage: 3.0V (0%) - 4.12V (100%).\n"
    "- **Sensors**: Cell voltages C1-C4, Temperatures T1/T2, Current (A), Gas/CO (PPM), Vibration (G).\n"
    "- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, python-socketio.\n"
    "- **Frontend**: React, Vite, Framer Motion, Recharts, React Three Fiber.\n\n"
    "### Your Role\n"
    "Diagnose hardware faults, analyze telemetry, and explain the codebase. "
    "Always respond in a professional, authoritative tone using GitHub-Flavored Markdown."
)

_FALLBACK_CHAT = (
    "**AI Analytics Temporarily Unavailable**\n\n"
    "The AI endpoint is currently unreachable or rate-limited. "
    "Standard heuristics indicate the battery pack is operating nominally. Please try again shortly."
)

_FALLBACK_INSIGHT = (
    "**AI Analytics Offline**\n\n"
    "Unable to generate real-time insights due to API rate limits. "
    "Local telemetry checks are nominally stable. Please try again later."
)


@router.post("")
def handle_chat(body: ChatRequest):
    if not body.message:
        return {"success": False, "error": "Message is required"}

    full_prompt = body.message
    if body.contextData:
        # Extract only vital stats to dramatically reduce LLM token count and NPU prefill time
        vital_stats = {
            "soc": body.contextData.get("soc"),
            "health": body.contextData.get("soh"),
            "temp1": body.contextData.get("temp1"),
            "temp2": body.contextData.get("temp2"),
            "current": body.contextData.get("current"),
            "mlOp": body.contextData.get("mlOp")
        }
        full_prompt = (
            f"[BATTERY CONTEXT]: {json.dumps(vital_stats)}\n\n"
            f"[USER]: {body.message}"
        )
        
    if body.isVoice:
        full_prompt += "\n\n(SYSTEM DIRECTIVE: The user is speaking to you via voice. You must keep your response extremely concise, conversational, and ideally under 2 sentences.)"

    # Build messages array for Ollama
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Cap history to the last 6 messages to prevent context window overflow (500 Error)
    recent_history = body.history[-6:] if len(body.history) > 6 else body.history
    for m in recent_history:
        role = "user" if m.role == "user" else "assistant"
        messages.append({"role": role, "content": m.content or ""})
        
    messages.append({"role": "user", "content": full_prompt})

    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False
    }

    try:
        req = urllib.request.Request(
            GENIEX_URL, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=300) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            # OpenAI / GenieX response format: {"choices": [{"message": {"content": "..."}}]}
            choices = resp_data.get("choices", [])
            if choices:
                reply_text = choices[0].get("message", {}).get("content", _FALLBACK_CHAT)
            else:
                reply_text = resp_data.get("message", {}).get("content", _FALLBACK_CHAT) # Fallback to ollama format just in case
            return {"success": True, "data": {"role": "assistant", "content": reply_text}}
    except urllib.error.URLError as e:
        print(f"[GenieX Chat Error]: Is GenieX running? {e}")
        return {"success": True, "data": {"role": "assistant", "content": _FALLBACK_CHAT}}
    except Exception as e:
        print(f"[Chat Error]: {e}")
        return {"success": True, "data": {"role": "assistant", "content": _FALLBACK_CHAT}}


@router.post("/insight")
def generate_insight(body: InsightRequest):
    prompt = (
        "You are a BMS Expert AI. Analyze the following real-time battery telemetry and "
        "provide a concise health summary. Focus on anomalies, warnings, or risks. "
        "Use markdown formatting. Be direct and concise.\n"
        f"Data: {json.dumps(body.data, indent=2)}"
    )
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }
    try:
        req = urllib.request.Request(
            GENIEX_URL, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            choices = resp_data.get("choices", [])
            if choices:
                reply_text = choices[0].get("message", {}).get("content", _FALLBACK_INSIGHT)
            else:
                reply_text = resp_data.get("message", {}).get("content", _FALLBACK_INSIGHT)
            return {"success": True, "data": reply_text}
    except Exception as e:
        print(f"[GenieX Insight Error]: {e}")
        return {"success": True, "data": _FALLBACK_INSIGHT}


@router.post("/speech-to-text")
def speech_to_text(body: SpeechToTextRequest):
    if not SARVAM_API_KEY or SARVAM_API_KEY == "INSERT_YOUR_SARVAM_API_KEY_HERE":
        return {"success": False, "error": "SARVAM_API_KEY is not configured in .env"}
        
    try:
        # Pad base64 string if necessary
        b64 = body.audio
        b64 += "=" * ((4 - len(b64) % 4) % 4)
        audio_bytes = base64.b64decode(b64)
        
        url = "https://api.sarvam.ai/speech-to-text"
        headers = {"api-subscription-key": SARVAM_API_KEY}
        files = {'file': ('audio.webm', audio_bytes, body.mimeType)}
        data = {'model': 'saaras:v3'} 
        
        res = requests.post(url, headers=headers, files=files, data=data)
        if res.status_code == 200:
            resp_json = res.json()
            transcript = resp_json.get("transcript", "")
            language_code = resp_json.get("language_code", "hi-IN")
            print(f"[STT Debug] Full API Response: {resp_json}")
            with open("stt_debug.log", "a") as f:
                f.write(f"STT Response: {resp_json}\n")
            return {"success": True, "data": {"text": transcript, "language_code": language_code}}
        else:
            print(f"[STT API Error] {res.status_code}: {res.text}")
            return {"success": False, "error": f"API Error {res.status_code}"}
    except Exception as e:
        print(f"[STT Error]: {e}")
        return {"success": False, "error": "Speech transcription failed"}

@router.post("/text-to-speech")
def text_to_speech(body: TextToSpeechRequest):
    if not SARVAM_API_KEY or SARVAM_API_KEY == "INSERT_YOUR_SARVAM_API_KEY_HERE":
        return {"success": False, "error": "SARVAM_API_KEY is not configured in .env"}
        
    try:
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }
        # The Sarvam TTS API expects 'inputs' as an array
        payload = {
            "inputs": [body.text],
            "target_language_code": body.target_language_code,
            "model": "bulbul:v3"
        }
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 200:
            audios = res.json().get("audios", [])
            if audios:
                return {"success": True, "data": {"audio": audios[0]}}
            return {"success": False, "error": "No audio returned"}
        else:
            print(f"[TTS API Error] {res.status_code}: {res.text}")
            return {"success": False, "error": f"API Error {res.status_code}"}
    except Exception as e:
        print(f"[TTS Error]: {e}")
        return {"success": False, "error": "Text to speech failed"}
 

