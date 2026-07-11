package com.think360.bms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.think360.bms.data.sarvam.AlertEvent
import com.think360.bms.data.sarvam.EVGuardianService

class AlertSimulationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        Log.i("AlertSimulationReceiver", "Simulated alert intent received via adb")
        val controller = EVGuardianService.controllerInstance
        if (controller != null) {
            val mockEvent = AlertEvent(
                event = "drowsiness_detected",
                driverStatus = "DROWSY",
                confidence = 0.97f,
                riskLevel = "HIGH",
                timestamp = System.currentTimeMillis()
            )
            controller.onAlertReceived(mockEvent)
        } else {
            Log.w("AlertSimulationReceiver", "EVGuardianService controllerInstance is null. Starting service first.")
            context?.let { ctx ->
                EVGuardianService.startService(ctx)
                // Retry triggering after service starts up
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    EVGuardianService.controllerInstance?.onAlertReceived(
                        AlertEvent(
                            event = "drowsiness_detected",
                            driverStatus = "DROWSY",
                            confidence = 0.97f,
                            riskLevel = "HIGH",
                            timestamp = System.currentTimeMillis()
                        )
                    )
                }, 1000)
            }
        }
    }
}
