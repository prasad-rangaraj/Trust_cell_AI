package com.think360.bms.data.sarvam

import android.content.Context
import android.media.MediaRecorder
import android.util.Log
import com.google.gson.Gson
import com.think360.bms.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

private const val TAG = "SarvamSTTManager"
private const val STT_ENDPOINT = "https://api.sarvam.ai/speech-to-text"

class SarvamSTTManager(
    private val context: Context,
    private val scope: CoroutineScope
) {
    private val client = OkHttpClient()
    private val gson = Gson()
    private var mediaRecorder: MediaRecorder? = null
    private var recordFile: File? = null
    private var isListening = false
    private var onSpeechRecognizedListener: ((String) -> Unit)? = null

    private val _transcriptions = MutableSharedFlow<String>()
    val transcriptions: SharedFlow<String> = _transcriptions.asSharedFlow()

    // For logging latency metrics during demonstrations
    private var lastSttLatencyMs: Long = 0

    fun setOnSpeechRecognizedListener(listener: (String) -> Unit) {
        onSpeechRecognizedListener = listener
    }

    fun getLatencyMs(): Long = lastSttLatencyMs

    fun startListening(language: String) {
        if (isListening) return
        isListening = true
        Log.d(TAG, "Sarvam Saaras STT recording started...")

        try {
            recordFile = File(context.cacheDir, "recorded_response.m4a")
            mediaRecorder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(recordFile?.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start MediaRecorder: ${e.message}", e)
            isListening = false
        }
    }

    fun stopListening(language: String) {
        if (!isListening) return
        isListening = false
        Log.d(TAG, "Sarvam Saaras STT stopping recording & uploading...")

        try {
            mediaRecorder?.stop()
            mediaRecorder?.release()
            mediaRecorder = null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop MediaRecorder: ${e.message}", e)
        }

        val fileToUpload = recordFile
        if (fileToUpload != null && fileToUpload.exists()) {
            uploadAudioFile(fileToUpload, language)
        } else {
            Log.e(TAG, "Record file does not exist")
        }
    }

    private fun uploadAudioFile(file: File, language: String) {
        scope.launch(Dispatchers.IO) {
            val startTime = System.currentTimeMillis()
            try {
                Log.d(TAG, "Uploading recorded audio of size: ${file.length()} bytes")

                val fileRequestBody = file.asRequestBody("audio/mpeg".toMediaTypeOrNull())
                val requestBody = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("file", "recorded_response.m4a", fileRequestBody)
                    .addFormDataPart("model", "saaras:v3")
                    .addFormDataPart("language_code", language)
                    .build()

                val apiKey = BuildConfig.SARVAM_API_KEY

                val request = Request.Builder()
                    .url(STT_ENDPOINT)
                    .post(requestBody)
                    .addHeader("api-subscription-key", apiKey)
                    .build()

                client.newCall(request).execute().use { response ->
                    val latency = System.currentTimeMillis() - startTime
                    lastSttLatencyMs = latency

                    if (!response.isSuccessful) {
                        Log.e(TAG, "Saaras v3 API error (HTTP ${response.code}). Latency: $latency ms")
                        withContext(Dispatchers.Main) {
                            onSpeechRecognizedListener?.invoke("")
                        }
                        return@launch
                    }

                    val responseBody = response.body?.string() ?: ""
                    Log.i(TAG, "Saaras v3 request succeeded. Latency: $latency ms")

                    val responseJson = gson.fromJson(responseBody, STTResponse::class.java)
                    val transcript = responseJson.transcript ?: ""

                    withContext(Dispatchers.Main) {
                        _transcriptions.emit(transcript)
                        onSpeechRecognizedListener?.invoke(transcript)
                    }
                }
            } catch (e: Exception) {
                lastSttLatencyMs = System.currentTimeMillis() - startTime
                Log.e(TAG, "STT request failed: ${e.message}. Latency: $lastSttLatencyMs ms", e)
                withContext(Dispatchers.Main) {
                    onSpeechRecognizedListener?.invoke("")
                }
            } finally {
                // Cleanup temp file
                if (file.exists()) {
                    file.delete()
                }
            }
        }
    }

    /**
     * Helper method to simulate a driver response when typing responses
     * on the settings panel for demonstration testing.
     */
    fun simulateDriverResponse(text: String) {
        scope.launch {
            Log.d(TAG, "Simulating speech recognition: \"$text\"")
            _transcriptions.emit(text)
            onSpeechRecognizedListener?.invoke(text)
        }
    }

    private data class STTResponse(
        val request_id: String?,
        val transcript: String?
    )
}
