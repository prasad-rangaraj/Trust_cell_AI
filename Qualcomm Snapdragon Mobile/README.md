EV Guardian — Native Android App (Qualcomm Snapdragon Mobile) 🔋📱

📖 Application Description

This module is the mobile edge-AI companion of the EV Guardian platform. It brings real-time battery telemetry, 3D battery-pack visualization, voice/chat assistance, and — most importantly — on-device (edge) anomaly detection straight to the driver's Snapdragon-powered phone.

It is composed of two parts:


client/ — a native Jetpack Compose Android application that renders live BMS telemetry, a 3D EV twin, and an AI assistant, and runs a local fault-classification model directly on the Snapdragon SoC.
server/ — a lightweight Kotlin/Ktor backend used to relay/serve mobile-specific data alongside the main Python backend.


The core design goal is safety without a connectivity dependency: even if Wi-Fi/cellular drops or the cloud server is unreachable, the phone keeps scoring incoming battery telemetry locally, on-device, in real time.


🧠 AI on Qualcomm: Model, Runtime & Why

What runs on-device

DetailModel filebms_anomaly.onnx (dropped into client/app/src/main/assets/)Task4-class real-time fault classification: Normal, Overtemp, Cell Imbalance, Gas HazardInputs9-feature telemetry vector — 4 cell voltages, pack current, 2 temperature sensors, gas (ppm), vibrationRuntimeONNX Runtime Mobile for Android v1.20.0 (onnxruntime-android)Target hardwareQualcomm Snapdragon mobile SoC (CPU/GPU/Hexagon NPU via ONNX Runtime execution providers)

Why an on-device ONNX classifier (and not a cloud call)?


Zero-latency safety loop — a thermal runaway or gas leak needs a sub-second local decision, not a round-trip to a server.
Offline resilience — the app is explicitly designed to keep classifying battery health even with Wi-Fi turned off (see Tests below); a cloud-only model can't do that.
Energy & resource efficiency — the model is a compact classifier (9 → 4) intentionally kept small so it can run continuously on a phone's NPU/CPU without draining the battery, which directly aligns with the "resource utilization, latency, and energy efficiency" judging criteria for Snapdragon edge deployment.
Privacy — raw sensor telemetry never has to leave the device for a safety classification to be produced.


Qualcomm AI Hub — optimizing and deploying bms_anomaly.onnx

Rather than shipping a hand-tuned model, this module is built to plug into the Qualcomm® AI Hub workflow to compile, profile, and validate bms_anomaly.onnx for real Snapdragon hardware before it ever ships in the APK:

bashpip install qai-hub qai-hub-models
qai-hub configure --api_token <YOUR_QUALCOMM_AI_HUB_TOKEN>

# Profile / compile the trained BMS classifier for a target Snapdragon device
qai-hub submit-compile-job \
  --model bms_anomaly.onnx \
  --device "Snapdragon 8 Elite (Family)" \
  --target-runtime onnx

# Profile on a real, cloud-hosted Snapdragon device to measure on-NPU latency & memory
qai-hub submit-profile-job --model <compiled-model-id> --device "Snapdragon 8 Elite (Family)"

This gives concrete, hardware-verified latency/memory numbers on Hexagon NPU (rather than only a phone-side estimate) and lets the model be re-compiled per target runtime (ONNX Runtime QNN Execution Provider, TFLite, etc.) without touching app code — the app only ever needs to load whatever .onnx file is exported into assets/.


This companions the sibling Qualcomm Arduino Uno Q module in this repo, which uses ready-made Qualcomm AI Hub Models (FaceDetLite, FaceAttribNet) for driver-drowsiness detection — together the two modules show both paths Qualcomm AI Hub supports: (1) deploying pre-built AI Hub models, and (2) compiling/profiling a custom-trained model for Snapdragon, which is what this Mobile module does for battery safety.




🚀 Setup & Installation Instructions

Prerequisites: Android Studio (Hedgehog+), JDK 17, an Android device/emulator running API 26+, Node/Python for the main EV Guardian server.

1. Mobile Server (Ktor):

bashcd server
./gradlew build

2. Android App:


Open Android Studio.
Click Open and select the client/app folder (or open the whole client/ project).
Allow Gradle to sync and download all required Android SDK components and the onnxruntime-android dependency.
Update SERVER_URL in BmsViewModel.kt to match your telemetry server (defaults to the deployed EV Guardian cloud server).
Place your compiled/exported bms_anomaly.onnx model into client/app/src/main/assets/ (see the Qualcomm AI Hub section above for how to compile it).



🏃 Run and Usage Instructions

Run the Mobile Server:

bashcd server
./gradlew run

Run the Android App:


Ensure an Android Emulator is running, or a physical Snapdragon-powered device is connected via USB (recommended, to exercise the real Hexagon NPU path).
Click the Run (Play) button in Android Studio.
The app launches, connects via Socket.IO to the live telemetry stream, and immediately begins running bms_anomaly.onnx inference locally on every incoming reading.
The Assistant tab surfaces both the cloud diagnosis and the local ONNX result (ONNX Local Result: <label> (<confidence>%)) side by side.



🧪 Tests


Edge-only test: Turn off the phone's Wi-Fi/mobile data. The local ONNX model continues to score cached/incoming telemetry and the UI falls back to "⚠️ Server unreachable. Based on local ONNX: <label>", proving true on-device inference.
Fault-injection test: Drive the simulator/hardware to push temperature, gas, or cell-imbalance values into abnormal ranges and confirm the ONNX result label switches from Normal to the correct fault class in real time.
Push notification test: Verify notifications trigger when the Ktor/cloud server broadcasts a severe fault, independent of the local ONNX path.



📝 Notes & References


Edge-Native Architecture: The Android app performs anomaly/fault detection locally on the Snapdragon processor, demonstrating a hybrid edge–cloud approach — cloud telemetry/chat when available, uninterrupted local safety inference always.
Qualcomm AI Hub: aihub.qualcomm.com — used to compile and profile bms_anomaly.onnx for target Snapdragon devices (see workflow above).
ONNX Runtime Mobile: onnxruntime.ai — executes the compiled model on-device, able to leverage Qualcomm's QNN Execution Provider to route inference to the Hexagon NPU.
Built natively using Kotlin, Jetpack Compose, and Ktor.
Code contains extensive inline documentation covering ONNX session lifecycle, view states, and Socket.IO connections.
