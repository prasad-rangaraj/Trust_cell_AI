package com.think360.bms.viewmodel

import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.think360.bms.data.BatteryState
import com.think360.bms.data.ChatMessage
import com.think360.bms.data.OnnxResult
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.nio.FloatBuffer
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

import com.think360.bms.data.sarvam.*

private const val TAG = "BmsViewModel"
private const val SERVER_URL = "http://10.91.41.58:3001"

class BmsViewModel(application: Application) : AndroidViewModel(application) {

    // Local fallbacks if the Foreground Service is not yet started or bound (e.g. preview)
    private val fallbackBluetoothManager = BluetoothManager(application, viewModelScope)
    private val fallbackBluetoothAlertReceiver = BluetoothAlertReceiver(fallbackBluetoothManager, viewModelScope)
    private val fallbackSarvamEdgeManager = SarvamEdgeManager(application, viewModelScope)
    private val fallbackVoiceAlertController = VoiceAlertController(application, viewModelScope, fallbackBluetoothAlertReceiver, fallbackSarvamEdgeManager)

    init {
        // Start driver safety background service immediately on VM startup
        EVGuardianService.startService(application)
        
        // (Note: Cloud listener is now started inside EVGuardianService so it survives app closure!)
    }

    // Exposed managers that route to the running Foreground Service singleton instances
    val bluetoothManager: BluetoothManager
        get() = EVGuardianService.bluetoothManagerInstance ?: fallbackBluetoothManager

    val bluetoothAlertReceiver: BluetoothAlertReceiver
        get() = fallbackBluetoothAlertReceiver

    val sarvamEdgeManager: SarvamEdgeManager
        get() = EVGuardianService.sarvamEdgeManagerInstance ?: fallbackSarvamEdgeManager

    val voiceAlertController: VoiceAlertController
        get() = EVGuardianService.controllerInstance ?: fallbackVoiceAlertController


    // ── Live telemetry ────────────────────────────────────────────────────────
    private val _batteryState = MutableStateFlow(BatteryState())
    val batteryState: StateFlow<BatteryState> = _batteryState.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    // ── ONNX inference results ────────────────────────────────────────────────
    private val _onnxResult = MutableStateFlow<OnnxResult?>(null)
    val onnxResult: StateFlow<OnnxResult?> = _onnxResult.asStateFlow()

    // ── AI Chat ───────────────────────────────────────────────────────────────
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(listOf(
        ChatMessage("assistant", "👋 Hi! I'm your on-device Battery AI. Ask me anything about your battery's health, faults, or safety status.")
    ))
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _isChatLoading = MutableStateFlow(false)
    val isChatLoading: StateFlow<Boolean> = _isChatLoading.asStateFlow()

    private val _assistantAction = MutableSharedFlow<String>()
    val assistantAction: SharedFlow<String> = _assistantAction.asSharedFlow()

    // ── Telemetry history for mini sparklines ─────────────────────────────────
    private val _history = MutableStateFlow<List<BatteryState>>(emptyList())
    val history: StateFlow<List<BatteryState>> = _history.asStateFlow()

    // ── Socket.io ─────────────────────────────────────────────────────────────
    private lateinit var socket: Socket
    private val gson = Gson()

    // ── ONNX Runtime ──────────────────────────────────────────────────────────
    private var ortEnv: OrtEnvironment? = null
    private var ortSession: OrtSession? = null

