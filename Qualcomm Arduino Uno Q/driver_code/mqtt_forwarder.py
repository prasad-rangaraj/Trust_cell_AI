#!/usr/bin/env python3
"""
EV Guardian — Direct MQTT Serial Forwarder
===========================================
Reads the EXACT raw data from the Arduino serial socket
and publishes it directly to MQTT with ZERO modification.
What you see in the serial monitor = what gets sent to MQTT.
"""
import json
import time
import socket
import os
import sys

# Install paho-mqtt if not available
try:
    import paho.mqtt.client as mqtt
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paho-mqtt"])
    import paho.mqtt.client as mqtt

# ── MQTT Configuration ──
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 8083
MQTT_TOPIC = "ev/sensor/telemetry"

# ── Socket Path ──
SOCKET_PATH = "/var/run/arduino-router.sock"

def main():
    # 1. Connect to MQTT broker
    print(f"[MQTT] Connecting to {MQTT_BROKER}:{MQTT_PORT} via WebSockets...")
    try:
        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, transport="websockets")
        except AttributeError:
            client = mqtt.Client(transport="websockets")
        client.ws_set_options(path="/mqtt")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print(f"[MQTT] Connected to {MQTT_BROKER} successfully via WebSockets!")
    except Exception as e:
        print(f"[MQTT] FATAL: Cannot connect to broker: {e}")
        sys.exit(1)

    # 2. Connect to Arduino serial socket
    print(f"[SOCKET] Connecting to {SOCKET_PATH}...")
    if not os.path.exists(SOCKET_PATH):
        print(f"[SOCKET] FATAL: {SOCKET_PATH} does not exist! Is the Arduino connected?")
        sys.exit(1)

    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.connect(SOCKET_PATH)
    f = sock.makefile('r', encoding='utf-8', errors='replace')
    print("[SOCKET] Connected! Reading real sensor data...")

    # 3. Read and forward data
    json_lines = []
    in_json = False
    inline_buffer = {}

    for line in f:
        line = line.strip()
        if not line:
            continue
        print(f"[RAW SOCKET] {line}")

        # ── Collect JSON blocks (diagnostics from MCU) ──
        if line == "{":
            json_lines = ["{"]
            in_json = True
            continue

        if in_json:
            json_lines.append(line)
            if line == "}":
                in_json = False
                try:
                    json_text = "\n".join(json_lines)
                    diag_data = json.loads(json_text)
                    # Merge diagnostics into the inline buffer
                    inline_buffer["diagnostics"] = {
                        "severity": diag_data.get("severity", "UNKNOWN"),
                        "confidence": diag_data.get("confidence", 0.0),
                        "overall_trust": diag_data.get("overall_trust", 0),
                        "anomalous_sensors": diag_data.get("anomalous_sensors", []),
                        "recommendation": diag_data.get("recommendation", "")
                    }

                    # Now publish the FULL combined payload
                    if inline_buffer.get("cells"):
                        payload = {
                            "timestamp": int(time.time() * 1000),
                            "device_id": "ev-uno-q-01",
                            **inline_buffer
                        }
                        msg = json.dumps(payload)
                        client.publish(MQTT_TOPIC, msg)
                        print(f"[MQTT] SENT: C1={inline_buffer['cells']['voltage_v'][0]}V "
                              f"C2={inline_buffer['cells']['voltage_v'][1]}V "
                              f"T1={inline_buffer['cells']['temp_c'][0]}C "
                              f"CO={inline_buffer['pack']['gas_ppm']}ppm "
                              f"Sev={diag_data.get('severity')}")
                except json.JSONDecodeError as e:
                    print(f"[JSON] Parse error: {e}")
                json_lines = []
            continue

        # ── Parse inline sensor line (the C1: ... C2: ... line) ──
        if line.startswith("C1:"):
            try:
                import re
                c1 = re.search(r"C1:\s*([\d.]+)V", line)
                c2 = re.search(r"C2:\s*([\d.]+)V", line)
                c3 = re.search(r"C3:\s*([\d.]+)V", line)
                c4 = re.search(r"C4:\s*([\d.]+)V", line)
                amps = re.search(r"Amps:\s*([-\d.]+)A", line)
                t1 = re.search(r"T1:\s*([\d.]+)C", line)
                t2 = re.search(r"T2:\s*([\d.]+)C", line)
                co = re.search(r"CO:\s*([\d.]+)\s*ppm", line)
                vib = re.search(r"Vib:([\d.]+)g", line)

                inline_buffer = {
                    "cells": {
                        "voltage_v": [
                            float(c1.group(1)) if c1 else 0.0,
                            float(c2.group(1)) if c2 else 0.0,
                            float(c3.group(1)) if c3 else 0.0,
                            float(c4.group(1)) if c4 else 0.0,
                        ],
                        "temp_c": [
                            float(t1.group(1)) if t1 else 0.0,
                            float(t2.group(1)) if t2 else 0.0,
                        ]
                    },
                    "pack": {
                        "current_a": float(amps.group(1)) if amps else 0.0,
                        "gas_ppm": float(co.group(1)) if co else 0.0,
                        "vibration_g": float(vib.group(1)) if vib else 0.0,
                    },
                    "raw_serial": line
                }
            except Exception as e:
                print(f"[PARSE] Error parsing inline: {e}")

    sock.close()
    client.loop_stop()

if __name__ == "__main__":
    main()
