package com.think360.bms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.*
import com.think360.bms.ui.screens.*
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel
import com.think360.bms.ui.components.AlertOverlay


class MainActivity : ComponentActivity() {
    private val viewModel: BmsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request RECORD_AUDIO and POST_NOTIFICATIONS runtime permissions on startup
        val requestPermissionsLauncher = registerForActivityResult(
            androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val audioGranted = permissions[android.Manifest.permission.RECORD_AUDIO] ?: false
            val notifyGranted = permissions[android.Manifest.permission.POST_NOTIFICATIONS] ?: false
            android.util.Log.i("MainActivity", "Permissions - Audio: $audioGranted, Notification: $notifyGranted")
        }
        val requiredPermissions = mutableListOf(android.Manifest.permission.RECORD_AUDIO)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            requiredPermissions.add(android.Manifest.permission.POST_NOTIFICATIONS)
        }
        requestPermissionsLauncher.launch(requiredPermissions.toTypedArray())

        enableEdgeToEdge()
        setContent {
            Think360Theme {
                EVGuardianApp(viewModel)
            }
        }
    }
}

// ── Bottom Nav Tabs ───────────────────────────────────────────────────────────
sealed class Tab(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    object Home     : Tab("home",     "Home",     Icons.Filled.Home,         Icons.Outlined.Home)
    object Safety   : Tab("safety",   "Safety",   Icons.Filled.Shield,       Icons.Outlined.Shield)
    object Charging : Tab("charging", "Charging", Icons.Filled.ElectricBolt, Icons.Outlined.ElectricBolt)
    object Map      : Tab("map",      "Map",      Icons.Filled.Map,          Icons.Outlined.Map)
    object Settings : Tab("settings", "Settings", Icons.Filled.Settings,     Icons.Outlined.Settings)
}

val TABS = listOf(Tab.Home, Tab.Safety, Tab.Charging, Tab.Map, Tab.Settings)

@Composable
fun EVGuardianApp(viewModel: BmsViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Tab.Home.route

    val showBottomBar = TABS.any { it.route == currentRoute }

    Scaffold(
        containerColor = ColorBg,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = ColorSurface,
                    tonalElevation = 0.dp
                ) {
                TABS.forEach { tab ->
                    val selected = currentRoute == tab.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState    = true
                            }
                        },
                        icon = {
                            Icon(
                                if (selected) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.label
                            )
                        },
                        label = {
                            Text(
                                tab.label,
                                fontSize = 11.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor    = ColorPrimary,
                            selectedTextColor    = ColorPrimary,
                            unselectedIconColor  = ColorText4,
                            unselectedTextColor  = ColorText4,
                            indicatorColor       = ColorPrimaryBg
                        )
                    )
                }
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            NavHost(
                navController    = navController,
                startDestination = Tab.Home.route,
                modifier         = Modifier.padding(bottom = innerPadding.calculateBottomPadding()).fillMaxSize()
            ) {
                composable(Tab.Home.route)     { HomeScreen(viewModel, navController) }
                composable(Tab.Safety.route)   { SafetyScreen(viewModel) }
                composable(Tab.Charging.route) { ChargingScreen(viewModel) }
                composable(Tab.Map.route)      { MapScreen(viewModel) }
                composable(Tab.Settings.route) { SettingsScreen2(viewModel, navController) }
                composable("profile")          { ProfileScreen(navController) }
                composable("assistant")        { AssistantScreen(viewModel, navController) }
            }

            // Sarvam Edge Alert Overlay UI
            AlertOverlay(
                controller = viewModel.voiceAlertController,
                sarvamEdgeManager = viewModel.sarvamEdgeManager,
                onSimulateDriverVoice = { text ->
                    viewModel.sarvamEdgeManager.sttManager.simulateDriverResponse(text)
                }
            )

        }
    }
}

