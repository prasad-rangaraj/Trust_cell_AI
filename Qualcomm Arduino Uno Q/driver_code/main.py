#!/usr/bin/env python3
"""
EV Guardian — Arduino App Lab Python Side (MPU/Linux)
======================================================
Reads sensor JSON from MCU via Serial bridge,
streams USB camera via MJPEG, and serves a
live dashboard on the local HDMI display.
"""
import subprocess
import sys
# ── Auto-install missing packages into App Lab venv ──────────────────────────
REQUIRED = [
    ("flask",         "flask"),
    ("serial",        "pyserial"),
    ("cv2",           "opencv-python"),
    ("paho.mqtt",     "paho-mqtt"),
]
for module, package in REQUIRED:
    try:
        __import__(module)
        print(f"[DEP] {package} already installed")
    except ImportError:
        print(f"[DEP] Installing {package}...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", package],
            stdout=subprocess.DEVNULL
        )
        print(f"[DEP] {package} installed OK")
# ── Now import everything safely ─────────────────────────────────────────────
import json
import re
import threading
import time
from datetime import datetime
try:
    import serial
    SERIAL_OK = True
except ImportError:
    SERIAL_OK = False
try:
    import cv2
    CAM_OK = True
except ImportError:
    CAM_OK = False
try:
    from flask import Flask, Response, render_template_string, request
except ImportError:
    print("[ERROR] Flask install failed. Check internet connection.")
    sys.exit(1)
try:
    import paho.mqtt.client as mqtt
    MQTT_OK = True
except ImportError:
    MQTT_OK = False

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 8083
MQTT_TOPIC_TELEMETRY = "ev/sensor/telemetry/live_arduino"
MQTT_TOPIC_DIAGNOSTICS = "ev/diagnostics/prediction"

mqtt_client = None
if MQTT_OK:
    try:
        # Avoid deprecation warnings in paho-mqtt 2.x while maintaining backward compatibility
        try:
            mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, transport="websockets")
        except AttributeError:
            mqtt_client = mqtt.Client(transport="websockets")
        mqtt_client.ws_set_options(path="/mqtt")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print(f"[MQTT] Connected to public broker at {MQTT_BROKER} via WebSockets on port {MQTT_PORT}")
    except Exception as e:
        print(f"[MQTT] Connection failed: {e}")
# ── Globals (shared between threads) ────────────────────────────────────────
sensor_state = {
    "c1": 0.0, "c2": 0.0, "c3": 0.0, "c4": 0.0,
    "current": 0.0,
    "temp1": "--", "temp2": "--",
    "co_ppm": 0.0,
    "vib_g": 0.0,
    "severity": "NORMAL",
    "confidence": 0.0,
    "overall_trust": 0,
    "recommendation": "Waiting for MCU data...",
    "anomalous_sensors": [],
    "top_anomalous_features": [],
    "last_update": "Never",
    "raw_line": ""
}
sensor_lock = threading.Lock()
camera_frame = None
camera_lock  = threading.Lock()
camera_source = 0
camera_source_lock = threading.Lock()
camera_restart_flag = False
video_paused = False
video_seek_frames = 0
video_control_lock = threading.Lock()
def _run_serial_loop(ser):
    buf = ""
    in_json = False
    json_lines = []
    while True:
        try:
            raw_line = ser.readline()
            if not raw_line:
                time.sleep(0.01)
                continue
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line:
                continue
            if line == "{":
                json_lines = ["{"]
                in_json = True
            elif in_json:
                json_lines.append(line)
                if line == "}":
                    in_json = False
                    _parse_json("\n".join(json_lines))
                    json_lines = []
            else:
                _parse_inline(line)
        except Exception as e:
            print(f"[SERIAL] Read error: {e}")
            time.sleep(1)

def read_serial():
    global sensor_state

    while True:
        # 1. Try UNIX socket (arduino-router multiplexed stream)
        import socket as _socket
        try:
            _sock = _socket.socket(_socket.AF_UNIX, _socket.SOCK_STREAM)
            import os
            socket_path = "/var/run/arduino-router.sock" if os.path.exists("/var/run/arduino-router.sock") else "/var/run/dashboard_fake.sock"
            _sock.connect(socket_path)
            print(f"[SOCKET] Connected to {socket_path}! Real data incoming...")
            f = _sock.makefile('r', encoding='utf-8', errors='replace')
            
            buf = ""
            in_json = False
            json_lines = []
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line == "{":
                    json_lines = ["{"]
                    in_json = True
                elif in_json:
                    json_lines.append(line)
                    if line == "}":
                        in_json = False
                        _parse_json("\n".join(json_lines))
                        json_lines = []
                else:
                    _parse_inline(line)
            print("[SOCKET] Connection lost. Retrying...")
        except Exception:
            pass

        # 2. Read DIRECTLY from /dev/ttyHS1 hardware serial port (fallback)
        PORTS = ["/dev/ttyHS1", "/dev/ttyACM0", "/dev/ttyACM1", "/dev/ttyUSB0"]
        for port in PORTS:
            try:
                import serial as _serial
                ser = _serial.Serial(port, 115200, timeout=3)
                print(f"[SERIAL] Connected directly on hardware port: {port}")
                _run_serial_loop(ser)
                break
            except Exception:
                continue

        print("[SERIAL] Searching for Arduino connection... Retrying in 3 seconds...")
        time.sleep(3)


