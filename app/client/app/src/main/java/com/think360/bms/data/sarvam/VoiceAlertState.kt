package com.think360.bms.data.sarvam

enum class VoiceAlertState {
    IDLE,
    RECEIVED_ALERT,
    SPEAKING,
    LISTENING,
    PROCESSING_RESPONSE,
    REPEATING_ALERT,
    DISMISSED,
    ERROR
}