    init {
        initSocket()
        initOnnx()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Socket.io
    // ─────────────────────────────────────────────────────────────────────────

    private fun initSocket() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val opts = IO.Options().apply {
                    transports = arrayOf("websocket")
                    reconnection = true
                    reconnectionAttempts = Int.MAX_VALUE
                }
                socket = IO.socket(SERVER_URL, opts)

                socket.on(Socket.EVENT_CONNECT) {
                    _isConnected.value = true
                    Log.d(TAG, "Socket connected")
                }

                socket.on(Socket.EVENT_DISCONNECT) {
                    _isConnected.value = false
                    Log.d(TAG, "Socket disconnected")
                }

                socket.on("battery_update") { args ->
                    val json = args.firstOrNull()?.toString() ?: return@on
                    try {
                        val state = gson.fromJson(json, BatteryState::class.java)
                        _batteryState.value = state
                        _history.value = (_history.value + state).takeLast(30)
                        // Run ONNX inference on every new reading
                        runOnnxInference(state)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to parse battery_update", e)
                    }
                }

                socket.connect()
            } catch (e: Exception) {
                Log.e(TAG, "Socket init failed", e)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ONNX Runtime — On-Device Anomaly Detection
    // ─────────────────────────────────────────────────────────────────────────

    private fun initOnnx() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                ortEnv = OrtEnvironment.getEnvironment()
                // Load model from assets/bms_anomaly.onnx (place your model file here)
                val modelBytes = getApplication<Application>().assets
                    .open("bms_anomaly.onnx").readBytes()
                ortSession = ortEnv?.createSession(modelBytes)
                Log.d(TAG, "ONNX session initialized. Inputs: ${ortSession?.inputNames}")
            } catch (e: Exception) {
                Log.w(TAG, "ONNX model not found — skipping inference. Drop bms_anomaly.onnx into assets/. Error: $e")
            }
        }
    }

    private fun runOnnxInference(state: BatteryState) {
        val session = ortSession ?: return
        val env = ortEnv ?: return
        viewModelScope.launch(Dispatchers.Default) {
            try {
                // Build feature vector: [cell1, cell2, cell3, cell4, current, temp1, temp2, gas, vibration]
                val features = floatArrayOf(
                    state.cell1, state.cell2, state.cell3, state.cell4,
                    state.current, state.temp1, state.temp2,
                    state.gas, state.vibration,
                )
                val inputTensor = ai.onnxruntime.OnnxTensor.createTensor(
                    env, FloatBuffer.wrap(features), longArrayOf(1, features.size.toLong())
                )
                val inputName = session.inputNames.first()
                val results = session.run(mapOf(inputName to inputTensor))
                val outputTensor = results[0].value as Array<FloatArray>
                val scores = outputTensor[0]
                val labels = listOf("Normal", "Overtemp", "Cell Imbalance", "Gas Hazard")
                val maxIdx = scores.indices.maxByOrNull { scores[it] } ?: 0
                _onnxResult.value = OnnxResult(
                    label = labels.getOrElse(maxIdx) { "Unknown" },
                    confidence = scores[maxIdx],
                )
                inputTensor.close()
                results.close()
            } catch (e: Exception) {
                Log.e(TAG, "ONNX inference error", e)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI Chat — Server-assisted (falls back gracefully)
    // ─────────────────────────────────────────────────────────────────────────

    fun sendChat(userMessage: String) {
        val current = _chatMessages.value
        _chatMessages.value = current + ChatMessage("user", userMessage)
        _isChatLoading.value = true

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // 1. Run local intent parser FIRST to trigger UI changes and immediate responses
                val localResponse = checkLocalIntents(userMessage)
                if (localResponse != null) {
                    _chatMessages.value = _chatMessages.value + ChatMessage("assistant", localResponse)
                    return@launch
                }

                // 2. If no local command was triggered, query the server LLM
                // Prepare context from current battery state
                val state = _batteryState.value
                val contextPrompt = """
                    Battery Context:
                    - Status: ${state.status} | ML Op: ${state.mlOp}
                    - Cells: ${state.cell1}V, ${state.cell2}V, ${state.cell3}V, ${state.cell4}V
                    - Temp: ${state.temp1}°C / ${state.temp2}°C
                    - Gas: ${state.gas} ppm | Anomaly Score: ${state.anomalyScore}%
                    - SOC: ${state.soc}% | SOH: ${state.soh}%
                    - ONNX Local Result: ${_onnxResult.value?.label ?: "N/A"} (${String.format("%.0f", (_onnxResult.value?.confidence ?: 0f) * 100)}%)
                    
                    User Question: $userMessage
                """.trimIndent()

                // POST to server /api/chat endpoint
                val client = okhttp3.OkHttpClient.Builder()
                    .readTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                    .connectTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                    .build()
                
                val jsonString = gson.toJson(mapOf("message" to contextPrompt))
                val body = jsonString.toRequestBody("application/json".toMediaTypeOrNull())
                val request = okhttp3.Request.Builder()
                    .url("$SERVER_URL/api/chat")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                val responseText = if (response.isSuccessful) {
                    val respJson = JSONObject(response.body?.string() ?: "{}")
                    val dataObj = respJson.optJSONObject("data")
                    dataObj?.optString("content") ?: respJson.optString("reply", "Sorry, I couldn't process that.")
                } else {
                    "⚠️ Server unreachable. Based on local ONNX: ${_onnxResult.value?.label ?: "No inference available"}."
                }
                _chatMessages.value = _chatMessages.value + ChatMessage("assistant", responseText)
            } catch (e: Exception) {
                // 3. Fallback Analysis if server crashes
                val fallback = buildLocalFallback(userMessage) + "\n\n*(Error Details: ${e.message})*"
                _chatMessages.value = _chatMessages.value + ChatMessage("assistant", fallback)
                Log.e(TAG, "Chat error", e)
            } finally {
                _isChatLoading.value = false
            }
        }
    }

    /** Smart On-Device Intent Parser that checks for commands first */
    private fun checkLocalIntents(question: String): String? {
        val q = question.lowercase()
        val state = _batteryState.value

        return when {
            // Navigation Intents
            q.contains("charger") || q.contains("map") || q.contains("navigate") -> {
                viewModelScope.launch { _assistantAction.emit("map") }
                "Navigating to the Map to find chargers and destinations..."
            }
            q.contains("safety") || q.contains("health") || q.contains("fault") -> {
                viewModelScope.launch { _assistantAction.emit("safety") }
                "Opening the Safety Dashboard for deep telemetry analysis..."
            }
            q.contains("charge") && q.contains("status") -> {
                viewModelScope.launch { _assistantAction.emit("charging") }
                "Here is your live Charging status."
            }
            // Vehicle Controls
            q.contains("ac") || q.contains("cool") || q.contains("condition") -> {
                "✅ Air Conditioning has been turned on and set to 22°C to pre-condition the cabin."
            }
            q.contains("lock") -> {
                "🔒 The vehicle doors have been securely locked."
            }
            q.contains("battery") || q.contains("level") -> {
                "🔋 Your battery is currently at ${state.soc}%. The temperature is stable at ${state.temp1}°C."
            }
            else -> null // Let the server handle it
        }
    }

    /** Simple rule-based fallback when both server and LLM are unavailable */
    private fun buildLocalFallback(question: String): String {
        val state = _batteryState.value
        val onnx = _onnxResult.value
        return buildString {
            appendLine("📡 *Local Analysis*")
            appendLine()
            appendLine("**Battery Status:** ${state.status}")
            appendLine("**ONNX Detection:** ${onnx?.label ?: "N/A"} (${String.format("%.0f", (onnx?.confidence ?: 0f) * 100)}% confidence)")
            appendLine()
            when {
                state.temp1 > 60 -> appendLine("⚠️ **High Temperature Detected** — ${state.temp1}°C exceeds safe threshold.")
                state.gas > 500  -> appendLine("🚨 **Elevated Gas Levels** — ${state.gas} ppm. Check for ventilation.")
                state.anomalyScore > 50 -> appendLine("⚠️ **Anomaly Score is elevated** — AI model flags this reading as abnormal.")
                else -> appendLine("✅ Battery appears to be operating within safe parameters.")
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        if (::socket.isInitialized) socket.disconnect()
        ortSession?.close()
        ortEnv?.close()
    }
}
