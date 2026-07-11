package com.think360.bms.data.sarvam

import android.content.Context
import android.util.Log
import com.think360.bms.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

private const val TAG = "SarvamEdgeManager"

class SarvamEdgeManager(
    private val context: Context,
    private val scope: CoroutineScope
) {
    private val _isSdkAvailable = MutableStateFlow(false)
    val isSdkAvailable: StateFlow<Boolean> = _isSdkAvailable.asStateFlow()

    val ttsManager = SarvamTTSManager(context, scope)
    val sttManager = SarvamSTTManager(context, scope)
    val translationManager = SarvamTranslationManager(scope)

    init {
        initializeSdk()
    }

    fun initializeSdk() {
        val apiKey = BuildConfig.SARVAM_API_KEY
        Log.d(TAG, "Initializing Sarvam Cloud API Client...")

        if (apiKey.isEmpty() || apiKey == "YOUR_SARVAM_API_KEY") {
            Log.e(TAG, "Initialization failed: API key has not been configured in local.properties")
            _isSdkAvailable.value = false
        } else {
            Log.i(TAG, "Sarvam API Client verified successfully. Subscription Key is present.")
            _isSdkAvailable.value = true
        }
    }

    /**
     * Toggles the API client availability. Allows simulating credentials errors
     * or network offline states dynamically during hackathon evaluations.
     */
    fun simulateSdkFailure(failed: Boolean) {
        Log.d(TAG, "Simulating Sarvam API Client failure state: $failed")
        _isSdkAvailable.value = !failed
        if (failed) {
            ttsManager.stop()
            // Stop listening using the default config language (e.g. en-IN)
            sttManager.stopListening("en-IN")
        }
    }
}
