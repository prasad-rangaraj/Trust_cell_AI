package com.think360.bms.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Hearing
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.think360.bms.data.sarvam.SarvamEdgeManager
import com.think360.bms.data.sarvam.VoiceAlertController
import com.think360.bms.data.sarvam.VoiceAlertState
import com.think360.bms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlertOverlay(
    controller: VoiceAlertController,
    sarvamEdgeManager: SarvamEdgeManager,
    onSimulateDriverVoice: (String) -> Unit
) {
    val state by controller.currentState.collectAsState()
    val activeAlert by controller.activeAlert.collectAsState()
    val isSpeaking by controller.isSpeaking.collectAsState()
    val isListening by controller.isListening.collectAsState()
    val errorMessage by controller.errorMessage.collectAsState()
    val driverStatus by controller.currentDriverStatus.collectAsState()
    val config by controller.config.collectAsState()

    if (state == VoiceAlertState.IDLE || state == VoiceAlertState.DISMISSED) {
        return
    }

    Dialog(
        onDismissRequest = { /* Force action / no outside dismiss */ },
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xE60F172A)) // Semi-transparent dark slate backdrop
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(28.dp))
                    .background(ColorSurface)
                    .border(2.dp, if (state == VoiceAlertState.ERROR) ColorRed else ColorAmber, RoundedCornerShape(28.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ── Warning Header ──
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = ColorRed,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "DRIVER FATIGUE DETECTED",
                        color = ColorRed,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = ColorBorder)
                Spacer(modifier = Modifier.height(16.dp))

                // ── Telemetry Details ──
                activeAlert?.let { alert ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ColorBg),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Risk Status:", color = ColorText3, fontSize = 14.sp)
                                Text(
                                    alert.riskLevel,
                                    color = ColorRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Detection Confidence:", color = ColorText3, fontSize = 14.sp)
                                Text(
                                    "${(alert.confidence * 100).toInt()}%",
                                    color = ColorText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Driver Physical Status:", color = ColorText3, fontSize = 14.sp)
                                Text(
                                    driverStatus,
                                    color = if (driverStatus == "NORMAL") ColorGreen else ColorRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── API Latency Metrics Log ──
                Card(
                    colors = CardDefaults.cardColors(containerColor = ColorSurface2),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            "Sarvam AI Latency Metrics",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = ColorPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Mayura Translation v1:", fontSize = 12.sp, color = ColorText3)
                            Text("${sarvamEdgeManager.translationManager.getLatencyMs()} ms", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorText)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Bulbul Speech Synthesis v3:", fontSize = 12.sp, color = ColorText3)
                            Text("${sarvamEdgeManager.ttsManager.getLatencyMs()} ms", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorText)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Saaras Transcription v3:", fontSize = 12.sp, color = ColorText3)
                            Text("${sarvamEdgeManager.sttManager.getLatencyMs()} ms", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorText)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ── SDK State / Action Banner ──
                Text(
                    text = "Current State: $state",
                    color = ColorText3,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .background(ColorBg, RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (state == VoiceAlertState.ERROR) {
                    // SDK Unavailable Message
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(ColorRedBg)
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = errorMessage ?: "Sarvam Edge SDK Unavailable",
                            color = ColorRed,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            fontSize = 15.sp
                        )
                    }
                } else {
                    // ── Active Sarvam Animation Box ──
                    Box(
                        modifier = Modifier
                            .size(130.dp)
                            .clip(CircleShape)
                            .background(ColorBg),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSpeaking) {
                            // Speaker Waves Animation
                            val infiniteTransition = rememberInfiniteTransition()
                            val scale1 by infiniteTransition.animateFloat(
                                initialValue = 1f,
                                targetValue = 1.4f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(1000, easing = LinearEasing),
                                    repeatMode = RepeatMode.Reverse
                                )
                            )
                            val scale2 by infiniteTransition.animateFloat(
                                initialValue = 1f,
                                targetValue = 1.6f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(1200, easing = LinearEasing),
                                    repeatMode = RepeatMode.Reverse
                                )
                            )
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .scale(scale2)
                                    .background(ColorPrimaryBg, CircleShape)
                            )
                            Box(
                                modifier = Modifier
                                    .size(75.dp)
                                    .scale(scale1)
                                    .background(ColorPrimaryBg, CircleShape)
                            )
                            Box(
                                modifier = Modifier
                                    .size(55.dp)
                                    .background(ColorPrimary, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.VolumeUp, contentDescription = "Speaking", tint = Color.White, modifier = Modifier.size(24.dp))
                            }
                        } else if (isListening) {
                            // Mic Pulsing Animation
                            val infiniteTransition = rememberInfiniteTransition()
                            val scale by infiniteTransition.animateFloat(
                                initialValue = 1f,
                                targetValue = 1.5f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(800, easing = FastOutSlowInEasing),
                                    repeatMode = RepeatMode.Reverse
                                )
                            )
                            Box(
                                modifier = Modifier
                                    .size(85.dp)
                                    .scale(scale)
                                    .background(ColorPurpleBg, CircleShape)
                            )
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .background(ColorPurple, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Mic, contentDescription = "Listening", tint = Color.White, modifier = Modifier.size(24.dp))
                            }
                        } else {
                            Icon(
                                imageVector = Icons.Default.Hearing,
                                contentDescription = "Waiting",
                                tint = ColorText4,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    val helperText = when (state) {
                        VoiceAlertState.SPEAKING -> "Speaking multilingual alert (Bulbul v3)..."
                        VoiceAlertState.LISTENING -> "Listening to driver response (Saaras v3)..."
                        VoiceAlertState.PROCESSING_RESPONSE -> "Analyzing response..."
                        VoiceAlertState.REPEATING_ALERT -> "Drowsiness continues. Repeating alert soon."
                        else -> "Initializing alert..."
                    }
                    Text(
                        text = helperText,
                        color = ColorText2,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ── Listening Stop & presets ──
                if (isListening && state == VoiceAlertState.LISTENING) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(ColorBg, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Button(
                            onClick = { controller.finishListeningManual() },
                            colors = ButtonDefaults.buttonColors(containerColor = ColorPurple),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Stop & Transcribe Spoken Voice", fontSize = 12.sp)
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Or Mock Responses (for Simulator testing):",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = ColorText3
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Button(
                                onClick = { onSimulateDriverVoice("I'm okay") },
                                colors = ButtonDefaults.buttonColors(containerColor = ColorGreen),
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(vertical = 4.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Speak \"I'm okay\"", fontSize = 10.sp)
                            }
                            Button(
                                onClick = { onSimulateDriverVoice("No response") },
                                colors = ButtonDefaults.buttonColors(containerColor = ColorRed),
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(vertical = 4.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Speak Unrelated", fontSize = 10.sp)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // ── Manual Control Buttons ──
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedButton(
                        onClick = { controller.dismissAlert() },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ColorText3),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 12.dp)
                    ) {
                        Text("Dismiss Alert", fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { controller.repeatAlertManual() },
                        colors = ButtonDefaults.buttonColors(containerColor = ColorRed),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 12.dp)
                    ) {
                        Text("Repeat Alert", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}
