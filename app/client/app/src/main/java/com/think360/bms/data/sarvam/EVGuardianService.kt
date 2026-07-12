package com.think360.bms.data.sarvam

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.think360.bms.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

class EVGuardianService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    companion object {
        private const val TAG = "EVGuardianService"
        private const val CHANNEL_ID = "ev_guardian_safety_channel"
        private const val NOTIFICATION_ID = 1001

        @Volatile
        var controllerInstance: VoiceAlertController? = null
            private set

        @Volatile
        var bluetoothManagerInstance: BluetoothManager? = null
            private set

        @Volatile
        var sarvamEdgeManagerInstance: SarvamEdgeManager? = null
            private set

        fun startService(context: Context) {
            val intent = Intent(context, EVGuardianService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "EVGuardianService onCreate: Initializing managers")

        val sarvamEdgeManager = SarvamEdgeManager(applicationContext, serviceScope)
        sarvamEdgeManagerInstance = sarvamEdgeManager

        val bluetoothManager = BluetoothManager(applicationContext, serviceScope)
        bluetoothManagerInstance = bluetoothManager
        
        // Option 2: Keep the WebSocket alive inside the Foreground Service!
        val wssUrl = "wss://ev-guardian.onrender.com/ws/telemetry"
        bluetoothManager.startCloudListener(wssUrl)

        val bluetoothAlertReceiver = BluetoothAlertReceiver(bluetoothManager, serviceScope)
        
        val controller = VoiceAlertController(
            applicationContext,
            serviceScope,
            bluetoothAlertReceiver,
            sarvamEdgeManager
        )
        controllerInstance = controller


        createNotificationChannel()
        val notification = buildForegroundNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "EVGuardianService onStartCommand called")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "EVGuardianService onDestroy: cleaning up background jobs")
        serviceJob.cancel()
        controllerInstance = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EV Guardian Safety Assistant Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps driver safety co-pilot connection alive in the background."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EV Guardian Active")
            .setContentText("Monitoring driver drowsiness in the background...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
}
