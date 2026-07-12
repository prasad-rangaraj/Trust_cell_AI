package com.think360.bms.data.sarvam

data class AlertEvent(
    val event: String,
    val driverStatus: String,
    val confidence: Float,
    val riskLevel: String,
    val timestamp: Long
)
