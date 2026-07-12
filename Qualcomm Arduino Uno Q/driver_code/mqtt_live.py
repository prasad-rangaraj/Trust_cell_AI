import serial, re, json, time
import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
PORT   = 8083
TOPIC  = "ev/sensor/telemetry/live_arduino"

client = mqtt.Client(transport="websockets")
client.ws_set_options(path="/mqtt")
client.connect(BROKER, PORT, 60)
client.loop_start()
print(f"[MQTT] Connected to {BROKER} successfully via WebSockets!")

ser = serial.Serial("/dev/ttyHS1", 115200, timeout=2)
print("[SERIAL] Reading from /dev/ttyHS1...")

state = {}
while True:
    try:
        line = ser.readline().decode("utf-8", errors="replace").strip()
        if not line: continue
        print("[RAW]", line)
        for key, pat in [("c1",r"C1:\s*([\d.]+)V"),("c2",r"C2:\s*([\d.]+)V"),
                         ("c3",r"C3:\s*([\d.]+)V"),("c4",r"C4:\s*([\d.]+)V"),
                         ("amps",r"Amps:\s*([-\d.]+)A"),("co",r"CO:\s*([\d.]+)\s*ppm"),
                         ("vib",r"Vib:\s*([\d.]+)g")]:
            m = re.search(pat, line)
            if m: state[key] = float(m.group(1))
        for k,p in [("t1",r"T1:\s*([\d.]+)C"),("t2",r"T2:\s*([\d.]+)C")]:
            m = re.search(p, line)
            if m: state[k] = float(m.group(1))
        if "c1" in state:
            payload = json.dumps({
                "timestamp": int(time.time()*1000),
                "device_id": "ev-uno-q-01",
                "cells": {"voltage_v": [state.get("c1",0), state.get("c2",0),
                                        state.get("c3",0), state.get("c4",0)],
                          "temp_c": [state.get("t1",0), state.get("t2",0)]},
                "pack": {"current_a": state.get("amps",0),
                         "vibration_g": state.get("vib",0),
                         "gas_ppm": state.get("co",0)}
            })
            client.publish(TOPIC, payload)
            print("[MQTT] SENT:", payload[:80])
    except Exception as e:
        print("[ERR]", e)
        time.sleep(1)
