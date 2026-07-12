package com.think360.bms.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ── Light Mode Consumer Surfaces ──────────────────────────────────────────────
val ColorBg       = Color(0xFFF8FAFC)   // Off-white / light slate base
val ColorSurface  = Color(0xFFFFFFFF)   // Pure white cards & panels
val ColorSurface2 = Color(0xFFEFF6FF)   // Very light blue for elevated/active cards
val ColorSurface3 = Color(0xFFDBEAFE)   // Light blue for input fields / modals

// ── Borders ──────────────────────────────────────────────────────────────────
val ColorBorder  = Color(0xFFE2E8F0)    // Light slate border
val ColorBorder2 = Color(0xFFBFDBFE)    // Light blue border

// ── Text ─────────────────────────────────────────────────────────────────────
val ColorText  = Color(0xFF0F172A)     // Near black for primary headings
val ColorText2 = Color(0xFF1E293B)     // Dark slate for body text
val ColorText3 = Color(0xFF475569)     // Medium slate for sub-labels
val ColorText4 = Color(0xFF94A3B8)     // Light slate for placeholders

// ── Brand & Status Colors ─────────────────────────────────────────────────────
val ColorPrimary    = Color(0xFF2563EB)   // Vivid blue accent
val ColorPrimaryBg  = Color(0x1A2563EB)
val ColorGreen      = Color(0xFF16A34A)   // OK / Safe / Charging
val ColorGreenBg    = Color(0x1A16A34A)
val ColorAmber      = Color(0xFFD97706)   // Warnings / mid battery
val ColorAmberBg    = Color(0x1AD97706)
val ColorRed        = Color(0xFFDC2626)   // Critical alerts
val ColorRedBg      = Color(0x1ADC2626)
val ColorPurple     = Color(0xFF7C3AED)   // AI / Safety shield
val ColorPurpleBg   = Color(0x1A7C3AED)

private val LightColorScheme = lightColorScheme(
    primary          = ColorPrimary,
    background       = ColorBg,
    surface          = ColorSurface,
    onPrimary        = Color.White,
    onBackground     = ColorText,
    onSurface        = ColorText,
    surfaceVariant   = ColorSurface2,
    onSurfaceVariant = ColorText3,
)

@Composable
fun Think360Theme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
