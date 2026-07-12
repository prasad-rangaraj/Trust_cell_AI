package com.think360.bms.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.core.content.ContextCompat
import com.think360.bms.ui.theme.*
import com.think360.bms.viewmodel.BmsViewModel
import com.think360.bms.data.MapRepository
import com.think360.bms.data.RouteInfo

import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MapStyleOptions
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.maps.android.compose.*

enum class MapFlowState { IDLE, ROUTE_PLANNING, NAVIGATING }

enum class PlaceCategory { CHARGERS, DINE, COFFEE, PARKS }

data class Place(
    val id: String,
    val category: PlaceCategory,
    val name: String,
    val location: LatLng,
    val distance: String,
    val rating: String,
    val routePoints: List<LatLng>, // Unused now but kept for compatibility
    val isAvailable: Boolean = true,
    val powerKw: Int = 0,
    val description: String = ""
)

@SuppressLint("MissingPermission")
@Composable
fun MapScreen(viewModel: BmsViewModel) {
    val context = LocalContext.current
    val batteryState by viewModel.batteryState.collectAsState()
    val soc = batteryState.soc.toInt().coerceIn(0, 100)
    val rangeKm = (soc * 6.1).toInt() 

    var mapState by remember { mutableStateOf(MapFlowState.IDLE) }
    var selectedPlace by remember { mutableStateOf<Place?>(null) }
    var selectedCategory by remember { mutableStateOf(PlaceCategory.CHARGERS) }
    
    // Live Data States
    var currentPlaces by remember { mutableStateOf<List<Place>>(emptyList()) }
    var currentRoute by remember { mutableStateOf<RouteInfo?>(null) }
    var isLoadingPlaces by remember { mutableStateOf(false) }
    var isLoadingRoute by remember { mutableStateOf(false) }

    // Location State
    var carLocation by remember { mutableStateOf(LatLng(13.0827, 80.2707)) } // Default
    var locationGranted by remember { mutableStateOf(false) }
    
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        locationGranted = isGranted
    }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationGranted = true
        } else {
            launcher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    // Start location updates
    DisposableEffect(locationGranted) {
        var locationCallback: LocationCallback? = null
        if (locationGranted) {
            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000).build()
            locationCallback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    result.lastLocation?.let { loc ->
                        carLocation = LatLng(loc.latitude, loc.longitude)
                    }
                }
            }
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
            // Also get one immediately
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) {
                    carLocation = LatLng(loc.latitude, loc.longitude)
                }
            }
        }
        onDispose {
            locationCallback?.let { fusedLocationClient.removeLocationUpdates(it) }
        }
    }

    // Fetch Places when category or (significantly) location changes
    LaunchedEffect(selectedCategory, locationGranted, carLocation.latitude.toInt()) {
        if (locationGranted) {
            isLoadingPlaces = true
            currentPlaces = MapRepository.fetchNearbyPlaces(carLocation, selectedCategory)
            isLoadingPlaces = false
        }
    }

    // Fetch Route when a place is selected
    LaunchedEffect(selectedPlace) {
        if (selectedPlace != null) {
            isLoadingRoute = true
            currentRoute = MapRepository.fetchRoute(carLocation, selectedPlace!!.location)
            isLoadingRoute = false
        } else {
            currentRoute = null
        }
    }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(carLocation, 13f)
    }

    // Camera Animation Side-Effects
    LaunchedEffect(mapState, selectedPlace, selectedCategory, currentRoute) {
        when (mapState) {
            MapFlowState.IDLE -> {
                cameraPositionState.animate(
                    update = CameraUpdateFactory.newCameraPosition(CameraPosition.Builder().target(carLocation).zoom(13f).tilt(0f).build()),
                    durationMs = 1000
                )
            }
            MapFlowState.ROUTE_PLANNING -> {
                selectedPlace?.let { place ->
                    val builder = LatLngBounds.Builder()
                    builder.include(carLocation)
                    builder.include(place.location)
                    // If route exists, include all points
                    currentRoute?.points?.forEach { builder.include(it) }
                    
                    try {
                        cameraPositionState.animate(
                            update = CameraUpdateFactory.newLatLngBounds(builder.build(), 150),
                            durationMs = 1000
                        )
                    } catch (e: Exception) {
                        // Bounds might be empty or invalid before layout
                    }
                }
            }
            MapFlowState.NAVIGATING -> {
                cameraPositionState.animate(
                    update = CameraUpdateFactory.newCameraPosition(CameraPosition.Builder().target(carLocation).zoom(18f).tilt(60f).bearing(45f).build()),
                    durationMs = 1500
                )
            }
        }
    }

    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val scrollState = rememberScrollState()

    // Calculate dynamic arrival SOC
    val routeDistanceKm = currentRoute?.distanceKm ?: 0.0
    val dynamicArrivalSoc = (soc - (routeDistanceKm / 6.1)).toInt().coerceAtLeast(0)

    val premiumBgBrush = remember {
        Brush.verticalGradient(
            colors = listOf(
                Color(0xFFF8FAFC), // Slate 50
                Color(0xFFEFF6FF), // Blue 50
                Color(0xFFDBEAFE)  // Blue 100
            )
        )
    }

    // Layout
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(premiumBgBrush)
            .run {
                if (mapState != MapFlowState.NAVIGATING) verticalScroll(scrollState) else this
            }
    ) {
        // ── TOP SECTION: Live Google Map ────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(if (mapState == MapFlowState.NAVIGATING) screenHeight else 450.dp)
        ) {
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = locationGranted, compassEnabled = true),
                properties = MapProperties(
                    isTrafficEnabled = mapState == MapFlowState.NAVIGATING, 
                    isMyLocationEnabled = locationGranted
                )
            ) {
                Marker(
                    state = MarkerState(position = carLocation),
                    title = "Your Vehicle",
                    snippet = "$rangeKm km remaining"
                )

                if (mapState == MapFlowState.IDLE) {
                    Circle(
                        center = carLocation,
                        radius = rangeKm * 1000.0, 
                        fillColor = Color(0xFF3B82F6).copy(alpha = 0.1f),
                        strokeColor = Color(0xFF3B82F6).copy(alpha = 0.5f),
                        strokeWidth = 2f
                    )
                }

                currentPlaces.forEach { place ->
                    val isSelected = selectedPlace?.id == place.id
                    val isCharger = place.category == PlaceCategory.CHARGERS
                    Marker(
                        state = MarkerState(position = place.location),
                        title = place.name,
                        snippet = if (isCharger) (if (place.isAvailable) "Available • ${place.powerKw} kW" else "In Use") else place.description,
                        alpha = if (mapState == MapFlowState.IDLE || isSelected) 1f else 0.5f,
                        onClick = {
                            selectedPlace = place
                            mapState = MapFlowState.ROUTE_PLANNING
                            false
                        }
                    )
                }

                if ((mapState == MapFlowState.ROUTE_PLANNING || mapState == MapFlowState.NAVIGATING) && currentRoute != null) {
                    Polyline(points = currentRoute!!.points, color = Color(0xFF3B82F6), width = 12f)
                }
            }
            
            // Overlays on top of the Map
            if (mapState == MapFlowState.IDLE) {
                Box(
                    modifier = Modifier.align(Alignment.TopCenter).fillMaxWidth().statusBarsPadding().padding(horizontal = 24.dp, vertical = 20.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White.copy(alpha=0.85f), RoundedCornerShape(24.dp))
                            .border(1.dp, Color.White.copy(alpha=0.5f), RoundedCornerShape(24.dp))
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.Search, contentDescription = null, tint = Color(0xFF64748B))
                        Spacer(Modifier.width(12.dp))
                        Text("Search destinations...", color = Color(0xFF64748B), fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    }
                }
            } else if (mapState == MapFlowState.NAVIGATING) {
                Box(
                    modifier = Modifier.align(Alignment.TopCenter).fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().background(Color(0xFF16A34A), RoundedCornerShape(16.dp)).padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.TurnRight, contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text("In 800 ft", color = Color.White.copy(alpha=0.8f), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Turn right onto Mount Rd", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }

        // ── BOTTOM SECTION: Dynamic UI ────────────────────────
        AnimatedContent(
            targetState = mapState,
            label = "bottom_ui",
            modifier = Modifier
                .fillMaxWidth()
                .offset(y = if (mapState == MapFlowState.NAVIGATING) 0.dp else (-32).dp)
        ) { state ->
            when (state) {
                MapFlowState.IDLE -> {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(premiumBgBrush, RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
                            .padding(bottom = 32.dp)
                    ) {
                        // Drag Handle indicator
                        Box(modifier = Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 12.dp), contentAlignment = Alignment.Center) {
                            Box(modifier = Modifier.width(40.dp).height(4.dp).background(Color(0xFFCBD5E1), RoundedCornerShape(2.dp)))
                        }
                        
                        Spacer(Modifier.height(8.dp))
                        
                        Text("Live Directory", color = ColorText, fontSize = 20.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 24.dp))
                        Text("Powered by Google Places API", color = ColorText4, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 24.dp).padding(top = 4.dp))
                        
                        Spacer(Modifier.height(20.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 20.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CategoryChip("Chargers", Icons.Filled.EvStation, selectedCategory == PlaceCategory.CHARGERS) { selectedCategory = PlaceCategory.CHARGERS }
                            CategoryChip("Dine-In", Icons.Filled.Restaurant, selectedCategory == PlaceCategory.DINE) { selectedCategory = PlaceCategory.DINE }
                            CategoryChip("Coffee", Icons.Filled.LocalCafe, selectedCategory == PlaceCategory.COFFEE) { selectedCategory = PlaceCategory.COFFEE }
                            CategoryChip("Parks", Icons.Filled.Park, selectedCategory == PlaceCategory.PARKS) { selectedCategory = PlaceCategory.PARKS }
                        }
                        
                        Spacer(Modifier.height(24.dp))
                        
                        if (isLoadingPlaces) {
                            Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Color(0xFF3B82F6))
                            }
                        } else {
                            // Results List
                            Column(modifier = Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                currentPlaces.forEach { place ->
                                    PlaceResultCard(
                                        place = place,
                                        onClick = {
                                            selectedPlace = place
                                            mapState = MapFlowState.ROUTE_PLANNING
                                        }
                                    )
                                }
                            }
                        }
                        
                        Spacer(Modifier.height(32.dp))
                        Divider(color = ColorBorder)
                        Spacer(Modifier.height(24.dp))
                        
                        Text("Environmental Impact", color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ImpactCard(Icons.Filled.Terrain, "Mountain Pass", "-50 km", Color(0xFFD97706), Color(0xFFFEF3C7))
                            ImpactCard(Icons.Filled.Thermostat, "Optimal Temp", "+12 km", ColorGreen, ColorGreenBg)
                        }
                    }
                }
                
                MapFlowState.ROUTE_PLANNING -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)).padding(24.dp)
                    ) {
                        // Drag Handle indicator
                        Box(modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp), contentAlignment = Alignment.Center) {
                            Box(modifier = Modifier.width(40.dp).height(4.dp).background(Color(0xFFCBD5E1), RoundedCornerShape(2.dp)))
                        }
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(selectedPlace?.name ?: "Destination", color = ColorText, fontSize = 24.sp, fontWeight = FontWeight.Black)
                            IconButton(onClick = { mapState = MapFlowState.IDLE; selectedPlace = null }) {
                                Icon(Icons.Filled.Close, contentDescription = "Close", tint = ColorText4)
                            }
                        }
                        
                        if (selectedPlace?.category == PlaceCategory.CHARGERS) {
                            Text("${selectedPlace?.powerKw} kW Fast Charging", color = ColorGreen, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        } else {
                            Text(selectedPlace?.description ?: "", color = ColorText4, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                        }
                        
                        Spacer(Modifier.height(24.dp))
                        
                        if (isLoadingRoute) {
                            Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Color(0xFF3B82F6))
                            }
                        } else {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                RouteStat(Icons.Filled.Schedule, "ETA", currentRoute?.etaText ?: "N/A")
                                RouteStat(Icons.Filled.Route, "Distance", currentRoute?.distanceText ?: "N/A")
                                RouteStat(Icons.Filled.BatteryChargingFull, "Arrival SOC", "$dynamicArrivalSoc%", Color(0xFFD97706))
                            }
                            
                            Spacer(Modifier.height(32.dp))
                            
                            Button(
                                onClick = { mapState = MapFlowState.NAVIGATING },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                            ) {
                                Icon(Icons.Filled.Navigation, contentDescription = null, tint = Color.White)
                                Spacer(Modifier.width(8.dp))
                                Text("Start Trip", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                
                MapFlowState.NAVIGATING -> {
                    Row(
                        modifier = Modifier.fillMaxWidth().background(ColorSurface).padding(horizontal = 24.dp, vertical = 20.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(currentRoute?.etaText ?: "14 min", color = ColorGreen, fontSize = 24.sp, fontWeight = FontWeight.Black)
                            Text("${currentRoute?.distanceText} • Arrival: --:--", color = ColorText4, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                        }
                        
                        Button(
                            onClick = { mapState = MapFlowState.IDLE; selectedPlace = null; currentRoute = null },
                            shape = RoundedCornerShape(24.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                        ) {
                            Text("End", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ── Helpers ──
@Composable
private fun RouteStat(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, valueColor: Color = ColorText) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = null, tint = ColorText4, modifier = Modifier.size(24.dp))
        Spacer(Modifier.height(8.dp))
        Text(value, color = valueColor, fontSize = 18.sp, fontWeight = FontWeight.Black)
        Text(label, color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun ImpactCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, impact: String, color: Color, bgColor: Color) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = ColorBg),
        border = BorderStroke(1.dp, ColorBorder)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(modifier = Modifier.size(40.dp).background(bgColor, CircleShape), contentAlignment = Alignment.Center) {
                Icon(icon, contentDescription = null, tint = color)
            }
            Column {
                Text(title, color = ColorText3, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(impact, color = color, fontSize = 16.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun CategoryChip(text: String, icon: androidx.compose.ui.graphics.vector.ImageVector, isSelected: Boolean, onClick: () -> Unit) {
    val bgColor by animateColorAsState(if (isSelected) ColorText else ColorBg)
    val contentColor by animateColorAsState(if (isSelected) Color.White else ColorText4)
    val borderColor by animateColorAsState(if (isSelected) Color.Transparent else ColorBorder)
    
    Row(
        modifier = Modifier
            .background(bgColor, RoundedCornerShape(24.dp))
            .border(1.dp, borderColor, RoundedCornerShape(24.dp))
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(16.dp))
        Text(text, color = contentColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PlaceResultCard(place: Place, onClick: () -> Unit) {
    val isCharger = place.category == PlaceCategory.CHARGERS
    
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = ColorBg),
        border = BorderStroke(1.dp, ColorBorder)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(place.name, color = ColorText, fontSize = 16.sp, fontWeight = FontWeight.Black, maxLines = 1)
                    if (isCharger) {
                        Text("${place.powerKw} kW Fast Charger", color = Color(0xFF3B82F6), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Text(place.description, color = ColorText4, fontSize = 13.sp, fontWeight = FontWeight.Medium, maxLines = 1)
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(place.distance, color = ColorText4, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            
            Spacer(Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(16.dp))
                    Text(place.rating, color = ColorText3, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                
                if (isCharger) {
                    val statusColor = if (place.isAvailable) ColorGreen else ColorAmber
                    val statusText = if (place.isAvailable) "Available" else "In Use"
                    val statusBg = if (place.isAvailable) ColorGreenBg else Color(0xFFFEF3C7)
                    
                    Box(modifier = Modifier.background(statusBg, RoundedCornerShape(6.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                        Text(statusText, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}
