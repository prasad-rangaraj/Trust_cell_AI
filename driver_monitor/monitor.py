import cv2
import time
import os
import urllib.request
import ssl
import tempfile

def main():
    print("[INFO] Loading OpenCV Face & Eye Detectors...")
    
    # Bypass SSL for downloads
    ssl._create_default_https_context = ssl._create_unverified_context
    temp_dir = tempfile.gettempdir()
    
    # Download Face Cascade to a hidden temp folder
    face_cascade_path = os.path.join(temp_dir, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(face_cascade_path):
        print("[INFO] Downloading Face Haar cascade secretly in background...")
        url_face = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        urllib.request.urlretrieve(url_face, face_cascade_path)
        
    # Download Eye Cascade to a hidden temp folder
    eye_cascade_path = os.path.join(temp_dir, 'haarcascade_eye.xml')
    if not os.path.exists(eye_cascade_path):
        print("[INFO] Downloading Eye Haar cascade secretly in background...")
        url_eye = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_eye.xml"
        urllib.request.urlretrieve(url_eye, eye_cascade_path)
        
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    eye_cascade = cv2.CascadeClassifier(eye_cascade_path)

    print("[INFO] Starting webcam...")
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    pTime = 0
    print("[INFO] Camera active. Make sure to click the video window before pressing 'q' to quit.")
    
    eyes_closed_frames = 0
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            continue

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        is_sleeping = False

        # Draw rectangles around faces and search for eyes
        for (x, y, w, h) in faces:
            cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Region of Interest for the eyes (upper half of the face)
            roi_gray = gray[y:y+int(h/2), x:x+w]
            roi_color = image[y:y+int(h/2), x:x+w]
            
            # Detect eyes
            eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 3)
            
            if len(eyes) == 0:
                # No eyes detected (closed or looking away)
                eyes_closed_frames += 1
            else:
                # Eyes detected, reset counter
                eyes_closed_frames = 0
                for (ex, ey, ew, eh) in eyes:
                    cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)
            
            # If eyes are missing for ~10 frames, trigger sleep alert
            if eyes_closed_frames > 10:
                is_sleeping = True
                cv2.putText(image, '!!! DRIVER SLEEPING !!!', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
            else:
                cv2.putText(image, 'Awake', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Calculate FPS
        cTime = time.time()
        fps = 1 / (cTime - pTime) if (cTime - pTime) > 0 else 0
        pTime = cTime
        
        # Flip image for selfie view
        flipped_image = cv2.flip(image, 1)
        
        # If sleeping, add a massive warning to the screen
        if is_sleeping:
            cv2.rectangle(flipped_image, (0, 0), (640, 480), (0, 0, 255), 10)
        
        # Overlay UI text
        cv2.putText(flipped_image, f'FPS: {int(fps)}', (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(flipped_image, "Press 'Q' to Exit", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(flipped_image, "Eye Tracking Active", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
        
        cv2.imshow('Driver Monitor - Camera Test', flipped_image)
        
        # Press 'q' or 'ESC' to quit (ensure window is clicked first)
        key = cv2.waitKey(10) & 0xFF
        if key == ord('q') or key == 27:
            print("[INFO] Quit key detected. Terminating...")
            break

    # Release camera and forcefully flush the OpenCV event loop (Windows bug fix)
    cap.release()
    cv2.destroyAllWindows()
    for _ in range(5):
        cv2.waitKey(1)
        
    print("[INFO] Shutdown complete.")
    # Forcefully kill the python process to prevent hanging
    os._exit(0)

if __name__ == '__main__':
    main()
