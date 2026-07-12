# EV Guardian - Native Android App (Qualcomm Snapdragon Mobile)

## 📖 Application Description
This module provides the mobile ecosystem for EV Guardian, bringing real-time battery telemetry, 3D visualizations, and chat interfaces directly to the driver's phone. It consists of a Kotlin-based Ktor backend server and a natively built Android application (Jetpack Compose). To ensure maximum reliability in remote areas, the Android app integrates local ONNX models for edge-based anomaly detection directly on the Snapdragon mobile platform.

## 🚀 Setup & Installation Instructions
**Prerequisites:** Android Studio, JDK 17, Node/Python (for main server).

**1. Mobile Server (Ktor):**
```bash
cd server
./gradlew build
```

**2. Android App:**
1. Open **Android Studio**.
2. Click **Open** and select the `client/app` folder.
3. Allow Gradle to sync and download all necessary Android SDK components.
4. Update `SERVER_URL` in `BmsViewModel.kt` to match your PC's local IP address.

## 🏃 Run and Usage Instructions
**Run the Mobile Server:**
```bash
cd server
./gradlew run
```

**Run the Android App:**
- Ensure an Android Emulator is running, or a physical Snapdragon device is connected via USB.
- Click the **Run (Play)** button in Android Studio.
- The app will launch and connect via Socket.IO to the live telemetry stream.

## 🧪 Tests
- Turn off your phone's Wi-Fi to test the local Edge capabilities. The local ONNX model within the Android app will continue to score historical telemetry cached on the device.
- Verify push notifications trigger when the Ktor server broadcasts a severe fault.

## 📝 Notes & References
- **Edge Native:** The Android app runs anomaly detection locally on the Snapdragon processor, demonstrating a hybrid edge-cloud approach.
- **References:** Built natively using Kotlin and Jetpack Compose.
- Code contains extensive documentation detailing view states and Socket connections.


