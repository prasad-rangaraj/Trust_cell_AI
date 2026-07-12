package com.think360.bms.data.sarvam

import android.content.Context
import android.util.Log
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private const val TAG = "VoiceAlertController"

class VoiceAlertController(
    private val context: Context,
    private val scope: CoroutineScope,
    private val receiver: BluetoothAlertReceiver,
    private val sarvamEdgeManager: SarvamEdgeManager
) {
    private val evaluator = DriverResponseEvaluator()

    private val _config = MutableStateFlow(VoiceAlertConfig())
    val config: StateFlow<VoiceAlertConfig> = _config.asStateFlow()

    private val _currentState = MutableStateFlow(VoiceAlertState.IDLE)
    val currentState: StateFlow<VoiceAlertState> = _currentState.asStateFlow()

    private val _activeAlert = MutableStateFlow<AlertEvent?>(null)
    val activeAlert: StateFlow<AlertEvent?> = _activeAlert.asStateFlow()

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    private val _isListening = MutableStateFlow(false)
    val isListening: StateFlow<Boolean> = _isListening.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // Holds the continuous status updates from the Snapdragon (e.g. "NORMAL" vs "DROWSY")
    private val _currentDriverStatus = MutableStateFlow("NORMAL")
    val currentDriverStatus: StateFlow<String> = _currentDriverStatus.asStateFlow()

    private var alertJob: Job? = null

    init {
        // Observe Bluetooth alerts
        scope.launch {
            receiver.alertEvents.collect { alert ->
                Log.d(TAG, "Alert event received from receiver: $alert")
                onAlertReceived(alert)
            }
        }

        // Setup speech completion listener from Sarvam TTS Manager
        sarvamEdgeManager.ttsManager.setOnSpeechCompletedListener {
            scope.launch(Dispatchers.Main) {
                _isSpeaking.value = false
                Log.d(TAG, "TTS Completed. State: ${_currentState.value}")
                if (_currentState.value == VoiceAlertState.SPEAKING) {
                    if (_config.value.enableVoiceReply) {
                        startListeningLoop()
                    } else {
                        startRepeatIntervalTimer()
                    }
                }
            }
        }

        // Setup speech recognized listener from Sarvam STT Manager
        sarvamEdgeManager.sttManager.setOnSpeechRecognizedListener { transcript ->
            scope.launch(Dispatchers.Main) {
                _isListening.value = false
                Log.d(TAG, "STT transcript: \"$transcript\". State: ${_currentState.value}")
                if (_currentState.value == VoiceAlertState.LISTENING) {
                    processVoiceResponse(transcript)
                }
            }
        }

        // Observe SDK status to enter ERROR state if unavailable while active
        scope.launch {
            sarvamEdgeManager.isSdkAvailable.collect { available ->
                if (!available && _currentState.value != VoiceAlertState.IDLE && _currentState.value != VoiceAlertState.DISMISSED) {
                    _currentState.value = VoiceAlertState.ERROR
                    _errorMessage.value = "Sarvam Edge SDK is Unavailable"
                }
            }
        }
    }

    /**
     * Updates the continuous driver status from Snapdragon X Elite.
     * When status changes back to NORMAL, it terminates warnings automatically.
     */
    fun updateDriverStatus(status: String) {
        _currentDriverStatus.value = status
        Log.d(TAG, "Driver status synchronized to: $status")
        if (status == "NORMAL" && _currentState.value != VoiceAlertState.IDLE && _currentState.value != VoiceAlertState.DISMISSED) {
            Log.d(TAG, "Driver status is now NORMAL. Automatically dismissing warnings.")
            dismissAlert()
        }
    }

    /**
     * Called when a discrete Drowsiness Alert triggers.
     */
    fun onAlertReceived(alert: AlertEvent) {
        scope.launch(Dispatchers.Main) {
            if (_currentState.value != VoiceAlertState.IDLE && _currentState.value != VoiceAlertState.DISMISSED) {
                Log.d(TAG, "An alert is already active. Ignoring new trigger event.")
                return@launch
            }

            // Sync status to DROWSY on alert
            _currentDriverStatus.value = alert.driverStatus
            showNotificationAlert(alert)

            if (!sarvamEdgeManager.isSdkAvailable.value) {
                Log.e(TAG, "Cannot trigger alert loop: Sarvam API Client key has not been configured")
                _currentState.value = VoiceAlertState.ERROR
                _errorMessage.value = "Sarvam SDK Key Not Configured"
                _activeAlert.value = alert
                return@launch
            }

            Log.d(TAG, "Starting driver drowsiness warning loop.")
            _errorMessage.value = null
            _activeAlert.value = alert
            _currentState.value = VoiceAlertState.RECEIVED_ALERT
            
            triggerSpeechWarning()
        }
    }

    private fun triggerSpeechWarning() {
        alertJob?.cancel()
        alertJob = scope.launch(Dispatchers.Main) {
            _currentState.value = VoiceAlertState.SPEAKING
            
            val originalText = "Warning. Driver fatigue detected. Please stop the vehicle safely."
            Log.d(TAG, "Translating text: \"$originalText\" to target lang: ${_config.value.language}")
            
            // Chain Mayura Translation v1 API call
            sarvamEdgeManager.translationManager.translate(
                originalText,
                _config.value.language
            ) { translatedText ->
                // Chain Bulbul TTS v3 API call with translated output text
                scope.launch(Dispatchers.Main) {
                    _isSpeaking.value = true
                    Log.d(TAG, "Speaking translated text: \"$translatedText\" in lang: ${_config.value.language}")
                    sarvamEdgeManager.ttsManager.speak(translatedText, _config.value.language)
                }
            }
        }
    }

    private fun startListeningLoop() {
        _currentState.value = VoiceAlertState.LISTENING
        _isListening.value = true
        sarvamEdgeManager.sttManager.startListening(_config.value.language)

        // Hands-free automation: Stop recording after 5 seconds of silence/speech input
        scope.launch(Dispatchers.Main) {
            delay(5000)
            if (_currentState.value == VoiceAlertState.LISTENING) {
                Log.d(TAG, "5-second voice capture window elapsed. Automatically transcribing driver response.")
                _isListening.value = false
                sarvamEdgeManager.sttManager.stopListening(_config.value.language)
            }
        }
    }

    fun finishListeningManual() {
        if (_currentState.value == VoiceAlertState.LISTENING) {
            sarvamEdgeManager.sttManager.stopListening(_config.value.language)
        }
    }

    private fun processVoiceResponse(transcript: String) {
        _currentState.value = VoiceAlertState.PROCESSING_RESPONSE
        val evaluation = evaluator.evaluate(transcript)

        scope.launch(Dispatchers.Main) {
            if (evaluation == DriverResponseEvaluator.EvaluationResult.OKAY) {
                Log.d(TAG, "User response is OKAY. Transitioning driver status to NORMAL.")
                updateDriverStatus("NORMAL")
            } else {
                Log.d(TAG, "User response unrecognized or negative. Repeating warning.")
                startRepeatIntervalTimer()
            }
        }
    }

    private fun startRepeatIntervalTimer() {
        alertJob?.cancel()
        alertJob = scope.launch(Dispatchers.Main) {
            _currentState.value = VoiceAlertState.REPEATING_ALERT
            delay(_config.value.repeatIntervalMs)
            
            // Check status again before repeating
            if (_currentDriverStatus.value == "DROWSY") {
                Log.d(TAG, "Interval elapsed and driver still drowsy. Repeating.")
                triggerSpeechWarning()
            } else {
                Log.d(TAG, "Interval elapsed but driver returned to NORMAL. Dismissing.")
                dismissAlert()
            }
        }
    }

    fun dismissAlert() {
        alertJob?.cancel()
        _currentState.value = VoiceAlertState.DISMISSED
        sarvamEdgeManager.ttsManager.stop()
        sarvamEdgeManager.sttManager.stopListening(_config.value.language)
        _isSpeaking.value = false
        _isListening.value = false
        scope.launch(Dispatchers.Main) {
            delay(1000)
            _currentState.value = VoiceAlertState.IDLE
            _activeAlert.value = null
        }
        Log.d(TAG, "Warning Alert overlay dismissed successfully.")
    }

    fun repeatAlertManual() {
        triggerSpeechWarning()
    }

    fun updateConfig(newConfig: VoiceAlertConfig) {
        _config.value = newConfig
        Log.d(TAG, "Config updated: $newConfig")
    }

    private fun showNotificationAlert(alert: AlertEvent) {
        val channelId = "ev_guardian_drowsiness_alerts"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "EV Guardian Drowsiness Warnings",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Emergency driver safety alerts"
                enableLights(true)
                enableVibration(true)
            }
            manager.createNotificationChannel(channel)
        }

        val intent = Intent(context, com.think360.bms.MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setContentTitle("⚠️ DRIVER FATIGUE DETECTED")
            .setContentText("Status: ${alert.driverStatus} (${(alert.confidence * 100).toInt()}% confidence)")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        manager.notify(2002, notification)
    }
}
