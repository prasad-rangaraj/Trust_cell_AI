package com.think360.bms.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel
import kotlin.math.sin
import kotlin.math.PI
import kotlin.math.roundToInt

@Composable
fun ChargingScreen(viewModel: BmsViewModel) {
    val batteryState by viewModel.batteryState.collectAsState()
    val isConnected  by viewModel.isConnected.collectAsState()

    val soc = batteryState.soc.toInt().coerceIn(0, 100)
    val isCharging = batteryState.current > 0.5f
    val packVoltApprox = (batteryState.cell1 + batteryState.cell2 + batteryState.cell3 + batteryState.cell4)
    val powerKw = if (packVoltApprox > 0f && !batteryState.current.isNaN()) {
        (packVoltApprox * batteryState.current / 1000f).let { p -> if (p < 0f) -p else p }
    } else 0f
    
    var chargeLimit by remember { mutableFloatStateOf(80f) }
    var selectedPersona by remember { mutableIntStateOf(1) } // 0=Eco, 1=Balanced, 2=Hyper
    var cableUnlocked by remember { mutableStateOf(false) }
    var smartDepartureEnabled by remember { mutableStateOf(false) }
    var powerStationEnabled by remember { mutableStateOf(false) }
    var powerStationReserve by remember { mutableFloatStateOf(20f) }

    // Dynamic color based on persona
    val fluidColor = when (selectedPersona) {
        0 -> Color(0xFF10B981) // Eco Green
        1 -> Color(0xFF3B82F6) // Balanced Blue
        else -> Color(0xFFF59E0B) // Hyper Amber
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AuroraBackground()
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // ── Header ─────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Text("Charging", color = ColorText, fontWeight = FontWeight.Black, fontSize = 28.sp)
        }

        // ── 1. The Liquid Energy Orb ──────────────────────────────────────────
        Spacer(Modifier.height(8.dp))
        Box(
            modifier = Modifier.size(260.dp),
            contentAlignment = Alignment.Center
        ) {
            // Outer Ring
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(
                    color = ColorBorder,
                    style = Stroke(width = 2.dp.toPx())
                )
            }
            
            // The Liquid
            val infiniteTransition = rememberInfiniteTransition(label = "wave")
            val waveOffset by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = (2.0 * PI).toFloat(),
                animationSpec = infiniteRepeatable(tween(if (selectedPersona == 2) 1500 else 3000, easing = LinearEasing)),
                label = "waveOffset"
            )
            val liquidHeightRatio by animateFloatAsState(targetValue = soc / 100f, animationSpec = tween(1500, easing = FastOutSlowInEasing), label = "liquidHeight")

            Canvas(
                modifier = Modifier
                    .size(240.dp)
                    .clip(CircleShape)
                    .background(ColorSurface.copy(alpha = 0.4f))
            ) {
                val waterHeight = size.height * (1f - liquidHeightRatio)
                val waveLength = size.width
                val amplitude = (if (selectedPersona == 2) 16.dp else 8.dp).toPx() // Higher waves for hyper mode
                
                val wavePath = Path()
                wavePath.moveTo(0f, size.height)
                wavePath.lineTo(0f, waterHeight)
                
                for (x in 0..size.width.toInt() step 5) {
                    val y = waterHeight + sin((x / waveLength * 2f * PI.toFloat()) + waveOffset) * amplitude
                    wavePath.lineTo(x.toFloat(), y)
                }
                
                wavePath.lineTo(size.width, size.height)
                wavePath.close()
                
                drawPath(
                    path = wavePath,
                    brush = Brush.verticalGradient(
                        colors = listOf(fluidColor.copy(alpha = 0.8f), fluidColor)
                    )
                )
            }
            
            // Percentage Overlay
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "$soc%", 
                    color = if (soc > 45) Color.White else ColorText, 
                    fontSize = 64.sp, 
                    fontWeight = FontWeight.Black,
                    letterSpacing = (-2).sp
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    val isDischarging = batteryState.current < -0.5f
                    val icon = if (isCharging) Icons.Filled.ElectricBolt else if (isDischarging) Icons.Filled.DirectionsCar else Icons.Filled.PowerOff
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = if (soc > 45) Color.White.copy(0.8f) else ColorText4,
                        modifier = Modifier.size(16.dp)
                    )
                    
                    val statusText = if (isCharging) {
                        val percentNeeded = (chargeLimit - soc).coerceAtLeast(0f)
                        if (percentNeeded == 0f) "Charge Complete" else {
                            val kw = powerKw.coerceAtLeast(0.5f)
                            val hrsRemaining = (percentNeeded / 100f * 82f) / kw
                            val minsRemaining = (hrsRemaining * 60).toInt()
                            val hrs = minsRemaining / 60
                            val mins = minsRemaining % 60
                            val timeStr = if (hrs > 0) "${hrs}h ${mins}m" else "${mins}m"
                            "+ ${"%.1f".format(kw)} kW • $timeStr"
                        }
                    } else if (isDischarging) {
                        "- ${"%.1f".format(powerKw)} kW"
                    } else "Parked & Unplugged"

                    Text(
                        statusText,
                        color = if (soc > 45) Color.White.copy(0.8f) else ColorText3,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(Modifier.height(32.dp))

        // ── 2. Charging Personas (Segmented Selector) ─────────────────────────
        SectionHeader("Charge Mode")
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .background(ColorSurface.copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                .border(1.dp, ColorBorder, RoundedCornerShape(16.dp))
                .padding(4.dp)
        ) {
            val modes = listOf("Eco" to Icons.Filled.Eco, "Balanced" to Icons.Filled.EvStation, "Hyper" to Icons.Filled.LocalFireDepartment)
            modes.forEachIndexed { index, pair ->
                val isSelected = selectedPersona == index
                val bgColor by animateColorAsState(if (isSelected) ColorText else Color.Transparent)
                val textColor by animateColorAsState(if (isSelected) Color.White else ColorText4)
                
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(bgColor)
                        .clickable { selectedPersona = index }
                        .padding(vertical = 12.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(pair.second, contentDescription = null, tint = textColor, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(pair.first, color = textColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        
        AnimatedVisibility(visible = selectedPersona == 0) {
            Text("Eco Mode: Charging restricted to off-peak hours to save money.", color = Color(0xFF10B981), fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp, start = 24.dp, end = 24.dp), textAlign = TextAlign.Center)
        }
        AnimatedVisibility(visible = selectedPersona == 2) {
            Text("Hyper Mode: Active battery heating engaged. Pulling maximum amperage.", color = Color(0xFFD97706), fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp, start = 24.dp, end = 24.dp), textAlign = TextAlign.Center)
        }

        Spacer(Modifier.height(24.dp))

        // ── 3. Daily vs Trip Smart Slider ─────────────────────────────────────
        SectionHeader("Charge Limit")
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp).animateContentSize(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface.copy(alpha = 0.85f)),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Target", color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text("${chargeLimit.toInt()}%", color = if (chargeLimit > 80f) ColorAmber else ColorGreen, fontSize = 22.sp, fontWeight = FontWeight.Black)
                }
                
                Spacer(Modifier.height(8.dp))
                
                Box(modifier = Modifier.fillMaxWidth().height(40.dp), contentAlignment = Alignment.Center) {
                    Row(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp))) {
                        Box(modifier = Modifier.weight(0.8f).fillMaxHeight().background(ColorGreenBg))
                        Box(modifier = Modifier.weight(0.2f).fillMaxHeight().background(Color(0xFFFEF3C7)))
                    }
                    Slider(
                        value = chargeLimit, onValueChange = { chargeLimit = it },
                        valueRange = 50f..100f, steps = 4,
                        colors = SliderDefaults.colors(
                            thumbColor = if (chargeLimit > 80f) ColorAmber else ColorGreen,
                            activeTrackColor = Color.Transparent, inactiveTrackColor = Color.Transparent
                        )
                    )
                }
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Daily", color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("Trip", color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                AnimatedVisibility(visible = chargeLimit > 80f) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp).background(Color(0xFFFEF3C7), RoundedCornerShape(12.dp)).padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Filled.WarningAmber, contentDescription = null, tint = ColorAmber)
                        Text("Charging past 80% accelerates battery degradation. Only recommended for long road trips.", color = Color(0xFF92400E), fontSize = 12.sp, lineHeight = 16.sp)
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        // ── 4. Smart Departure (Preconditioning) ───────────────────────────────
        SectionHeader("Smart Departure")
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface.copy(alpha = 0.85f)),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().clickable { smartDepartureEnabled = !smartDepartureEnabled }.padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(44.dp).background(if (smartDepartureEnabled) Color(0xFFF59E0B).copy(alpha = 0.15f) else ColorText.copy(0.05f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Schedule, contentDescription = null, tint = if (smartDepartureEnabled) Color(0xFFF59E0B) else ColorText)
                    }
                    Column {
                        Text("Precondition Cabin", color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text(if (smartDepartureEnabled) "Ready by 08:00 AM (Wall Power)" else "Warm car before you leave", color = ColorText4, fontSize = 12.sp)
                    }
                }
                IosSwitch(checked = smartDepartureEnabled, onCheckedChange = { smartDepartureEnabled = it })
            }
        }
        
        Spacer(Modifier.height(16.dp))

        // ── 5. Power Station Mode (V2L) ────────────────────────────────────────
        SectionHeader("Power Station Mode")
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp).animateContentSize(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = ColorSurface.copy(alpha = 0.85f)),
            border = BorderStroke(1.dp, ColorBorder)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { powerStationEnabled = !powerStationEnabled }.padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(44.dp).background(if (powerStationEnabled) Color(0xFF3B82F6).copy(alpha = 0.15f) else ColorText.copy(0.05f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Power, contentDescription = null, tint = if (powerStationEnabled) Color(0xFF3B82F6) else ColorText)
                        }
                        Column {
                            Text("Activate AC Outlets", color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text(if (powerStationEnabled) "Powering external devices" else "Use car as mobile power grid", color = ColorText4, fontSize = 12.sp)
                        }
                    }
                    IosSwitch(checked = powerStationEnabled, onCheckedChange = { powerStationEnabled = it })
                }
                
                AnimatedVisibility(visible = powerStationEnabled) {
                    Column(modifier = Modifier.fillMaxWidth().background(ColorBg.copy(alpha = 0.5f)).padding(20.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Drive Home Reserve", color = ColorText3, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text("${powerStationReserve.toInt()}%", color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(Modifier.height(8.dp))
                        Slider(
                            value = powerStationReserve, onValueChange = { powerStationReserve = it },
                            valueRange = 10f..50f, steps = 3,
                            colors = SliderDefaults.colors(thumbColor = ColorText, activeTrackColor = Color(0xFF3B82F6))
                        )
                        Text("Power Station will automatically shut off when battery reaches reserve limit.", color = ColorText4, fontSize = 11.sp, lineHeight = 14.sp)
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── 6. Idle Fee Guardian ──────────────────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
            border = BorderStroke(1.dp, Color(0xFFFCA5A5))
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(Icons.Filled.Timer, contentDescription = null, tint = Color(0xFFDC2626))
                Column {
                    Text("Idle Fee Guardian Active", color = Color(0xFF991B1B), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("Unplug by 2:45 PM to avoid $1.00/min idle fees at this supercharger.", color = Color(0xFFB91C1C), fontSize = 12.sp, lineHeight = 16.sp)
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        // ── 6. Slide to Unplug (Physical Interaction) ─────────────────────────
        SectionHeader("Cable Lock")
        SwipeToUnlock(
            isUnlocked = cableUnlocked,
            onUnlock = { cableUnlocked = true }
        )
        
        if (cableUnlocked) {
            Text("Cable Unlocked. You may safely remove the charger.", color = ColorGreen, fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp))
        }

        Spacer(Modifier.height(40.dp))
    }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        color = ColorText3, fontSize = 13.sp, fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp).fillMaxWidth()
    )
}

