package com.think360.bms.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Help
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.think360.bms.ui.theme.*

@Composable
fun Card(
    modifier: Modifier = Modifier,
    accentColor: Color = ColorPrimary,
    accentTop: Boolean = false,
    content: @Composable () -> Unit
) {
    val borderModifier = if (accentTop) {
        Modifier.background(accentColor).padding(top = 3.dp).background(ColorSurface)
    } else {
        Modifier.background(accentColor).padding(start = 4.dp).background(ColorSurface)
    }

    Box(
        modifier = modifier
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, ColorBorder, RoundedCornerShape(12.dp))
            .then(borderModifier)
    ) {
        content()
    }
}

@Composable
fun CardHeader(content: @Composable RowScope.() -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, ColorBorder)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        content = content
    )
}

@Composable
fun CardBody(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier.padding(16.dp),
        content = content
    )
}

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    unit: String = "",
    sub: String = "",
    color: Color = ColorPrimary,
    icon: ImageVector? = null,
    sparkData: List<Float>? = null
) {
    val maxVal = sparkData?.maxOrNull()?.coerceAtLeast(0.01f) ?: 1f
    Card(modifier = modifier, accentColor = color) {
        Column(Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        label.uppercase(),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = ColorText3,
                        letterSpacing = 0.8.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(value, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, color = color, lineHeight = 34.sp)
                        if (unit.isNotEmpty()) {
                            Text(" $unit", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ColorText4, modifier = Modifier.padding(bottom = 4.dp))
                        }
                    }
                    Text(
                        if (sub.isNotEmpty()) sub else " ", 
                        fontSize = 11.sp, 
                        color = ColorText4, 
                        fontWeight = FontWeight.SemiBold, 
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                if (icon != null) {
                    Box(
                        modifier = Modifier
                            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(22.dp))
                    }
                }
            }
            if (sparkData != null && sparkData.size > 2) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(28.dp)
                        .padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    val recentData = sparkData.takeLast(20)
                    recentData.forEachIndexed { index, v ->
                        val heightPct = (v / maxVal).coerceIn(0f, 1f)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight(heightPct.coerceAtLeast(0.1f))
                                .clip(RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp))
                                .background(if (index == recentData.lastIndex) color else color.copy(alpha = 0.55f))
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SectionTitle(title: String, sub: String = "", badge: String = "", badgeColor: Color = ColorPrimary) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 20.dp, bottom = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom
    ) {
        Column {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = ColorText, letterSpacing = 0.2.sp)
            if (sub.isNotEmpty()) {
                Text(sub, fontSize = 11.sp, color = ColorText4, modifier = Modifier.padding(top = 2.dp))
            }
        }
        if (badge.isNotEmpty()) {
            Badge(label = badge, color = badgeColor)
        }
    }
}

@Composable
fun Badge(label: String, color: Color = ColorPrimary, dot: Boolean = false) {
    Row(
        modifier = Modifier
            .border(1.dp, color.copy(alpha = 0.55f), CircleShape)
            .background(color.copy(alpha = 0.18f), CircleShape)
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        if (dot) {
            Box(Modifier.size(6.dp).background(color, CircleShape))
        }
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = color, letterSpacing = 0.3.sp)
    }
}

@Composable
fun SafetyBanner(status: String, message: String) {
    val cfg = when (status) {
        "Healthy" -> Triple(ColorGreen, ColorGreenBg, Icons.Default.CheckCircle)
        "Warning" -> Triple(ColorAmber, ColorAmberBg, Icons.Default.Warning)
        "Critical" -> Triple(ColorRed, ColorRedBg, Icons.Default.Error)
        else -> Triple(ColorText4, ColorSurface3, Icons.Default.Help)
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
            .border(1.dp, cfg.first.copy(alpha = 0.3f), RoundedCornerShape(24.dp))
            .background(cfg.second, RoundedCornerShape(24.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(cfg.first.copy(alpha = 0.22f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(cfg.third, contentDescription = null, tint = cfg.first, modifier = Modifier.size(22.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text("$status — System Status", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = cfg.first)
            if (message.isNotEmpty()) {
                Text(message, fontSize = 12.sp, color = cfg.first, lineHeight = 16.sp, modifier = Modifier.padding(top = 2.dp))
            }
        }
    }
}

@Composable
fun ProgressBar(value: Float, color: Color = ColorPrimary, height: Dp = 6.dp) {
    val pct = value.coerceIn(0f, 100f) / 100f
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(height)
            .clip(CircleShape)
            .border(1.dp, ColorBorder, CircleShape)
            .background(ColorSurface3)
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(pct)
                .background(color)
        )
    }
}

@Composable
fun InfoRow(label: String, value: String, last: Boolean = false) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, fontSize = 12.sp, color = ColorText4)
            Text(value, fontSize = 13.sp, color = ColorText2, fontWeight = FontWeight.Bold)
        }
        if (!last) {
            androidx.compose.material3.HorizontalDivider(color = ColorBorder, thickness = 1.dp)
        }
    }
}
