package com.think360.bms.data.sarvam

import android.content.Context
import android.media.MediaPlayer
import android.util.Base64
import android.util.Log
import com.google.gson.Gson
import com.think360.bms.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

private const val TAG = "SarvamTTSManager"
private const val TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech"

class SarvamTTSManager(
    private val context: Context,
    private val scope: CoroutineScope
) {
    private val client = OkHttpClient()
    private val gson = Gson()
    private var mediaPlayer: MediaPlayer? = null
    private var isPlaying = false
    private var onSpeechCompletedListener: (() -> Unit)? = null
    
    // For logging latency metrics during demonstrations
    private var lastTtsLatencyMs: Long = 0

    fun setOnSpeechCompletedListener(listener: () -> Unit) {
        onSpeechCompletedListener = listener
    }

    fun getLatencyMs(): Long = lastTtsLatencyMs

    fun speak(text: String, language: String) {
        if (isPlaying) {
            stop()
        }
        isPlaying = true

        scope.launch(Dispatchers.IO) {
            val startTime = System.currentTimeMillis()
            try {
                Log.d(TAG, "Initiating Bulbul v3 Cloud TTS request for lang: $language")
                
                val payload = mapOf(
                    "text" to text,
                    "speaker" to "priya", // Tier-1 excellent natural female voice for bulbul:v3
                    "target_language_code" to language,
                    "pace" to 1.0,
                    "speech_sample_rate" to 24000,
                    "output_audio_codec" to "wav",
                    "model" to "bulbul:v3"
                )

                val jsonBody = gson.toJson(payload)
                val requestBody = jsonBody.toRequestBody("application/json".toMediaTypeOrNull())

                // Safely grab the BuildConfig key (will contain YOUR_SARVAM_API_KEY placeholder or real key)
                val apiKey = BuildConfig.SARVAM_API_KEY

                // Temporary debug logs for key configuration audits
                Log.i(TAG, "[DEBUG] API Key is empty: ${apiKey.isEmpty()}")
                Log.i(TAG, "[DEBUG] API Key length: ${apiKey.length}")
                Log.i(TAG, "[DEBUG] Calling Endpoint: $TTS_ENDPOINT")
                Log.i(TAG, "[DEBUG] Request Body: $jsonBody")

                val request = Request.Builder()
                    .url(TTS_ENDPOINT)
                    .post(requestBody)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("api-subscription-key", apiKey)
                    .build()

                client.newCall(request).execute().use { response ->
                    val latency = System.currentTimeMillis() - startTime
                    lastTtsLatencyMs = latency

                    val responseCode = response.code
                    val responseBody = response.body?.string() ?: ""
                    
                    Log.i(TAG, "[DEBUG] HTTP Response Code: $responseCode")
                    Log.i(TAG, "[DEBUG] Full Response Body: $responseBody")

                    if (!response.isSuccessful) {
                        Log.e(TAG, "Bulbul v3 API error (HTTP $responseCode). Latency: $latency ms\n$responseBody")
                        withContext(Dispatchers.Main) {
                            isPlaying = false
                        }
                        return@launch
                    }

                    Log.i(TAG, "Bulbul v3 request succeeded. Latency: $latency ms")

                    val responseJson = gson.fromJson(responseBody, TTSResponse::class.java)
                    val base64Audio = responseJson.audios?.firstOrNull()

                    if (base64Audio.isNullOrEmpty()) {
                        Log.e(TAG, "Received empty audio payload from Bulbul API")
                        withContext(Dispatchers.Main) {
                            isPlaying = false
                        }
                        return@launch
                    }

                    // Decode base64 bytes to a temporary wav file
                    val audioBytes = Base64.decode(base64Audio, Base64.DEFAULT)
                    val tempFile = File(context.cacheDir, "temp_warning.wav")
                    FileOutputStream(tempFile).use { fos ->
                        fos.write(audioBytes)
                    }

                    // Verify that MediaPlayer is receiving a valid WAV file
                    Log.i(TAG, "[DEBUG] Decoded byte size: ${audioBytes.size}")
                    Log.i(TAG, "[DEBUG] Cache file path: ${tempFile.absolutePath}")
                    Log.i(TAG, "[DEBUG] Cache file size: ${tempFile.length()} bytes")

                    withContext(Dispatchers.Main) {
                        if (isPlaying) {
                            playAudioFile(tempFile)
                        }
                    }
                }
            } catch (e: Exception) {
                lastTtsLatencyMs = System.currentTimeMillis() - startTime
                Log.e(TAG, "TTS request failed: ${e.message}. Latency: $lastTtsLatencyMs ms", e)
                withContext(Dispatchers.Main) {
                    isPlaying = false
                }
            }
        }
    }

    private fun playAudioFile(file: File) {
        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(file.absolutePath)
                
                // Route audio through the main media speaker with speech attributes
                setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )

                // Elevate system STREAM_MUSIC stream volume to maximum
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
                try {
                    val maxVolume = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC)
                    audioManager.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, maxVolume, 0)
                } catch (volEx: Exception) {
                    Log.w(TAG, "Failed to elevate stream volume: ${volEx.message}")
                }

                prepare()
                setOnCompletionListener {
                    Log.d(TAG, "Audio playback completed")
                    this@SarvamTTSManager.isPlaying = false
                    onSpeechCompletedListener?.invoke()
                }
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "MediaPlayer failed: ${e.message}", e)
            isPlaying = false
        }
    }


    fun stop() {
        isPlaying = false
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping MediaPlayer: ${e.message}")
        }
    }

    private data class TTSResponse(
        val audios: List<String>?
    )
}
