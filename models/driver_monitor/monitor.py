import cv2
import time
import os
import urllib.request
import ssl
import json
import threading
import torch
import numpy as np
from PIL import Image

# Import Qualcomm AI Hub Models & Apps
from qai_hub_models.models.face_det_lite.model import FaceDetLite
from qai_hub_models.models.face_det_lite.app import FaceDetLiteApp
from qai_hub_models.models.face_attrib_net.model import FaceAttribNet

def main():
    print("[INFO] Initializing Qualcomm Edge AI Drowsiness Detection...")
    
    # Bypass SSL for cloud alerts
    ssl._create_default_https_context = ssl._create_unverified_context
    
    print("[INFO] Loading FaceDetLite (Lightweight Face Detection)...")
    # This automatically downloads the weights and caches them locally
    model_det = FaceDetLite.from_pretrained()
    det_app = FaceDetLiteApp(model_det)
    
    print("[INFO] Loading FaceAttribNet (Facial Attribute Detection)...")
    model_attr = FaceAttribNet.from_pretrained()

    print("[INFO] Starting webcam...")
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    pTime = 0
    print("[INFO] Camera active. Make sure to click the video window before pressing 'q' to quit.")
    
    eyes_closed_frames = 0
    last_alert_time = 0
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            continue

        is_sleeping = False
        is_sunglasses = False
        
        # 1. Convert OpenCV BGR to PIL RGB for qai_hub_models
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(image_rgb)
        
        # 2. Run Face Detection
        bboxes, annotated_img = det_app.predict(pil_img)
        
        # Pick the largest face if multiple are detected
        if len(bboxes) > 0:
            # bbox is [L, T, W, H, score]
            largest_face = max(bboxes, key=lambda b: b[2] * b[3])
            L, T, W, H, score = largest_face
            
            if score > 0.6:
                # Draw the face bounding box (Green)
                cv2.rectangle(image, (L, T), (L+W, T+H), (0, 255, 0), 2)
                
                # 3. Crop the face for Attribute Detection
                face_crop_pil = pil_img.crop((L, T, L+W, T+H))
                
                # 4. Run Attribute Detection
                try:
                    # Preprocess for the raw model: resize to 128x128, norm [0, 1]
                    face_resized = face_crop_pil.resize((128, 128))
                    face_np = np.array(face_resized).astype(np.float32) / 255.0
                    # HWC -> CHW, add batch dimension
                    face_tensor = torch.tensor(face_np).permute(2, 0, 1).unsqueeze(0).float()
                    
                    # Run raw inference
                    with torch.no_grad():
                        probs = model_attr(face_tensor)[0] # Shape [5]
                    
                    left_eye_open = probs[0].item()
                    right_eye_open = probs[1].item()
                    sunglasses = probs[4].item()
                    
                    # Display probabilities
                    cv2.putText(image, f"Left Open: {left_eye_open:.2f}", (L, max(0, T - 30)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                    cv2.putText(image, f"Right Open: {right_eye_open:.2f}", (L, max(0, T - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                    
                    # If wearing sunglasses, we can't reliably detect eyes, so skip sleep check
                    if sunglasses > 0.5:
                        is_sunglasses = True
                        cv2.putText(image, "SUNGLASSES DETECTED", (L, T + int(H/2)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
                    else:
                        # Sleep Logic: If BOTH eyes are mostly closed (< 0.3 openness)
                        if left_eye_open < 0.3 and right_eye_open < 0.3:
                            eyes_closed_frames += 1
                        else:
                            eyes_closed_frames = 0
                            
                except Exception as e:
                    print(f"Attr detect error: {e}")

        # If eyes are closed for ~10 frames (~0.5 seconds depending on fps), trigger sleep alert
        if eyes_closed_frames > 10:
            is_sleeping = True
            cv2.putText(image, '!!! DRIVER SLEEPING !!!', (20, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)

        # Calculate FPS
        cTime = time.time()
        fps = 1 / (cTime - pTime) if (cTime - pTime) > 0 else 0
        pTime = cTime
        
        # Flip image for selfie view
        flipped_image = cv2.flip(image, 1)
        
        # Overlay warnings and API triggers
        if is_sleeping:
            cv2.rectangle(flipped_image, (0, 0), (640, 480), (0, 0, 255), 10)
            
            # Send alert to the Cloud Backend (Debounced to every 5 seconds)
            if time.time() - last_alert_time > 5.0:
                print("[ALERT] Driver sleeping! Sending alert to cloud backend...")
                def send_alert():
                    try:
                        payload = json.dumps({
                            "event": "drowsiness_detected",
                            "driverStatus": "DROWSY",
                            "confidence": 0.99,
                            "riskLevel": "HIGH",
                            "timestamp": int(time.time() * 1000)
                        }).encode('utf-8')
                        req = urllib.request.Request("https://ev-guardian.onrender.com/api/alert", data=payload, headers={'Content-Type': 'application/json'})
                        urllib.request.urlopen(req)
                    except Exception as e:
                        print(f"[ERROR] Failed to send cloud alert: {e}")
                
                # Run in background thread to avoid lagging the video feed
                threading.Thread(target=send_alert).start()
                last_alert_time = time.time()
        
        # Overlay UI text
        cv2.putText(flipped_image, f'FPS: {int(fps)}', (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(flipped_image, "Press 'Q' to Exit", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        if is_sunglasses:
             cv2.putText(flipped_image, "Eye Tracking Paused (Sunglasses)", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
        else:
             cv2.putText(flipped_image, "Qualcomm Edge AI Active", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        cv2.imshow('Driver Monitor - Qualcomm', flipped_image)
        
        # Press 'q' or 'ESC' to quit (ensure window is clicked first)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            print("[INFO] Quit key detected. Terminating...")
            break

    # Release camera and forcefully flush the OpenCV event loop
    cap.release()
    cv2.destroyAllWindows()
    for _ in range(5):
        cv2.waitKey(1)
        
    print("[INFO] Shutdown complete.")
    os._exit(0)

if __name__ == '__main__':
    main()