def _parse_json(raw):
    global sensor_state
    try:
        data = json.loads(raw)
        with sensor_lock:
            sensor_state["severity"]               = data.get("severity", sensor_state.get("severity", "NORMAL"))
            sensor_state["confidence"]             = data.get("confidence", 0.0)
            sensor_state["overall_trust"]          = data.get("overall_trust", 0)
            sensor_state["recommendation"]         = data.get("recommendation", "")
            sensor_state["anomalous_sensors"]      = data.get("anomalous_sensors", [])
            sensor_state["top_anomalous_features"] = data.get("top_anomalous_features", [])
            sensor_state["last_update"]            = datetime.now().strftime("%H:%M:%S")

        # Publish combined full telemetry to Cloud MQTT (real sensor + diagnostic data)
        if MQTT_OK and mqtt_client:
            try:
                t1_val = float(sensor_state["temp1"]) if sensor_state["temp1"] not in ("--", "ERR") else 0.0
            except (ValueError, TypeError):
                t1_val = 0.0
            try:
                t2_val = float(sensor_state["temp2"]) if sensor_state["temp2"] not in ("--", "ERR") else 0.0
            except (ValueError, TypeError):
                t2_val = 0.0

            telemetry_payload = {
                "timestamp": int(time.time() * 1000),
                "device_id": "ev-uno-q-01",
                "cells": {
                    "voltage_v": [
                        sensor_state.get("c1", 0.0),
                        sensor_state.get("c2", 0.0),
                        sensor_state.get("c3", 0.0),
                        sensor_state.get("c4", 0.0)
                    ],
                    "temp_c": [t1_val, t2_val, 0.0, 0.0]
                },
                "pack": {
                    "current_a": sensor_state.get("current", 0.0),
                    "vibration_g": sensor_state.get("vib_g", 0.0),
                    "gas_ppm": sensor_state.get("co_ppm", 0.0)
                },
                "diagnostics": {
                    "severity": sensor_state.get("severity", "NORMAL"),
                    "confidence": sensor_state.get("confidence", 0.0),
                    "overall_trust": sensor_state.get("overall_trust", 0),
                    "anomalous_sensors": sensor_state.get("anomalous_sensors", []),
                    "recommendation": sensor_state.get("recommendation", "")
                }
            }
            try:
                mqtt_client.publish(MQTT_TOPIC_TELEMETRY, json.dumps(telemetry_payload))
                print(f"[MQTT] Published telemetry: severity={sensor_state.get('severity')} C1={sensor_state.get('c1')}V")
            except Exception as e:
                print(f"[MQTT] Publish error: {e}")
    except Exception as e:
        print(f"[JSON] Parse error: {e} | raw snippet: {raw[:80]}")

def _parse_inline(line):
    global sensor_state
    try:
        patterns = {
            "c1":      r"C1:\s*([\d.]+)V",
            "c2":      r"C2:\s*([\d.]+)V",
            "c3":      r"C3:\s*([\d.]+)V",
            "c4":      r"C4:\s*([\d.]+)V",
            "current": r"Amps:\s*([-\d.]+)A",
            "co_ppm":  r"CO:\s*([\d.]+)\s*ppm",
            "vib_g":   r"Vib:\s*([\d.]+)g",
        }
        updates = {}
        for key, pat in patterns.items():
            m = re.search(pat, line)
            if m:
                updates[key] = float(m.group(1))
        t1 = re.search(r"T1:\s*([\d.]+)C", line)
        t2 = re.search(r"T2:\s*([\d.]+)C", line)
        if t1: updates["temp1"] = t1.group(1)
        if t2: updates["temp2"] = t2.group(1)
        if updates:
            with sensor_lock:
                sensor_state.update(updates)
                sensor_state["last_update"] = datetime.now().strftime("%H:%M:%S")
            
            # Publish Telemetry to Cloud MQTT
            if MQTT_OK and mqtt_client:
                try:
                    t1_val = float(sensor_state["temp1"]) if sensor_state["temp1"] != "--" else 0.0
                except ValueError:
                    t1_val = 0.0
                try:
                    t2_val = float(sensor_state["temp2"]) if sensor_state["temp2"] != "--" else 0.0
                except ValueError:
                    t2_val = 0.0

                telemetry_payload = {
                    "timestamp": int(time.time() * 1000),
                    "device_id": "ev-uno-q-01",
                    "cells": {
                        "voltage_v": [
                            sensor_state.get("c1", 0.0),
                            sensor_state.get("c2", 0.0),
                            sensor_state.get("c3", 0.0),
                            sensor_state.get("c4", 0.0)
                        ],
                        "temp_c": [t1_val, t2_val, 0.0, 0.0]
                    },
                    "pack": {
                        "current_a": sensor_state.get("current", 0.0),
                        "vibration_g": sensor_state.get("vib_g", 0.0),
                        "gas_ppm": sensor_state.get("co_ppm", 0.0)
                    },
                    "metadata": {
                        "node_status": "OK"
                    }
                }
                try:
                    mqtt_client.publish(MQTT_TOPIC_TELEMETRY, json.dumps(telemetry_payload))
                except Exception as e:
                    print(f"[MQTT] Publish telemetry error: {e}")
    except Exception as e:
        print(f"[INLINE] Parse error: {e}")
