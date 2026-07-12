package com.think360.bms.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel

@Composable
fun SafetyScreen(viewModel: BmsViewModel) {
    val batteryState by viewModel.batteryState.collectAsState()
    val onnxResult by viewModel.onnxResult.collectAsState()

    // Determine safety state from ONNX anomaly data
    val faultProb = onnxResult?.let {
        if (it.label != "NORMAL") it.confidence else (1f - it.confidence).coerceAtLeast(0f)
    } ?: 0f

    val isSafe = faultProb < 0.2f
    val forcefieldColor = if (isSafe) Color(0xFF0EA5E9) else ColorAmber

    // State for local toggles
    var valetMode by remember { mutableStateOf(false) }
    var sentryMode by remember { mutableStateOf(true) }
    var towMode by remember { mutableStateOf(false) }
    
    // Sub-feature state
    var valetSpeedLimit by remember { mutableFloatStateOf(80f) }
    var valetLockStorage by remember { mutableStateOf(true) }
    var valetHideGps by remember { mutableStateOf(true) }
    var sentryExcludeHome by remember { mutableStateOf(true) }
    var sentryExcludeWork by remember { mutableStateOf(false) }
    var sentryHonk by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        AuroraBackground()
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
        ) {
        // ── Header ─────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Text("Safety & Security", color = ColorText, fontWeight = FontWeight.Black, fontSize = 28.sp)
        }

        // ── Grid Row 1: Perimeter Secure & Cabin Temp ─────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Left Square: Perimeter Secure
            Card(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = ColorSurface),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp).fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    val infiniteTransition = rememberInfiniteTransition(label = "perimeter")
                    val pulse by infiniteTransition.animateFloat(
                        initialValue = 0.2f, targetValue = 1f,
                        animationSpec = infiniteRepeatable(animation = tween(1500, easing = LinearOutSlowInEasing), repeatMode = RepeatMode.Reverse),
                        label = "pulse"
                    )

                    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(72.dp)) {
                        // The glowing physical perimeter
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .border(
                                    width = 2.dp,
                                    color = ColorGreen.copy(alpha = pulse),
                                    shape = RoundedCornerShape(16.dp)
                                )
                        )
                        Icon(
                            Icons.Filled.DirectionsCar,
                            contentDescription = null,
                            tint = ColorPrimary,
                            modifier = Modifier.size(36.dp)
                        )
                        // Tiny lock badge
                        Box(
                            modifier = Modifier.align(Alignment.BottomEnd).offset(x = 4.dp, y = 4.dp).background(ColorSurface, CircleShape)
                        ) {
                            Icon(Icons.Filled.Lock, contentDescription = null, tint = ColorGreen, modifier = Modifier.size(16.dp).padding(2.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Perimeter Secure", color = ColorText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Locked & Armed", color = ColorText3, fontSize = 11.sp, textAlign = TextAlign.Center)
                }
            }

            // Right Square: Cabin Protection
            Card(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = ColorSurface),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp).fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier.size(72.dp).background(Color(0xFF3B82F6).copy(alpha = 0.1f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Pets, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(32.dp))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("${batteryState.temp1.toInt()}°C", color = ColorText, fontWeight = FontWeight.Black, fontSize = 20.sp)
                    Text("Cabin Protected", color = ColorText3, fontSize = 12.sp, textAlign = TextAlign.Center)
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Valet & Sentry Security (Expanding Cards) ──────────────────────────
        SectionHeader("Security Settings")
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .animateContentSize(animationSpec = spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow)),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column {
                // Valet Mode Main Row
                SettingsToggleRow(
                    icon = Icons.Filled.VpnKey, iconTint = Color(0xFF8B5CF6),
                    title = "Valet Mode", subtitle = "Limits vehicle speed and features.",
                    checked = valetMode, onCheckedChange = { valetMode = it }
                )
                
                // Valet Mode Sub-Features (Neat & Smooth)
                if (valetMode) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(ColorSurface3.copy(alpha = 0.3f))
                            .padding(20.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Speed Limit", color = ColorText, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("${valetSpeedLimit.toInt()} km/h", color = Color(0xFF8B5CF6), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                        Slider(
                            value = valetSpeedLimit, onValueChange = { valetSpeedLimit = it },
                            valueRange = 60f..120f, steps = 5,
                            colors = SliderDefaults.colors(thumbColor = Color(0xFF8B5CF6), activeTrackColor = Color(0xFF8B5CF6)),
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                        SubFeatureRow("Lock Storage Compartments", valetLockStorage) { valetLockStorage = it }
                        SubFeatureRow("Hide GPS & Home Address", valetHideGps) { valetHideGps = it }
                    }
                }

                HorizontalDivider(color = ColorBorder, modifier = Modifier.padding(horizontal = 20.dp))
                
                // Sentry Mode Main Row
                SettingsToggleRow(
                    icon = Icons.Filled.Videocam, iconTint = ColorRed,
                    title = "Sentry Mode", subtitle = "Monitors surroundings via 4 cameras.",
                    checked = sentryMode, onCheckedChange = { sentryMode = it }
                )
                
                // Sentry Mode Sub-Features (Neat & Smooth)
                if (sentryMode) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(ColorSurface3.copy(alpha = 0.3f))
                            .padding(20.dp)
                    ) {
                        Text("Smart Exclusions", color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                        SubFeatureRow("Exclude Home Location", sentryExcludeHome) { sentryExcludeHome = it }
                        SubFeatureRow("Exclude Work Location", sentryExcludeWork) { sentryExcludeWork = it }
                        
                        Spacer(Modifier.height(12.dp))
                        Text("Active Defense", color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                        SubFeatureRow("Honk Horn on Proximity", sentryHonk) { sentryHonk = it }
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Emergency & Towing ──────────────────────────────────────────────────
        SectionHeader("Emergency")
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { }.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier.size(44.dp).background(ColorRedBg, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.SupportAgent, contentDescription = null, tint = ColorRed)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Call Roadside Assistance", color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("24/7 priority support for Guardian members.", color = ColorText3, fontSize = 12.sp)
                    }
                    Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = ColorText4)
                }
                HorizontalDivider(color = ColorBorder, modifier = Modifier.padding(horizontal = 20.dp))
                SettingsToggleRow(
                    icon = Icons.Filled.RvHookup, iconTint = ColorAmber,
                    title = "Tow Mode", subtitle = "Disengages electric motors for safe towing.",
                    checked = towMode, onCheckedChange = { towMode = it }
                )
            }
        }
        
        Spacer(Modifier.height(16.dp))

        // ── Gamified Driver Score ───────────────────────────────────────────
        SectionHeader("Driving Habits")
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(
                            modifier = Modifier.size(48.dp).background(Color(0xFFF59E0B).copy(alpha = 0.15f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.WorkspacePremium, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(24.dp))
                        }
                        Column {
                            Text("Smooth Operator", color = ColorText, fontWeight = FontWeight.Black, fontSize = 16.sp)
                            Text("Gold Badge Earned", color = Color(0xFFF59E0B), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Text("94", color = ColorText, fontSize = 32.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    "You had 0 hard brakes this week. Your driving was smoother than 88% of EV Guardian users!",
                    color = ColorText3, fontSize = 13.sp, lineHeight = 20.sp
                )
            }
        }

        Spacer(Modifier.height(32.dp))
    }
    }
}

