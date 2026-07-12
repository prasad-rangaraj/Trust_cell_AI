import os
import time

try:
    import qai_hub as hub
except ImportError:
    print("Please install qai-hub first: pip install qai-hub")
    exit(1)

def main():
    print("=====================================================")
    print("🔋 EV Guardian - Qualcomm AI Workbench Integration")
    print("=====================================================")
    
    print("[INFO] Authenticating with Qualcomm AI Hub API Token...")
    os.environ["QAI_HUB_API_TOKEN"] = "vkohelxo2g8rtzjo2tc2b6nlhbion5xty8zpltgl"
    
    model_path = "models/battery_fault_classifier.onnx"
    
    if not os.path.exists(model_path):
        print(f"[ERROR] Could not find {model_path}. Run this from the integrated_bms_engine folder.")
        return

    print(f"[INFO] Uploading ONNX Model to cloud: {model_path}")
    model = hub.upload_model(model_path)
    print(f"[SUCCESS] Model uploaded: {model.model_id}")
    
    # Target Snapdragon hardware
    target_device = hub.Device("Snapdragon X Elite CRD")
    
    print(f"[INFO] Submitting compilation job for {target_device.name}...")
    compile_job = hub.submit_compile_job(
        model=model,
        device=target_device,
        name="EV Guardian - BMS Fault Classifier Compilation"
    )
    
    print(f"\n✅ Compile Job Submitted Successfully!")
    print(f"🔗 View Job Status on AI Hub: {compile_job.url}")
    print("\n[INFO] You can wait for compilation to finish, or press Ctrl+C to exit and check the URL.")
    
    target_model = compile_job.get_target_model()
    
    print(f"[INFO] Compilation complete! Submitting Profile Job for {target_device.name}...")
    profile_job = hub.submit_profile_job(
        model=target_model,
        device=target_device,
        name="EV Guardian - BMS Fault Classifier Profiling"
    )
    
    print(f"\n✅ Profile Job Submitted Successfully!")
    print(f"🔗 View Profile Status on AI Hub: {profile_job.url}")
    
    profile_data = profile_job.download_profile()
    print("\n=====================================================")
    print("🚀 AI Workbench Profiling Complete!")
    print("=====================================================")

if __name__ == "__main__":
    main()
