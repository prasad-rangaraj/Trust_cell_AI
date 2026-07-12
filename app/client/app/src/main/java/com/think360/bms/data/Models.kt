package com.think360.bms.data

/**
 * BatteryState — canonical model for live telemetry pushed by the Python backend.
 * Matches the fields emitted by server/simulator.py via Socket.io "battery_update" event.
 */
data class BatteryState(
    val cell1: Float          = 0f,
    val cell2: Float          = 0f,
    val cell3: Float          = 0f,
    val cell4: Float          = 0f,
    val current: Float        = 0f,
    val temp1: Float          = 25.0f,
    val temp2: Float          = 25.0f,
    val gas: Float            = 120f,
    val anomalyScore: Float   = 4f,
    val batteryHealth: Float  = 96f,
    val soc: Float            = 94.5f,
    val soh: Float            = 98.2f,
    val status: String        = "Healthy",       // "Healthy" | "Warning" | "Critical"
    val mlOp: String          = "NORMAL",
    val relay: String         = "CONNECTED",
    val chargeStatus: String  = "Idle",
    val vibration: Float      = 0.5f,
    val spn: Int              = 0,
    val fmi: Int              = 0,
    val relayIsolation: String = "CONNECTED",
    val relayCooling: String   = "CONNECTED",
    val relayCell1: String     = "CONNECTED",
    val relayCell2: String     = "CONNECTED",
    val relayCell3: String     = "CONNECTED",
    val relayCell4: String     = "CONNECTED",
)

/** One entry in the AI/inference result from ONNX */
data class OnnxResult(
    val label: String,
    val confidence: Float,
)

/** A single chat message in the AI chat screen */
data class ChatMessage(
    val role: String,   // "user" | "assistant"
    val content: String,
)