@Composable
private fun AuroraBackground() {
    val infiniteTransition = rememberInfiniteTransition(label = "aurora")
    
    val offsetX1 by infiniteTransition.animateFloat(
        initialValue = -0.2f, targetValue = 1.2f,
        animationSpec = infiniteRepeatable(animation = tween(15000, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "x1"
    )
    val offsetY1 by infiniteTransition.animateFloat(
        initialValue = -0.1f, targetValue = 0.8f,
        animationSpec = infiniteRepeatable(animation = tween(12000, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "y1"
    )

    val offsetX2 by infiniteTransition.animateFloat(
        initialValue = 1.2f, targetValue = -0.2f,
        animationSpec = infiniteRepeatable(animation = tween(18000, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "x2"
    )
    val offsetY2 by infiniteTransition.animateFloat(
        initialValue = 0.9f, targetValue = 0.1f,
        animationSpec = infiniteRepeatable(animation = tween(14000, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "y2"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFBAE6FD).copy(alpha = 0.4f), Color.Transparent),
                    center = Offset(size.width * offsetX1, size.height * offsetY1),
                    radius = size.width * 0.8f
                ),
                radius = size.width * 0.8f,
                center = Offset(size.width * offsetX1, size.height * offsetY1)
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFC7D2FE).copy(alpha = 0.4f), Color.Transparent),
                    center = Offset(size.width * offsetX2, size.height * offsetY2),
                    radius = size.width * 0.9f
                ),
                radius = size.width * 0.9f,
                center = Offset(size.width * offsetX2, size.height * offsetY2)
            )
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        color = ColorText3, fontSize = 13.sp, fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
    )
}

@Composable
private fun SettingsToggleRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.padding(20.dp).fillMaxWidth().clickable { onCheckedChange(!checked) },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier.size(44.dp).background(iconTint.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconTint)
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, color = ColorText3, fontSize = 12.sp, lineHeight = 16.sp)
        }
        IosSwitch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun SubFeatureRow(
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = ColorText, fontSize = 13.sp)
        IosSwitch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            modifier = Modifier.scale(0.8f)
        )
    }
}

@Composable
fun IosSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val trackColor by animateColorAsState(targetValue = if (checked) Color(0xFF34C759) else Color(0xFFE5E5EA), label = "track")
    val thumbOffset by animateDpAsState(targetValue = if (checked) 24.dp else 2.dp, label = "thumb")
    
    Box(
        modifier = modifier
            .width(50.dp)
            .height(28.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(trackColor)
            .clickable { onCheckedChange(!checked) }
    ) {
        Box(
            modifier = Modifier
                .offset(x = thumbOffset)
                .align(Alignment.CenterStart)
                .size(24.dp)
                .clip(CircleShape)
                .background(Color.White)
        )
    }
}
