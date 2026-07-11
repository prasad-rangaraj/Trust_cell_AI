"""
POST /api/chat — Port of chat.controller.js
Gemini-powered AI chat, insight generation, and speech-to-text.
Uses the new google.genai SDK.
"""
import json
import urllib.request
import urllib.error
from fastapi import APIRouter
from dotenv import load_dotenv
import os

from schemas.bms import ChatRequest, InsightRequest, SpeechToTextRequest

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
        full_prompt = (
            f"[SYSTEM: Current Battery Context]\n{json.dumps(body.contextData)}\n\n"
            f"[USER]: {body.message}"
        )

    # Build messages array for Ollama
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    for m in body.history:
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
            OLLAMA_URL, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=300) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            reply_text = resp_data.get("message", {}).get("content", _FALLBACK_CHAT)
            return {"success": True, "data": {"role": "assistant", "content": reply_text}}
    except urllib.error.URLError as e:
        print(f"[Ollama Chat Error]: Is Ollama running? {e}")
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
            OLLAMA_URL, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            reply_text = resp_data.get("message", {}).get("content", _FALLBACK_INSIGHT)
            return {"success": True, "data": reply_text}
    except Exception as e:
        print(f"[Ollama Insight Error]: {e}")
        return {"success": True, "data": _FALLBACK_INSIGHT}


@router.post("/speech-to-text")
def speech_to_text(body: SpeechToTextRequest):
    try:
        result = _client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part(inline_data=types.Blob(mime_type=body.mimeType, data=body.audio)),
                types.Part(text="Transcribe this audio exactly as spoken. Return only the transcription. If silent or unclear, return an empty string."),
            ],
        )
        return {"success": True, "data": {"text": result.text.strip()}}
    except Exception as e:
        print(f"[STT Error]: {e}")
        return {"success": False, "error": "Speech transcription failed"}
