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
import androidx.navigation.NavController
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel
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
                    Text(
                        "EV Guardian",
                        color = heroTextColor, fontWeight = FontWeight.Black, fontSize = 20.sp
                    )
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
