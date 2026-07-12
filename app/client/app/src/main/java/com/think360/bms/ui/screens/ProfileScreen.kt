package com.think360.bms.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.think360.bms.ui.theme.*

@Composable
fun ProfileScreen(navController: NavController) {
    // Identity State
    var userName by remember { mutableStateOf("Alex Driver") }
    var selectedAvatar by remember { mutableStateOf(0) }
    
    // Preferences State
    var useMetric by remember { mutableStateOf(true) }
    var useCelsius by remember { mutableStateOf(true) }
    
    // Memory State
    var memorySeats by remember { mutableStateOf(true) }
    var keyFobLink by remember { mutableStateOf(true) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorSurface)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        // ── Top App Bar ──
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = ColorText)
            }
            Spacer(Modifier.width(8.dp))
            Text("Driver Profile", color = ColorText, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }

        // ── Digital Identity (Avatar Picker) ──
        Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(ColorPrimaryBg, CircleShape)
                    .border(2.dp, ColorPrimary, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                val icon = when (selectedAvatar) {
                    0 -> Icons.Filled.Face
                    1 -> Icons.Filled.SportsMotorsports
                    2 -> Icons.Filled.EmojiEmotions
                    else -> Icons.Filled.Person
                }
                Icon(icon, contentDescription = null, tint = ColorPrimary, modifier = Modifier.size(50.dp))
            }
            Spacer(Modifier.height(16.dp))
            OutlinedTextField(
                value = userName,
                onValueChange = { userName = it },
                textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, fontWeight = FontWeight.Bold, fontSize = 24.sp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = ColorPrimary
                ),
                singleLine = true,
                modifier = Modifier.width(200.dp)
            )
            
            Spacer(Modifier.height(24.dp))
            Text("Select Avatar", color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                AvatarOption(Icons.Filled.Face, selectedAvatar == 0) { selectedAvatar = 0 }
                AvatarOption(Icons.Filled.SportsMotorsports, selectedAvatar == 1) { selectedAvatar = 1 }
                AvatarOption(Icons.Filled.EmojiEmotions, selectedAvatar == 2) { selectedAvatar = 2 }
                AvatarOption(Icons.Filled.Person, selectedAvatar == 3) { selectedAvatar = 3 }
            }
        }

        Spacer(Modifier.height(40.dp))
        HorizontalDivider(color = ColorBorder)
        Spacer(Modifier.height(24.dp))

        // ── App Preferences ──
        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            Text("App Preferences", color = ColorText, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text("Customize how data is displayed for you.", color = ColorText4, fontSize = 13.sp)
            Spacer(Modifier.height(16.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ColorBg),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    PreferenceRow(
                        icon = Icons.Filled.Straighten,
                        title = "Distance Units",
                        subtitle = if (useMetric) "Kilometers (km)" else "Miles (mi)",
                        isChecked = useMetric,
                        onToggle = { useMetric = it }
                    )
                    HorizontalDivider(color = ColorBorder, modifier = Modifier.padding(horizontal = 16.dp))
                    PreferenceRow(
                        icon = Icons.Filled.Thermostat,
                        title = "Temperature Units",
                        subtitle = if (useCelsius) "Celsius (°C)" else "Fahrenheit (°F)",
                        isChecked = useCelsius,
                        onToggle = { useCelsius = it }
                    )
                }
            }
        }

        Spacer(Modifier.height(40.dp))
        HorizontalDivider(color = ColorBorder)
        Spacer(Modifier.height(24.dp))

        // ── Digital Memory Sync ──
        Column(modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 40.dp)) {
            Text("Digital Memory Sync", color = ColorText, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text("Link your phone profile to the physical car.", color = ColorText4, fontSize = 13.sp)
            Spacer(Modifier.height(16.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = ColorBg),
                border = BorderStroke(1.dp, ColorBorder)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    MemoryRow(
                        icon = Icons.Filled.AirlineSeatReclineNormal,
                        title = "Auto-Adjust Seats",
                        subtitle = "When unlocked via Bluetooth",
                        isChecked = memorySeats,
                        onToggle = { memorySeats = it }
                    )
                    HorizontalDivider(color = ColorBorder, modifier = Modifier.padding(horizontal = 16.dp))
                    MemoryRow(
                        icon = Icons.Filled.VpnKey,
                        title = "Link to Key Fob #1",
                        subtitle = "Overrides guest profile",
                        isChecked = keyFobLink,
                        onToggle = { keyFobLink = it }
                    )
                }
            }
        }
    }
}

@Composable
private fun AvatarOption(icon: ImageVector, isSelected: Boolean, onClick: () -> Unit) {
    val bgColor = if (isSelected) ColorPrimary else ColorBg
    val tint = if (isSelected) Color.White else ColorText4
    val borderColor = if (isSelected) ColorPrimary else ColorBorder
    
    Box(
        modifier = Modifier
            .size(50.dp)
            .background(bgColor, CircleShape)
            .border(1.dp, borderColor, CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(24.dp))
    }
}

@Composable
private fun PreferenceRow(icon: ImageVector, title: String, subtitle: String, isChecked: Boolean, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onToggle(!isChecked) }.padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(40.dp).background(ColorSurface, CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = ColorText3)
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = ColorText4, fontSize = 12.sp)
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = ColorPrimary)
        )
    }
}

@Composable
private fun MemoryRow(icon: ImageVector, title: String, subtitle: String, isChecked: Boolean, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onToggle(!isChecked) }.padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(40.dp).background(ColorSurface, CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = ColorText3)
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = ColorText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = ColorText4, fontSize = 12.sp)
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = ColorPrimary)
        )
    }
}
