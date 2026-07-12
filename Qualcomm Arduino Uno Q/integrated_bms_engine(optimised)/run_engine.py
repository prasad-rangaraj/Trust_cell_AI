import sys
import time
import pprint
import json
import paho.mqtt.client as mqtt_lib

from inference import FaultClassificationEngine

engine = None

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"[MQTT] Connected with result code {reason_code}. Subscribing to telemetry topic...")
    client.subscribe("ev/sensor/telemetry")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        nested = json.loads(payload)
        
        # Flatten payload just like the server does
        telemetry_row = {
            'time': time.time(),
            'Cell1': float(nested["cells"]["voltage_v"][0]),
            'Cell2': float(nested["cells"]["voltage_v"][1]),
            'Cell3': float(nested["cells"]["voltage_v"][2]),
            'Cell4': float(nested["cells"]["voltage_v"][3]),
            'T1': float(nested["cells"]["temp_c"][0]),
            'T2': float(nested["cells"]["temp_c"][1]),
            'Current': float(nested["pack"]["current_a"]),
            'Vib_RMS': float(nested["pack"]["vibration_g"]),
            'Vib_Peak': float(nested["pack"].get("vibration_peak", 0.0)),
            'Vib_Freq': float(nested["pack"].get("vibration_freq", 0.0)),
            'CO_PPM': float(nested["pack"]["gas_ppm"]),
            'SoC': float(nested.get("soc", 100.0)),
            'SOH': float(nested.get("soh", 100.0)),
            'Status': 'IDLE',
            'Active_Cells': 4.0
        }

        print("\n[1] Received new telemetry row from MQTT. Adding to engine...")
        engine.add_row(telemetry_row)
        
        print("[2] Running Inference...")
        inference_output = engine.predict()
        
        print("\n[3] AI Diagnostics Result:")
        from pprint import pprint
        pprint(inference_output)
        
        # Publish the results back to the MQTT broker so the Web & Mobile backends can consume them
        try:
            payload = json.dumps(inference_output)
            client.publish("ev/diagnostics/prediction", payload)
        except Exception as e:
            print(f"[MQTT] Failed to publish diagnostics: {e}")
            
    except Exception as e:
        print(f"Error processing telemetry: {e}")

def main():
    global engine
    print("Loading Integrated BMS Engine...")
    engine = FaultClassificationEngine()
    
    # Configure for Mosquitto WebSocket as requested, using Paho MQTT v2 API
    client = mqtt_lib.Client(mqtt_lib.CallbackAPIVersion.VERSION2, transport="websockets")
    client.ws_set_options(path="/mqtt")
    client.on_connect = on_connect
    client.on_message = on_message

    print("Connecting to MQTT Broker (ws://test.mosquitto.org:8080)...")
    client.connect("test.mosquitto.org", 8080, 60)
    
    print("Listening for real-time telemetry. Press Ctrl+C to exit.")
    client.loop_forever()

if __name__ == "__main__":
    main()
