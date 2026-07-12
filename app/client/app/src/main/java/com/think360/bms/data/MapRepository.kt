package com.think360.bms.data

import com.google.android.gms.maps.model.LatLng
import com.think360.bms.ui.screens.Place
import com.think360.bms.ui.screens.PlaceCategory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlin.math.*
import kotlin.random.Random

object MapRepository {
    
    // We are no longer using the Google API keys to avoid billing issues.
    // We dynamically generate places around the user's REAL GPS location!

    suspend fun fetchNearbyPlaces(location: LatLng, category: PlaceCategory): List<Place> = withContext(Dispatchers.IO) {
        // Simulate network delay
        delay(600)
        
        val places = mutableListOf<Place>()
        
        val names = when (category) {
            PlaceCategory.CHARGERS -> listOf("Zeon Fast Charge", "Tata Power EZ", "Jio-bp pulse", "Relux Electric", "ChargeZone Fast")
            PlaceCategory.DINE -> listOf("Local Bistro", "The Spice Route", "Downtown Diner", "Vegan Corner", "Seafood Grill")
            PlaceCategory.COFFEE -> listOf("Morning Brew", "The Roastery", "City Cafe", "Espresso Express", "Latte Lounge")
            PlaceCategory.PARKS -> listOf("Central Park", "Greenway Trail", "Riverside Park", "Botanical Gardens", "City Square Park")
        }
        
        val descriptions = when (category) {
            PlaceCategory.CHARGERS -> listOf("Level 3 DCFC", "Public Parking", "Near Highway", "24/7 Access", "Solar Powered")
            PlaceCategory.DINE -> listOf("Dine-in • Takeaway", "Highly Rated", "Casual Dining", "Family Friendly", "Fine Dining")
            PlaceCategory.COFFEE -> listOf("Free WiFi", "Artisan Pastries", "Drive-thru available", "Cozy atmosphere", "Specialty Roasts")
            PlaceCategory.PARKS -> listOf("Walking trails", "Dog friendly", "Playground", "Scenic views", "Picnic area")
        }

        // Generate 5 random places near the actual user location
        for (i in 0..4) {
            // Offset location randomly by +/- 0.05 degrees (roughly a few km)
            val latOffset = (Random.nextDouble() - 0.5) * 0.05
            val lngOffset = (Random.nextDouble() - 0.5) * 0.05
            
            val destLocation = LatLng(location.latitude + latOffset, location.longitude + lngOffset)
            val distanceKm = calculateDistance(location, destLocation)
            
            places.add(
                Place(
                    id = "mock_${category.name}_$i",
                    category = category,
                    name = names[i],
                    location = destLocation,
                    distance = String.format("%.1f km", distanceKm),
                    rating = String.format("%.1f★", Random.nextDouble(3.8, 4.9)),
                    routePoints = emptyList(),
                    isAvailable = Random.nextBoolean(),
                    powerKw = if (category == PlaceCategory.CHARGERS) listOf(50, 60, 120, 150, 200).random() else 0,
                    description = descriptions[i]
                )
            )
        }
        
        places.sortedBy { it.distance.replace(" km", "").toDouble() }
    }

    suspend fun fetchRoute(origin: LatLng, destination: LatLng): RouteInfo? = withContext(Dispatchers.IO) {
        // Simulate network delay
        delay(400)
        
        val distanceKm = calculateDistance(origin, destination)
        
        // Assume an average driving speed of 40 km/h in a city
        val durationHours = distanceKm / 40.0
        val durationMins = max(1, (durationHours * 60).toInt())
        
        // Generate a mock polyline that curves slightly to simulate a road
        val midLat = (origin.latitude + destination.latitude) / 2.0 + 0.005
        val midLng = (origin.longitude + destination.longitude) / 2.0 - 0.005
        
        val points = listOf(origin, LatLng(midLat, midLng), destination)
        
        RouteInfo(
            points = points,
            distanceText = String.format("%.1f km", distanceKm),
            distanceKm = distanceKm,
            etaText = "$durationMins min"
        )
    }

    // Haversine formula for straight line distance
    private fun calculateDistance(loc1: LatLng, loc2: LatLng): Double {
        val R = 6371.0 // Earth's radius in km
        val dLat = Math.toRadians(loc2.latitude - loc1.latitude)
        val dLon = Math.toRadians(loc2.longitude - loc1.longitude)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(loc1.latitude)) * cos(Math.toRadians(loc2.latitude)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }
}

data class RouteInfo(
    val points: List<LatLng>,
    val distanceText: String,
    val distanceKm: Double,
    val etaText: String
)
