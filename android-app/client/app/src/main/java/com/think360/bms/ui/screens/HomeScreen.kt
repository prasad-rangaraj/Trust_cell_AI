package com.think360.bms.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.unit.*
import androidx.compose.ui.res.painterResource
import com.think360.bms.R
import androidx.navigation.NavController
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel
import com.think360.bms.data.sarvam.*
import java.util.Calendar


@Composable
fun HomeScreen(viewModel: BmsViewModel, navController: NavController) {
    val batteryState by viewModel.batteryState.collectAsState()
    val isConnected by viewModel.isConnected.collectAsState()

    val soc = batteryState.soc.toInt().coerceIn(0, 100)
    val range = (soc * 4.2).toInt()
    val tempC = batteryState.temp1

    val isCharging = batteryState.current > 0.5f

    // ── Static Soft Dawn Blue Environment ─────────────────────────────────────
    val environmentGradient = Brush.verticalGradient(
        0.0f to Color(0xFF60A5FA),
        0.95f to Color(0xFFEFF6FF),
        1.0f to ColorBg
    )
    
    val heroTextColor = Color(0xFF0F172A)
    val heroSubTextColor = Color(0xFF475569)

    // ── Breathing Energy Aura Animation ───────────────────────────────────────
    val infiniteTransition = rememberInfiniteTransition(label = "aura")
    val auraScale by infiniteTransition.animateFloat(
        initialValue = if (isCharging) 1.5f else 0.8f,
        targetValue = if (isCharging) 0.8f else 1.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "auraScale"
    )
    val auraAlpha by infiniteTransition.animateFloat(
        initialValue = if (isCharging) 0f else 0.6f,
        targetValue = if (isCharging) 0.6f else 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "auraAlpha"
    )
    val auraColor = if (isCharging) ColorGreen else Color.White

    // ── Predictive Smart Action Logic ─────────────────────────────────────────
    val smartAction = when {
        soc < 20 && !isCharging -> SmartAction(
            title = "Battery is running low",
            subtitle = "Tap to navigate to the nearest fast charger (2.1 km away).",
            icon = Icons.Filled.ElectricBolt,
            color = ColorRed
        )
        isCharging -> SmartAction(
            title = "Charging quietly...",
            subtitle = "Will be ready for your commute by 4:00 AM.",
            icon = Icons.Filled.BatteryChargingFull,
            color = ColorGreen
        )
        tempC < 18f -> SmartAction(
            title = "Good morning! It's $tempC°C.",
            subtitle = "Tap here to pre-heat the cabin to 22°C before your drive.",
            icon = Icons.Filled.AcUnit,
            color = ColorPrimary
        )
        else -> SmartAction(
            title = "Ready for adventure",
            subtitle = "All systems checked and optimal. Tap to unlock.",
            icon = Icons.Filled.CheckCircle,
            color = ColorPrimary
        )
    }

    // ── Predictive "Where To?" Trip Logic ─────────────────────────────────────
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val predictedTrip = when {
        hour in 6..9 -> PredictedTrip("Work", "12 km", soc - 3)
        hour in 16..19 -> PredictedTrip("Home", "15 km", soc - 4)
        else -> PredictedTrip("Supermarket", "4 km", soc - 1)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
            .background(ColorBg)
            .verticalScroll(rememberScrollState())
    ) {
        // ── Top Canvas Area ───────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(380.dp)
                .background(environmentGradient)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 40.dp, bottom = 40.dp), // Leaves room for status bar
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Top connection status
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_launcher),
                            contentDescription = "EV Assistant Brand Logo",
                            modifier = Modifier.size(28.dp)
                        )
                        Text(
                            "EV Assistant",
                            color = heroTextColor, fontWeight = FontWeight.Black, fontSize = 20.sp
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    if (isConnected) ColorGreen else ColorText4,
                                    CircleShape
                                )
                        )
                        Text(
                            if (isConnected) "Live" else "Offline",
                            color = if (isConnected) ColorGreen else ColorText4,
                            fontSize = 12.sp, fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(Modifier.weight(1f))

                // Massive Typography Range + Energy Aura
                Box(contentAlignment = Alignment.Center) {
                    // Draw the aura circles behind the text
                    Canvas(modifier = Modifier.size(200.dp)) {
                        drawCircle(
                            color = auraColor.copy(alpha = auraAlpha),
                            radius = size.width / 2 * auraScale
                        )
                        // A secondary delayed circle for a ripple effect
                        drawCircle(
                            color = auraColor.copy(alpha = auraAlpha * 0.5f),
                            radius = size.width / 2 * ((auraScale + 0.3f) % 1.5f)
                        )
                    }
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            "$range",
                            color = heroTextColor, fontSize = 100.sp, fontWeight = FontWeight.Black,
                            letterSpacing = (-4).sp, lineHeight = 100.sp
                        )
                        Text(
                            "kilometers available",
                            color = heroSubTextColor, fontSize = 16.sp, fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }
                }
                
                Spacer(Modifier.height(24.dp))
                
                Box(
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text("$soc% State of Charge", color = heroTextColor, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }

                Spacer(Modifier.weight(1f))
            }
        }

        // ── Predictive Smart Action Card (Overlapping the canvas) ───────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .offset(y = (-30).dp)
        ) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ColorSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier.fillMaxWidth().clickable { }
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .background(smartAction.color.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(smartAction.icon, contentDescription = null, tint = smartAction.color, modifier = Modifier.size(28.dp))
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(smartAction.title, color = ColorText, fontWeight = FontWeight.Black, fontSize = 16.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(smartAction.subtitle, color = ColorText3, fontSize = 13.sp, lineHeight = 18.sp)
                    }
                }
            }
        }

        // ── Minimalist Quick Actions ────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 30.dp)
                .offset(y = (-10).dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            MinimalActionButton(Icons.Outlined.Lock, "Lock")
            MinimalActionButton(Icons.Outlined.AcUnit, "Climate")
            MinimalActionButton(Icons.Outlined.Lightbulb, "Lights")
            MinimalActionButton(Icons.Outlined.LocalMall, "Frunk")
        }

        Spacer(Modifier.height(20.dp))

        // ── Sarvam Edge Hackathon Control Panel ──────────────────────────────────
        val controller = viewModel.voiceAlertController
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = ColorPurple)
                    Text("Sarvam Edge Safety Assistant", color = ColorText, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                Spacer(modifier = Modifier.height(14.dp))

                // Alert Simulation Button
                Button(
                    onClick = {
                        val mockJson = """
                            {
                              "event": "driver_drowsy",
                              "driverStatus": "DROWSY",
                              "confidence": 0.97,
                              "riskLevel": "HIGH",
                              "timestamp": ${System.currentTimeMillis() / 1000}
                            }
                        """.trimIndent()
                        viewModel.bluetoothManager.simulateReceive(mockJson)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ColorPurple),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Filled.Warning, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Simulate Drowsy Alert")
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Driver Status Toggle Buttons
                val currentStatus by controller.currentDriverStatus.collectAsState()
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { controller.updateDriverStatus("NORMAL") },
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = if (currentStatus == "NORMAL") ColorGreenBg else Color.Transparent,
                            contentColor = if (currentStatus == "NORMAL") ColorGreen else ColorText2
                        ),
                        border = BorderStroke(1.dp, if (currentStatus == "NORMAL") ColorGreen else ColorBorder),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Driver: NORMAL", fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = { controller.updateDriverStatus("DROWSY") },
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = if (currentStatus == "DROWSY") ColorRedBg else Color.Transparent,
                            contentColor = if (currentStatus == "DROWSY") ColorRed else ColorText2
                        ),
                        border = BorderStroke(1.dp, if (currentStatus == "DROWSY") ColorRed else ColorBorder),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Driver: DROWSY", fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // SDK Simulation Toggle
                val sdkAvailable by viewModel.sarvamEdgeManager.isSdkAvailable.collectAsState()
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Sarvam Edge SDK Available", color = ColorText2, fontSize = 13.sp)
                    Switch(
                        checked = sdkAvailable,
                        onCheckedChange = { isAvailable ->
                            viewModel.sarvamEdgeManager.simulateSdkFailure(!isAvailable)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = ColorPurple,
                            checkedTrackColor = ColorPurpleBg
                        )
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Config Panel (Language & Repeat Interval)
                val config by controller.config.collectAsState()
                HorizontalDivider(color = ColorBorder)
                Spacer(modifier = Modifier.height(12.dp))
                
                Text("Demo Configurations", fontWeight = FontWeight.Bold, color = ColorText3, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(8.dp))

                // Language Selectors
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                ) {
                    val languages = listOf(
                        "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN",
                        "kn-IN", "ml-IN", "mr-IN", "gu-IN", "pa-IN", "od-IN"
                    )
                    languages.forEach { lang ->
                        Box(
                            modifier = Modifier
                                .width(80.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (config.language == lang) ColorPrimaryBg else ColorBg)
                                .border(1.dp, if (config.language == lang) ColorPrimary else ColorBorder, RoundedCornerShape(8.dp))
                                .clickable { controller.updateConfig(config.copy(language = lang)) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(lang, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (config.language == lang) ColorPrimary else ColorText2)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Repeat Interval
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Repeat Interval:", color = ColorText3, fontSize = 12.sp)
                    val intervals = listOf(5000L to "5s", 15000L to "15s", 30000L to "30s")
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        intervals.forEach { (ms, label) ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (config.repeatIntervalMs == ms) ColorPrimaryBg else ColorBg)
                                    .clickable { controller.updateConfig(config.copy(repeatIntervalMs = ms)) }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (config.repeatIntervalMs == ms) ColorPrimary else ColorText2)
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // ── Predicted Trip Card ─────────────────────────────────────────────────
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Row(
                modifier = Modifier.padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Predicted Destination", color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Filled.Navigation, contentDescription = null, tint = ColorPrimary, modifier = Modifier.size(20.dp))
                        Text(predictedTrip.destination, color = ColorText, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("${predictedTrip.distance} away", color = ColorText3, fontSize = 13.sp)
                }
                
                // Arrival Battery Stat
                Box(
                    modifier = Modifier
                        .background(ColorPrimaryBg, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Est. Arrival", color = ColorPrimary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Spacer(Modifier.height(2.dp))
                        Text("${predictedTrip.arrivalSoc}%", color = ColorPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Eco-Impact Gamification ─────────────────────────────────────────────
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.Eco, contentDescription = null, tint = ColorGreen)
                    Text("Eco-Impact This Week", color = ColorText, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    "Your smooth regenerative braking recovered 14 kWh of energy.",
                    color = ColorText3, fontSize = 14.sp, lineHeight = 20.sp
                )
                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Equivalent to saving", color = ColorText4, fontSize = 12.sp)
                        Text("4 Trees", color = ColorGreen, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    }
                    Icon(Icons.Filled.Forest, contentDescription = null, tint = ColorGreen.copy(alpha = 0.2f), modifier = Modifier.size(48.dp))
                }
            }
        }

        Spacer(Modifier.height(32.dp))
        }

        // ── AI Assistant FAB ──
        FloatingActionButton(
            onClick = { navController.navigate("assistant") },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 32.dp, end = 24.dp),
            containerColor = ColorPrimary,
            contentColor = Color.White
        ) {
            Icon(Icons.Filled.AutoAwesome, contentDescription = "AI Assistant")
        }
    }
}

// Data class for the predictive action
private data class SmartAction(
    val title: String,
    val subtitle: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val color: Color
)

private data class PredictedTrip(
    val destination: String,
    val distance: String,
    val arrivalSoc: Int
)

@Composable
private fun MinimalActionButton(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(ColorSurface, CircleShape)
                .border(1.dp, ColorBorder, CircleShape)
                .clickable { },
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = label, tint = ColorPrimary, modifier = Modifier.size(24.dp))
        }
        Text(label, color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}
