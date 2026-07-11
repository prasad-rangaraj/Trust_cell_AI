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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.navigation.NavController
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel

@Composable
fun SettingsScreen2(viewModel: BmsViewModel, navController: NavController) {
    val isConnected by viewModel.isConnected.collectAsState()
    
    // User Preferences State
    var userName by remember { mutableStateOf("Alex Driver") }
    var vehicleName by remember { mutableStateOf("EVGA-0001") }
    var showEditProfile by remember { mutableStateOf(false) }
    
    var selectedPersona by remember { mutableStateOf("Balanced") }
    var anxietyBuffer by remember { mutableStateOf(20f) }
    
    // Routines State
    var routineMorning by remember { mutableStateOf(true) }
    var routineLowBattery by remember { mutableStateOf(false) }
    var routineHome by remember { mutableStateOf(true) }
    
    // Security State
    var biometricLock by remember { mutableStateOf(true) }

    // Dynamic UI styling based on selected persona
    val themeColor by animateColorAsState(
        targetValue = when (selectedPersona) {
            "Eco" -> Color(0xFF10B981) // Green
            "Thrill" -> Color(0xFFEF4444) // Red
            else -> Color(0xFF3B82F6) // Blue
        },
        animationSpec = tween(500)
    )
    
    val themeBgColor by animateColorAsState(
        targetValue = when (selectedPersona) {
            "Eco" -> Color(0xFFD1FAE5)
            "Thrill" -> Color(0xFFFEE2E2)
            else -> Color(0xFFDBEAFE)
        },
        animationSpec = tween(500)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorSurface)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        // ── Header ────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier.size(50.dp).background(themeBgColor, CircleShape).border(2.dp, themeColor.copy(alpha=0.5f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Person, contentDescription = null, tint = themeColor, modifier = Modifier.size(28.dp))
                }
                Spacer(Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(userName, color = ColorText, fontWeight = FontWeight.Black, fontSize = 24.sp)
                    Text("Connected to $vehicleName", color = ColorText4, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
                IconButton(
                    onClick = { navController.navigate("profile") },
                    modifier = Modifier.background(ColorSurface, CircleShape).border(1.dp, ColorBorder, CircleShape)
                ) {
                    Icon(Icons.Outlined.Edit, contentDescription = "Edit Profile", tint = themeColor)
                }
            }
        }

        // ── Driver Persona ────────────────────────────────────────────────
        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            SectionTitle("Driving Persona", "Tailors acceleration and climate to your vibe.")
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                PersonaCard(
                    modifier = Modifier.weight(1f),
                    title = "Eco",
                    icon = Icons.Filled.EnergySavingsLeaf,
                    isSelected = selectedPersona == "Eco",
                    activeColor = Color(0xFF10B981),
                    onClick = { selectedPersona = "Eco" }
                )
                PersonaCard(
                    modifier = Modifier.weight(1f),
                    title = "Balanced",
                    icon = Icons.Filled.Balance,
                    isSelected = selectedPersona == "Balanced",
                    activeColor = Color(0xFF3B82F6),
                    onClick = { selectedPersona = "Balanced" }
                )
                PersonaCard(
                    modifier = Modifier.weight(1f),
                    title = "Thrill",
                    icon = Icons.Filled.Speed,
                    isSelected = selectedPersona == "Thrill",
                    activeColor = Color(0xFFEF4444),
                    onClick = { selectedPersona = "Thrill" }
                )
            }
        }
        
        Spacer(Modifier.height(32.dp))

        // ── Range Peace of Mind ───────────────────────────────────────────
        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            SectionTitle("Peace of Mind Buffer", "The app will ensure your battery never drops below this during routing.")
            Spacer(Modifier.height(16.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ColorBg),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Reserve Target", color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("${anxietyBuffer.toInt()}%", color = themeColor, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    }
                    Spacer(Modifier.height(8.dp))
                    
                    val sliderColor = when {
                        anxietyBuffer < 15f -> Color(0xFFEF4444)
                        anxietyBuffer < 25f -> Color(0xFFF59E0B)
                        else -> Color(0xFF10B981)
                    }
                    
                    Slider(
                        value = anxietyBuffer,
                        onValueChange = { anxietyBuffer = it },
                        valueRange = 5f..40f,
                        colors = SliderDefaults.colors(
                            thumbColor = sliderColor,
                            activeTrackColor = sliderColor,
                            inactiveTrackColor = ColorBorder
                        )
                    )
                    Text("We'll auto-route to chargers to protect this reserve.", color = ColorText4, fontSize = 12.sp)
                }
            }
        }

        Spacer(Modifier.height(36.dp))

        // ── Smart Routines ────────────────────────────────────────────────
        Column {
            SectionTitle("Smart Routines", "Life automations for your car.", modifier = Modifier.padding(horizontal = 24.dp))
            Spacer(Modifier.height(16.dp))
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                RoutineCard(
                    title = "Morning Commute",
                    trigger = "Weekdays 8:00 AM",
                    action = "Pre-cool cabin to 22°C",
                    icon = Icons.Filled.WbSunny,
                    isEnabled = routineMorning,
                    themeColor = themeColor,
                    onToggle = { routineMorning = it }
                )
                RoutineCard(
                    title = "Range Saver",
                    trigger = "Battery < 20%",
                    action = "Auto-enable Eco Mode",
                    icon = Icons.Filled.BatterySaver,
                    isEnabled = routineLowBattery,
                    themeColor = themeColor,
                    onToggle = { routineLowBattery = it }
                )
                RoutineCard(
                    title = "Home Arrival",
                    trigger = "Arrive at Home",
                    action = "Unlock charge port",
                    icon = Icons.Filled.Home,
                    isEnabled = routineHome,
                    themeColor = themeColor,
                    onToggle = { routineHome = it }
                )
            }
        }

        Spacer(Modifier.height(36.dp))

        // ── Privacy & Security ────────────────────────────────────────────
        Column(modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 40.dp)) {
            SectionTitle("Privacy & Security", "Manage access to your vehicle.")
            Spacer(Modifier.height(16.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ColorBg),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    SecurityRow(
                        icon = Icons.Filled.Fingerprint, 
                        title = "Biometric Lock", 
                        subtitle = "Require FaceID for remote start",
                        isChecked = biometricLock,
                        themeColor = themeColor,
                        onToggle = { biometricLock = it }
                    )
                    HorizontalDivider(color = ColorBorder, modifier = Modifier.padding(horizontal = 16.dp))
                    SecurityRow(
                        icon = Icons.Filled.LocationOff, 
                        title = "Incognito Mode", 
                        subtitle = "Pause location tracking in app",
                        isChecked = false,
                        themeColor = themeColor,
                        onToggle = { }
                    )
                }
            }
            
            Spacer(Modifier.height(24.dp))
            
            Button(
                onClick = { },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444).copy(alpha=0.1f))
            ) {
                Text("Sign Out", color = Color(0xFFEF4444), fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ── UI Components ─────────────────────────────────────────────────────────

@Composable
private fun SectionTitle(title: String, subtitle: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(title, color = ColorText, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(2.dp))
        Text(subtitle, color = ColorText4, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun PersonaCard(modifier: Modifier, title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, isSelected: Boolean, activeColor: Color, onClick: () -> Unit) {
    val bgColor by animateColorAsState(if (isSelected) activeColor else ColorBg)
    val contentColor by animateColorAsState(if (isSelected) Color.White else ColorText4)
    val borderColor by animateColorAsState(if (isSelected) activeColor else ColorBorder)
    
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = BorderStroke(1.dp, borderColor)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(32.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, color = contentColor, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun RoutineCard(title: String, trigger: String, action: String, icon: androidx.compose.ui.graphics.vector.ImageVector, isEnabled: Boolean, themeColor: Color, onToggle: (Boolean) -> Unit) {
    Card(
        modifier = Modifier.width(220.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = ColorBg),
        border = BorderStroke(1.dp, if (isEnabled) themeColor.copy(alpha=0.5f) else ColorBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier.size(40.dp).background(if (isEnabled) themeColor.copy(alpha=0.15f) else ColorSurface, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = if (isEnabled) themeColor else ColorText4)
                }
                Switch(
                    checked = isEnabled,
                    onCheckedChange = onToggle,
                    colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = themeColor)
                )
            }
            Spacer(Modifier.height(16.dp))
            Text(title, color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(8.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("IF  ", color = ColorText4, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(trigger, color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("DO ", color = ColorText4, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(action, color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun SecurityRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, isChecked: Boolean, themeColor: Color, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onToggle(!isChecked) }.padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(40.dp).background(ColorSurface, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = ColorText3)
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = ColorText4, fontSize = 12.sp)
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = themeColor)
        )
    }
}