def _demo_data():
    """No-op fallback — real data only. No dummy MQTT publishing."""
    print("[SERIAL] WARNING: No Arduino connection found. Dashboard shows zeros. MQTT will NOT publish dummy data.")
    while True:
        with sensor_lock:
            sensor_state["recommendation"] = "Waiting for Arduino MCU connection..."
            sensor_state["last_update"] = datetime.now().strftime("%H:%M:%S")
        time.sleep(5.0)

# ── Camera Thread ─────────────────────────────────────────────────────────────
def camera_thread():
    global camera_frame, camera_restart_flag, video_paused, video_seek_frames
    if not CAM_OK:
        return
        
    while True:
        with camera_source_lock:
            current_source = camera_source
            camera_restart_flag = False
            
        print(f"[CAMERA] Opening source: {current_source}")
        cap = None
        
        # Convert numeric strings to integers (e.g., '0' to 0)
        if isinstance(current_source, str) and current_source.isdigit():
            cap_source = int(current_source)
        else:
            cap_source = current_source
            
        if isinstance(cap_source, int):
            # Try V4L2/V4L backends for real USB cameras
            for backend in [cv2.CAP_V4L2, cv2.CAP_V4L, None]:
                try:
                    if backend is not None:
                        cap = cv2.VideoCapture(cap_source, backend)
                    else:
                        cap = cv2.VideoCapture(cap_source)
                    if cap and cap.isOpened():
                        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        ret, test_frame = cap.read()
                        if ret:
                            break
                        else:
                            cap.release()
                            cap = None
                except Exception:
                    if cap: cap.release()
                    cap = None
        else:
            # Video file path (direct open)
            try:
                cap = cv2.VideoCapture(cap_source)
            except Exception as e:
                print(f"[CAMERA] Video path failed: {e}")
                cap = None
                
        if cap is None or not cap.isOpened():
            print(f"[CAMERA] Failed to open source: {current_source}. Retrying in 3s...")
            time.sleep(3)
            continue
            
        print(f"[CAMERA] Successfully opened source: {current_source}")
        # Calculate video frame delay from FPS metadata
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0 or fps > 60:
            fps = 30.0
        frame_delay = 1.0 / fps
        
        while not camera_restart_flag:
            start_time = time.time()
            try:
                # Handle relative seeking in video files
                seek = 0
                with video_control_lock:
                    seek = video_seek_frames
                    video_seek_frames = 0
                
                if seek != 0 and not isinstance(cap_source, int):
                    curr_frame = cap.get(cv2.CAP_PROP_POS_FRAMES)
                    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    target = max(0, min(total_frames - 1, curr_frame + seek))
                    cap.set(cv2.CAP_PROP_POS_FRAMES, target)
                
                # Handle play/pause
                paused = False
                with video_control_lock:
                    paused = video_paused
                
                if paused and not isinstance(cap_source, int):
                    time.sleep(0.033)
                    continue
                
                ret, frame = cap.read()
                if ret:
                    # Optimize: downscale large frames to 640px width to speed up JPEG encoding
                    h, w = frame.shape[:2]
                    if w > 640:
                        scale = 640.0 / w
                        new_h = int(h * scale)
                        frame = cv2.resize(frame, (640, new_h), interpolation=cv2.INTER_AREA)
                        
                    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    with camera_lock:
                        camera_frame = buf.tobytes()
                else:
                    # Loop video file if EOF
                    if not isinstance(cap_source, int):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            except Exception as e:
                print(f"[CAMERA] Read error: {e}")
                time.sleep(0.5)
                
            # Precise sleep calculation to prevent lag and CPU overload
            elapsed = time.time() - start_time
            sleep_time = max(0.001, frame_delay - elapsed)
            time.sleep(sleep_time)
            
        cap.release()
