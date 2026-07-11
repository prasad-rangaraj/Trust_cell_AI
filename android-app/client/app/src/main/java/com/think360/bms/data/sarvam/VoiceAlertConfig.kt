package com.think360.bms.data.sarvam

data class VoiceAlertConfig(
    val repeatIntervalMs: Long = 15000L,
    val maxRetries: Int = 3,
    val language: String = "en-IN",
    val enableVoiceReply: Boolean = true,
    val autoDismiss: Boolean = false
)
