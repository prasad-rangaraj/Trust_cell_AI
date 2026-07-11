package com.think360.bms.data.sarvam

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

private const val TAG = "SarvamTranslationManager"
private const val TRANSLATE_ENDPOINT = "https://api.sarvam.ai/translate"

class SarvamTranslationManager(
    private val scope: CoroutineScope
) {
    private val client = OkHttpClient()
    private val gson = Gson()
    
    // For logging latency metrics during demonstrations
    private var lastTranslateLatencyMs: Long = 0

    fun getLatencyMs(): Long = lastTranslateLatencyMs

    fun translate(
        text: String,
        targetLanguage: String,
        onResult: (String) -> Unit
    ) {
        // If target is English, skip network translation call to optimize credits/speed
        if (targetLanguage.startsWith("en")) {
            Log.d(TAG, "Target language is English. Skipping translation API call.")
            onResult(text)
            return
        }

        scope.launch(Dispatchers.IO) {
            val startTime = System.currentTimeMillis()
            try {
                Log.d(TAG, "Initiating Mayura v1 Cloud Translation request to target: $targetLanguage")

                val payload = mapOf(
                    "input" to text,
                    "source_language_code" to "en-IN",
                    "target_language_code" to targetLanguage,
                    "model" to "mayura:v1"
                )

                val jsonBody = gson.toJson(payload)
                val requestBody = jsonBody.toRequestBody("application/json".toMediaTypeOrNull())

                val apiKey = BuildConfig.SARVAM_API_KEY

                val request = Request.Builder()
                    .url(TRANSLATE_ENDPOINT)
                    .post(requestBody)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("api-subscription-key", apiKey)
                    .build()

                client.newCall(request).execute().use { response ->
                    val latency = System.currentTimeMillis() - startTime
                    lastTranslateLatencyMs = latency

                    if (!response.isSuccessful) {
                        Log.e(TAG, "Mayura v1 API error (HTTP ${response.code}). Latency: $latency ms")
                        withContext(Dispatchers.Main) {
                            onResult(text) // Fallback to original text on failure
                        }
                        return@launch
                    }

                    val responseBody = response.body?.string() ?: ""
                    Log.i(TAG, "Mayura v1 request succeeded. Latency: $latency ms")

                    val responseJson = gson.fromJson(responseBody, TranslationResponse::class.java)
                    val translatedText = responseJson.translated_text ?: text

                    withContext(Dispatchers.Main) {
                        onResult(translatedText)
                    }
                }
            } catch (e: Exception) {
                lastTranslateLatencyMs = System.currentTimeMillis() - startTime
                Log.e(TAG, "Translation request failed: ${e.message}. Latency: $lastTranslateLatencyMs ms", e)
                withContext(Dispatchers.Main) {
                    onResult(text) // Fallback to original text on failure
                }
            }
        }
    }

    private data class TranslationResponse(
        val request_id: String?,
        val translated_text: String?,
        val source_language_code: String?
    )
}