# ── Flask Web Server ──────────────────────────────────────────────────────────
app = Flask(__name__)
DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>EV Guardian Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg:#080d14;--panel:#0d1520;--border:#1a2a3a;--accent:#00e5ff;
      --green:#00ff88;--amber:#ffb300;--red:#ff3d5a;--purple:#a855f7;
      --text:#e2f0ff;--muted:#4a6080;
    }
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;height:100vh;overflow:hidden;display:flex;flex-direction:column;}
    header{display:flex;align-items:center;justify-content:space-between;padding:10px 24px;background:linear-gradient(90deg,#0a1828,#0d1f30);border-bottom:1px solid var(--border);flex-shrink:0;}
    .logo-text{font-size:20px;font-weight:700;letter-spacing:1px;}
    .logo-sub{font-size:11px;color:var(--muted);letter-spacing:2px;}
    #severity-badge{padding:6px 20px;border-radius:20px;font-weight:700;font-size:13px;letter-spacing:1px;transition:all 0.4s;}
    .sev-NORMAL{background:rgba(0,255,136,0.15);color:var(--green);border:1px solid var(--green);}
    .sev-LOW{background:rgba(0,229,255,0.15);color:var(--accent);border:1px solid var(--accent);}
    .sev-MODERATE{background:rgba(255,179,0,0.15);color:var(--amber);border:1px solid var(--amber);}
    .sev-HIGH{background:rgba(255,61,90,0.15);color:var(--red);border:1px solid var(--red);}
    .sev-CRITICAL{background:rgba(255,61,90,0.3);color:var(--red);border:2px solid var(--red);animation:pulse-red 1s infinite;}
    @keyframes pulse-red{0%,100%{opacity:1}50%{opacity:0.5}}
    #clock{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);}
    .main-grid{display:grid;grid-template-columns:270px 1fr 270px;grid-template-rows:1fr auto;gap:10px;padding:10px;flex:1;overflow:hidden;}
    .panel{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:14px;overflow:hidden;}
    .panel-title{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
    .panel-title::before{content:'';width:3px;height:12px;background:var(--accent);border-radius:2px;}
    .left-panel{grid-column:1;grid-row:1;display:flex;flex-direction:column;gap:8px;}
    .cell-card{background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,112,255,0.04));border:1px solid var(--border);border-radius:10px;padding:10px 14px;}
    .cell-label{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
    .cell-value{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;line-height:1.2;}
    .cell-bar-track{height:4px;background:var(--border);border-radius:2px;margin-top:6px;}
    .cell-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#00e5ff,#00ff88);transition:width 0.5s ease;}
    .current-card{background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:12px 14px;}
    .current-label{font-size:10px;color:var(--purple);letter-spacing:1px;text-transform:uppercase;}
    .current-value{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;color:var(--purple);}
    .centre-panel{grid-column:2;grid-row:1;display:flex;flex-direction:column;}
    .camera-wrapper{flex:1;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:#000;position:relative;}
    .camera-wrapper img{width:100%;height:100%;object-fit:cover;}
    .camera-overlay{position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.6);border:1px solid var(--accent);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--accent);letter-spacing:1px;}
    .rec-dot{display:inline-block;width:8px;height:8px;background:var(--red);border-radius:50%;margin-right:6px;animation:blink 1s infinite;}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
    .no-camera{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--muted);}
    .no-camera .icon{font-size:48px;}
    .right-panel{grid-column:3;grid-row:1;display:flex;flex-direction:column;gap:8px;}
    .metric-row{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;}
    .metric-name{font-size:11px;color:var(--muted);}
    .metric-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;}
    .val-green{color:var(--green);}.val-amber{color:var(--amber);}.val-red{color:var(--red);}.val-blue{color:var(--accent);}
    .trust-ring-wrap{display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(0,229,255,0.04);border:1px solid rgba(0,229,255,0.2);border-radius:10px;}
    .trust-ring{position:relative;width:80px;height:80px;}
    .trust-ring svg{transform:rotate(-90deg);}
    .trust-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;}
    .trust-label{font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:6px;}
    .ai-box{background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.25);border-radius:10px;padding:10px 12px;flex:1;}
    .ai-title{font-size:10px;color:var(--purple);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
    #ai-recommendation{font-size:12px;color:var(--text);line-height:1.5;}
    #ai-features{margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;}
    .feat-tag{background:rgba(255,179,0,0.1);border:1px solid rgba(255,179,0,0.3);color:var(--amber);font-size:10px;padding:2px 8px;border-radius:12px;}
    .bottom-bar{grid-column:1/-1;display:flex;gap:10px;align-items:center;}
    .stat-pill{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:12px;font-family:'JetBrains Mono',monospace;display:flex;gap:8px;align-items:center;}
    .stat-pill .k{color:var(--muted);font-size:10px;}.stat-pill .v{color:var(--accent);}
    #update-time{margin-left:auto;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;}
    .camera-tabs { display: flex; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 5px; }
    .cam-tab { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s; }
    .cam-tab.active { background: rgba(0,229,255,0.1); color: var(--accent); border: 1px solid var(--accent); }
    #video-upload-box { display: none; flex-direction: column; gap: 8px; padding: 10px; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 8px; }
    #video-upload-box button { background: var(--accent); color: var(--bg); border: none; font-weight: 750; font-size: 11px; padding: 6px 14px; cursor: pointer; border-radius: 4px; text-transform: uppercase; transition: opacity 0.2s; }
    #video-upload-box button:hover { opacity: 0.85; }
    #video-controls { display: none; gap: 15px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid var(--border); margin-bottom: 8px; justify-content: center; align-items: center; }
    .ctrl-btn { background: transparent; border: none; color: var(--accent); font-size: 14px; cursor: pointer; padding: 4px; transition: transform 0.1s; }
    .ctrl-btn:active { transform: scale(0.9); }
  </style>
</head>
<body>
<header>
  <div>
    <div class="logo-text">⚡ EV GUARDIAN</div>
    <div class="logo-sub">Battery Management System · Arduino Uno Q 4GB</div>
  </div>
  <div id="severity-badge" class="sev-NORMAL">● NORMAL</div>
  <div id="clock">--:--:--</div>
</header>
<div class="main-grid">
  <!-- LEFT: Cell Voltages + Current -->
  <div class="left-panel panel">
    <div class="panel-title">Cell Voltages</div>
    <div class="cell-card">
      <div class="cell-label">Cell 1</div>
      <div class="cell-value" id="c1">-.---V</div>
      <div class="cell-bar-track"><div class="cell-bar-fill" id="bar1" style="width:0%"></div></div>
    </div>
    <div class="cell-card">
      <div class="cell-label">Cell 2</div>
      <div class="cell-value" id="c2">-.---V</div>
      <div class="cell-bar-track"><div class="cell-bar-fill" id="bar2" style="width:0%"></div></div>
    </div>
    <div class="cell-card">
      <div class="cell-label">Cell 3</div>
      <div class="cell-value" id="c3">-.---V</div>
      <div class="cell-bar-track"><div class="cell-bar-fill" id="bar3" style="width:0%"></div></div>
    </div>
    <div class="cell-card">
      <div class="cell-label">Cell 4</div>
      <div class="cell-value" id="c4">-.---V</div>
      <div class="cell-bar-track"><div class="cell-bar-fill" id="bar4" style="width:0%"></div></div>
    </div>
    <div class="current-card">
      <div class="current-label">Pack Current</div>
      <div class="current-value" id="current">-.--A</div>
    </div>
  </div>
  <!-- CENTRE: Camera -->
  <div class="centre-panel panel" style="display:flex; flex-direction:column;">
    <div class="panel-title">Video Feed Control</div>
    <div class="camera-tabs">
      <button class="cam-tab active" id="tab-usb" onclick="switchCameraSource('0', 'tab-usb')">USB Live</button>
      <button class="cam-tab" id="tab-vid" onclick="showVideoUpload()">Local Video</button>
    </div>
    <div id="video-upload-box">
      <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; font-family:'JetBrains Mono',monospace;">
        <span style="color:var(--muted);">Folder:</span>
        <span id="current-dir-path" style="color:var(--accent); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">/home/arduino</span>
      </div>
      <div id="file-explorer-list" style="height: 120px; overflow-y: auto; background: #070a0e; border: 1px solid var(--border); border-radius: 6px; padding: 4px; display:flex; flex-direction:column; gap:4px; font-family:'JetBrains Mono',monospace; font-size:11px;">
        <!-- Dynamically populated files & directories -->
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding-top:4px;">
        <span id="selected-file-label" style="font-size:10px; color:var(--muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:140px;">No video selected</span>
        <button onclick="playExplorerVideo()" style="background:var(--accent); color:var(--bg); border:none; font-weight:750; font-size:11px; padding:4px 12px; cursor:pointer; border-radius:4px; text-transform:uppercase;">Play Video</button>
      </div>
    </div>
    <div id="video-controls">
      <button class="ctrl-btn" onclick="videoControl('backward')" title="Backward 5s">⏪</button>
      <button class="ctrl-btn" id="play-pause-btn" onclick="videoControl('toggle_play')" title="Play/Pause">⏸</button>
      <button class="ctrl-btn" onclick="videoControl('forward')" title="Forward 5s">⏩</button>
    </div>
    <div class="camera-wrapper" style="flex:1;">
      <img id="cam-feed" src="/video_feed" alt="Live Camera"
           onerror="this.style.display='none';document.getElementById('no-cam').style.display='flex'"/>
      <div class="camera-overlay"><span class="rec-dot"></span>LIVE</div>
      <div class="no-camera" id="no-cam" style="display:none">
        <div class="icon">📷</div>
        <p>Camera not detected</p>
        <p style="font-size:11px">Connect USB camera to the hub</p>
      </div>
    </div>
  </div>
  <!-- RIGHT: Sensors + AI Trust -->
  <div class="right-panel panel">
    <div class="panel-title">Environment</div>
    <div class="metric-row">
      <span class="metric-name">🌡 Temp 1</span>
      <span class="metric-val val-amber" id="temp1">--°C</span>
    </div>
    <div class="metric-row">
      <span class="metric-name">🌡 Temp 2</span>
      <span class="metric-val val-amber" id="temp2">--°C</span>
    </div>
    <div class="metric-row">
      <span class="metric-name">💨 CO Gas</span>
      <span class="metric-val val-green" id="co_ppm">-- ppm</span>
    </div>
    <div class="metric-row">
      <span class="metric-name">📳 Vibration</span>
      <span class="metric-val val-blue" id="vib_g">-.---g</span>
    </div>
    <div class="trust-ring-wrap">
      <div class="trust-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1a2a3a" stroke-width="8"/>
          <circle id="trust-circle" cx="40" cy="40" r="34" fill="none"
                  stroke="#00ff88" stroke-width="8"
                  stroke-dasharray="213.6" stroke-dashoffset="213.6"
                  stroke-linecap="round" style="transition:stroke-dashoffset 0.6s,stroke 0.4s"/>
        </svg>
        <div class="trust-val" id="trust-val">0%</div>
      </div>
      <div class="trust-label">OVERALL TRUST SCORE</div>
    </div>
    <div class="ai-box">
      <div class="ai-title">🤖 AI Diagnostics</div>
      <div id="ai-recommendation">Waiting for MCU data...</div>
      <div id="ai-features"></div>
    </div>
  </div>
  <!-- BOTTOM BAR -->
  <div class="bottom-bar">
    <div class="stat-pill"><span class="k">PACK V</span><span class="v" id="pack-v">-.--V</span></div>
    <div class="stat-pill"><span class="k">CONFIDENCE</span><span class="v" id="confidence">-.----</span></div>
    <div class="stat-pill"><span class="k">ANOMALOUS</span><span class="v" id="anomalous">--</span></div>
    <div id="update-time">Last MCU update: <span id="last-upd">--</span></div>
  </div>
</div>
<script>
  setInterval(()=>{ document.getElementById('clock').textContent = new Date().toLocaleTimeString(); }, 1000);
  const SEV = {
    NORMAL:'sev-NORMAL', LOW:'sev-LOW',
    MODERATE:'sev-MODERATE', HIGH:'sev-HIGH', CRITICAL:'sev-CRITICAL'
  };
  function cellPct(v){ return Math.min(100,Math.max(0,((v-2.8)/(4.25-2.8))*100)); }
  function $id(id){ return document.getElementById(id); }
  function setText(id,val){ const e=$id(id); if(e) e.textContent=val; }
  async function poll(){
    try{
      const d = await (await fetch('/data')).json();
      ['c1','c2','c3','c4'].forEach((k,i)=>{
        setText(k, parseFloat(d[k]).toFixed(3)+'V');
        const b=$id('bar'+(i+1));
        if(b) b.style.width=cellPct(d[k])+'%';
      });
      setText('pack-v', (d.c1+d.c2+d.c3+d.c4).toFixed(2)+'V');
      setText('current', (d.current>=0?'+':'')+parseFloat(d.current).toFixed(2)+'A');
      setText('temp1', d.temp1+'°C');
      setText('temp2', d.temp2+'°C');
      setText('co_ppm', parseFloat(d.co_ppm).toFixed(1) + ' ppm');
      setText('vib_g', parseFloat(d.vib_g).toFixed(3) + 'g');

      // Update trust score SVG circle
      const trust = d.overall_trust;
      setText('trust-val', trust + '%');
      const circle = $id('trust-circle');
      if (circle) {
        const offset = 213.6 - (213.6 * trust / 100);
        circle.style.strokeDashoffset = offset;
        if (trust < 40) circle.style.stroke = 'var(--red)';
        else if (trust < 80) circle.style.stroke = 'var(--amber)';
        else circle.style.stroke = 'var(--green)';
      }

      // Update AI Recommendation
      setText('ai-recommendation', d.recommendation || 'BMS status normal.');
      const featuresEl = $id('ai-features');
      if (featuresEl) {
        featuresEl.innerHTML = '';
        (d.top_anomalous_features || []).forEach(f => {
          const span = document.createElement('span');
          span.className = 'feat-tag';
          span.textContent = f;
          featuresEl.appendChild(span);
        });
      }

      // Update Bottom Bar
      setText('confidence', parseFloat(d.confidence).toFixed(4));
      setText('anomalous', (d.anomalous_sensors || []).length);
      setText('last-upd', d.last_update || '--');

      // Update Badge
      const badge = $id('severity-badge');
      if (badge) {
        badge.className = SEV[d.severity] || 'sev-NORMAL';
        badge.textContent = '● ' + d.severity;
      }
    } catch(e) {
      console.error("Polling error:", e);
    }
  }
  setInterval(poll, 500);
  poll();

  function switchCameraSource(source, tabId) {
    document.getElementById('tab-usb').classList.remove('active');
    document.getElementById('tab-vid').classList.remove('active');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'tab-usb') {
      document.getElementById('video-upload-box').style.display = 'none';
      document.getElementById('video-controls').style.display = 'none';
      // Reset variables so it doesn't auto-resume/run in the background
      selectedVideoPath = "";
      document.getElementById('selected-file-label').textContent = "No video selected";
      document.getElementById('selected-file-label').style.color = "var(--muted)";
      document.getElementById('play-pause-btn').textContent = "⏸";
    } else {
      document.getElementById('video-controls').style.display = 'flex';
    }
    
    // Explicitly reset display states so browser doesn't hide it on timeout
    const img = document.getElementById('cam-feed');
    img.style.display = 'none';
    document.getElementById('no-cam').style.display = 'none';
    
    // Refresh the stream source by hitting Flask API
    fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set_source', source: source })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Source changed:", data.message);
      setTimeout(() => {
        img.src = "/video_feed?" + new Date().getTime();
        img.style.display = 'block';
        document.getElementById('no-cam').style.display = 'none';
      }, 1000);
    })
    .catch(err => {
      console.error("Failed to swap camera source:", err);
      document.getElementById('no-cam').style.display = 'flex';
    });
  }

  let currentDirectory = "/home/arduino";
  let selectedVideoPath = "";

  function showVideoUpload() {
    document.getElementById('tab-usb').classList.remove('active');
    document.getElementById('tab-vid').classList.add('active');
    document.getElementById('video-upload-box').style.display = 'flex';
    loadDirectory(currentDirectory);
  }

  function loadDirectory(path) {
    const listEl = document.getElementById('file-explorer-list');
    listEl.innerHTML = "<div style='color:var(--muted); padding:4px;'>Loading folder...</div>";
    
    fetch(`/api/files?path=${encodeURIComponent(path)}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok') {
        currentDirectory = data.current_path;
        document.getElementById('current-dir-path').textContent = currentDirectory;
        listEl.innerHTML = "";
        
        data.items.forEach(item => {
          const div = document.createElement('div');
          div.style.padding = "4px 8px";
          div.style.cursor = "pointer";
          div.style.borderRadius = "4px";
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.gap = "6px";
          div.style.transition = "background 0.2s";
          
          if (item.is_dir) {
            div.innerHTML = `📁 <span style="color:var(--accent); font-weight:600;">${item.name}</span>`;
            div.onclick = () => loadDirectory(item.path);
          } else {
            div.innerHTML = `🎥 <span style="color:var(--text);">${item.name}</span>`;
            div.onclick = () => selectVideo(item.path, item.name, div);
          }
          listEl.appendChild(div);
        });
        
        if (data.items.length === 0) {
          listEl.innerHTML = "<div style='color:var(--muted); padding:4px;'>No folders or videos found</div>";
        }
      } else {
        listEl.innerHTML = `<div style='color:var(--red); padding:4px;'>Error: ${data.message}</div>`;
      }
    })
    .catch(err => {
      listEl.innerHTML = "<div style='color:var(--red); padding:4px;'>Failed to load folder</div>";
    });
  }

  function selectVideo(path, name, element) {
    selectedVideoPath = path;
    const listEl = document.getElementById('file-explorer-list');
    Array.from(listEl.children).forEach(child => {
      child.style.background = "transparent";
    });
    element.style.background = "rgba(0, 229, 255, 0.15)";
    document.getElementById('selected-file-label').textContent = "Selected: " + name;
    document.getElementById('selected-file-label').style.color = "var(--green)";
  }

  function playExplorerVideo() {
    if (selectedVideoPath) {
      switchCameraSource(selectedVideoPath, 'tab-vid');
    }
  }

  function videoControl(action) {
    fetch('/api/video/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
    })
    .then(res => res.json())
    .then(data => {
      if (action === 'toggle_play') {
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = data.paused ? "▶" : "⏸";
      }
    })
    .catch(err => console.error("Control error:", err));
  }
</script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(DASHBOARD_HTML)

@app.route('/data')
def data():
    with sensor_lock:
        return json.dumps(sensor_state)

@app.route('/api/command', methods=['POST'])
def api_command():
    global camera_source, camera_restart_flag
    try:
        data = request.get_json()
        command = data.get("command")
        if command == "set_source":
            source = data.get("source")
            with camera_source_lock:
                camera_source = source
                camera_restart_flag = True
            print(f"[API] Camera source changed to: {source}")
            return json.dumps({"status": "ok", "message": f"Source changed to {source}"}), 200, {'Content-Type': 'application/json'}
        elif command == "toggle_ai":
            enabled = data.get("enabled", False)
            print(f"[API] AI prediction state: {enabled}")
            return json.dumps({"status": "ok", "message": f"AI state is {enabled}"}), 200, {'Content-Type': 'application/json'}
        else:
            return json.dumps({"status": "error", "message": f"Unknown command: {command}"}), 400, {'Content-Type': 'application/json'}
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Content-Type': 'application/json'}

@app.route('/api/upload', methods=['POST'])
def api_upload():
    global camera_source, camera_restart_flag, video_paused
    try:
        if 'file' not in request.files:
            return json.dumps({"status": "error", "message": "No file part"}), 400, {'Content-Type': 'application/json'}
        file = request.files['file']
        if file.filename == '':
            return json.dumps({"status": "error", "message": "No selected file"}), 400, {'Content-Type': 'application/json'}
            
        upload_path = "/tmp/uploaded_video.mp4"
        file.save(upload_path)
        
        with camera_source_lock:
            camera_source = upload_path
            camera_restart_flag = True
        with video_control_lock:
            video_paused = False  # Resume play on new video upload
            
        print(f"[API] Uploaded video saved: {upload_path}")
        return json.dumps({"status": "ok", "message": "Video uploaded successfully"}), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Content-Type': 'application/json'}

@app.route('/api/files', methods=['GET'])
def api_list_files():
    try:
        import os
        path = request.args.get('path', '/home/arduino')
        if not os.path.exists(path):
            return json.dumps({"status": "error", "message": "Path does not exist"}), 400, {'Content-Type': 'application/json'}
        if not os.path.isdir(path):
            return json.dumps({"status": "error", "message": "Path is not a directory"}), 400, {'Content-Type': 'application/json'}
            
        items = []
        parent = os.path.abspath(os.path.join(path, os.pardir))
        if os.path.exists(parent) and parent != path:
            items.append({"name": ".. (Parent Directory)", "path": parent, "is_dir": True})
            
        for name in sorted(os.listdir(path)):
            full_path = os.path.join(path, name)
            is_dir = os.path.isdir(full_path)
            # Only show folders and supported video formats
            if is_dir or name.lower().endswith(('.mp4', '.avi', '.mkv', '.mov')):
                items.append({
                    "name": name,
                    "path": full_path,
                    "is_dir": is_dir
                })
        return json.dumps({"status": "ok", "current_path": path, "items": items}), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Content-Type': 'application/json'}

@app.route('/api/video/control', methods=['POST'])
def api_video_control():
    global video_paused, video_seek_frames
    try:
        data = request.get_json()
        action = data.get("action")
        if action == "toggle_play":
            with video_control_lock:
                video_paused = not video_paused
            return json.dumps({"status": "ok", "paused": video_paused}), 200, {'Content-Type': 'application/json'}
        elif action == "forward":
            with video_control_lock:
                video_seek_frames = 150  # Seek forward 150 frames (~5s)
            return json.dumps({"status": "ok"}), 200, {'Content-Type': 'application/json'}
        elif action == "backward":
            with video_control_lock:
                video_seek_frames = -150  # Seek backward 150 frames (~5s)
            return json.dumps({"status": "ok"}), 200, {'Content-Type': 'application/json'}
        else:
            return json.dumps({"status": "error", "message": f"Unknown action: {action}"}), 400, {'Content-Type': 'application/json'}
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Content-Type': 'application/json'}

def gen_frames():
    global camera_frame
    while True:
        frame_data = None
        with camera_lock:
            if camera_frame is not None:
                frame_data = camera_frame
        
        if frame_data is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    # Start background threads
    t_serial = threading.Thread(target=read_serial, daemon=True)
    t_serial.start()
    
    t_camera = threading.Thread(target=camera_thread, daemon=True)
    t_camera.start()
    
    print("[FLASK] Starting dashboard web server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
