package com.think360.bms.data.sarvam

import android.util.Log

private const val TAG = "DriverResponseEvaluator"

class DriverResponseEvaluator {

    enum class EvaluationResult {
        OKAY,
        UNKNOWN
    }

    /**
     * Checks if the driver's response contains safety recovery keywords.
     */
    fun evaluate(speechText: String): EvaluationResult {
        val normalized = speechText.trim().lowercase()
        Log.d(TAG, "Evaluating driver response transcript: \"$speechText\"")

        val isOkay = normalized.contains("i'm okay") ||
                normalized.contains("i'm fine") ||
                normalized.contains("im okay") ||
                normalized.contains("im fine") ||
                normalized.contains("i am okay") ||
                normalized.contains("i am fine") ||
                normalized.contains("continue") ||
                normalized.contains("fine") ||
                normalized.contains("okay") ||
                normalized.contains("yes") ||
                normalized.contains("thank you") ||
                normalized.contains("thanks") ||
                normalized.contains("thank") ||
                normalized.contains("all good") ||
                normalized.contains("i'm good") ||
                normalized.contains("im good") ||
                normalized.contains("i am good") ||
                normalized.contains("i'm alert") ||
                normalized.contains("im alert") ||
                normalized.contains("i am alert") ||
                normalized.contains("no problem") ||
                normalized.contains("dismiss") ||
                normalized.contains("stop alert")

        return if (isOkay) {
            Log.d(TAG, "Result evaluated to: OKAY")
            EvaluationResult.OKAY
        } else {
            Log.w(TAG, "Result evaluated to: UNKNOWN (invalid or unclear response)")
            EvaluationResult.UNKNOWN
        }
    }
}