@Composable
fun SwipeToUnlock(
    isUnlocked: Boolean,
    onUnlock: () -> Unit
) {
    var offsetX by remember { mutableFloatStateOf(0f) }
    val maxDragPx = with(LocalDensity.current) { 240.dp.toPx() } // Approximate drag distance
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .height(64.dp)
            .background(if (isUnlocked) ColorGreenBg else ColorSurface.copy(alpha = 0.85f), RoundedCornerShape(32.dp))
            .border(1.dp, if (isUnlocked) ColorGreen.copy(0.3f) else ColorBorder, RoundedCornerShape(32.dp)),
        contentAlignment = Alignment.CenterStart
    ) {
        // Background Text
        Text(
            if (isUnlocked) "UNLOCKED" else "Slide to unplug cable", 
            color = if (isUnlocked) ColorGreen else ColorText3, 
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
        
        if (!isUnlocked) {
            // Draggable Thumb
            Box(
                modifier = Modifier
                    .offset { IntOffset(offsetX.roundToInt(), 0) }
                    .padding(6.dp)
                    .size(52.dp)
                    .background(ColorText, CircleShape)
                    .pointerInput(Unit) {
                        detectHorizontalDragGestures(
                            onDragEnd = {
                                if (offsetX > maxDragPx * 0.8f) {
                                    offsetX = maxDragPx
                                    onUnlock()
                                } else {
                                    offsetX = 0f
                                }
                            }
                        ) { change, dragAmount ->
                            change.consume()
                            offsetX = (offsetX + dragAmount).coerceIn(0f, maxDragPx)
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = Color.White)
            }
        } else {
            // Unlocked State Icon
            Box(
                modifier = Modifier
                    .padding(6.dp)
                    .size(52.dp)
                    .background(ColorGreen, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Check, contentDescription = null, tint = Color.White)
            }
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
