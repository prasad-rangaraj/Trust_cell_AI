#!/bin/bash
# =================================================================
# EV Guardian — QRB2210 Standalone Launcher (No Laptop Required)
# =================================================================

# =================================================================
# 1. Cold Boot Compulsory Reboot Handler
# =================================================================
BOOT_COUNT_FILE="/home/arduino/.boot_count"
if [ ! -f "$BOOT_COUNT_FILE" ]; then
    echo "0" > "$BOOT_COUNT_FILE"
fi

BOOT_VAL=$(cat "$BOOT_COUNT_FILE")

if [ "$BOOT_VAL" -eq 0 ] 2>/dev/null; then
    echo "1" > "$BOOT_COUNT_FILE"
    echo "[SYSTEM] Cold boot detected. Executing compulsory system reboot..."
    sync
    sudo reboot
    exit 0
else
    echo "0" > "$BOOT_COUNT_FILE"
    echo "[SYSTEM] Warm reboot active. Proceeding with priority launch..."
fi

# =================================================================
# 2. Priority Phase 1: Wait for Display Server (X11) to stabilize (Fast)
# =================================================================
echo "[PRIORITY 1] Waiting 4s for LightDM and X11 to stabilize..."
sleep 4

export DISPLAY=:0
echo "[DISPLAY] Letting OS auto-detect display resolution..."
# Removed the forced 1080p command that was crashing the 7-inch display
sleep 1

# =================================================================
# 3. Priority Phase 2: Clean locks and start MQTT broker
# =================================================================
echo "[PRIORITY 2] Cleaning up sockets and starting MQTT..."
pkill -f main.py
pkill -f backend.py
sudo fuser -k /dev/video0 2>/dev/null
sudo fuser -k 5000/tcp 2>/dev/null

sudo systemctl start mosquitto || sudo service mosquitto start

# Add local path to environment
cd "/home/arduino/ArduinoApps/e"
export PYTHONPATH=$PYTHONPATH:.

# =================================================================
# 4. Priority Phase 3: Start Python Application (Low CPU Priority)
# =================================================================
echo "[PRIORITY 3] Launching main.py..."
nice -n 5 python3 python/main.py &
MAIN_APP_PID=$!

# Wait for Python Flask server to be fully ready before starting browser (Fast)
echo "[PRIORITY 3] Waiting 4s for Flask app to initialize..."
sleep 4

# =================================================================
# 5. Priority Phase 4: Launch Web Browser (Lowest CPU Priority)
# =================================================================
echo "[PRIORITY 4] Detecting Chromium executable path..."
CHROMIUM_CMD="chromium"
if ! command -v chromium &> /dev/null; then
    if command -v chromium-browser &> /dev/null; then
        CHROMIUM_CMD="chromium-browser"
    else
        CHROMIUM_CMD="/usr/lib/chromium/chromium"
    fi
fi

echo "[PRIORITY 4] Starting Chromium kiosk browser: $CHROMIUM_CMD..."
# Added flags to disable GPU software rasterizer which prevents the 100% CPU boot spike
nice -n 10 $CHROMIUM_CMD --no-sandbox --kiosk --disable-gpu --disable-software-rasterizer --app=http://localhost:5000 &
CHROMIUM_PID=$!

echo "================================================================="
echo "  EV Guardian Standalone Suite is running on port 5000!"
echo "================================================================="

# Wait and manage shutdown gracefully
trap "echo [STOP] Terminating all services...; kill $MAIN_APP_PID $CHROMIUM_PID; exit" INT TERM
wait
