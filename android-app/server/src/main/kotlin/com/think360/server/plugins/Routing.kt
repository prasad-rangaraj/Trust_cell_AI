package com.think360.server.plugins

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.http.HttpStatusCode
import kotlinx.serialization.Serializable

// Temporary mock models for development
@Serializable
data class Place(
    val id: String,
    val category: String,
    val name: String,
    val distance: String,
    val rating: String,
    val isAvailable: Boolean,
    val description: String
)

@Serializable
data class UserProfile(
    val userName: String,
    val vehicleName: String,
    val selectedAvatar: Int,
    val useMetric: Boolean,
    val useCelsius: Boolean,
    val memorySeats: Boolean,
    val keyFobLink: Boolean,
    val selectedPersona: String,
    val anxietyBuffer: Float,
    val routineMorning: Boolean,
    val routineLowBattery: Boolean,
    val routineHome: Boolean,
    val biometricLock: Boolean
)

// In-memory store until Database is hooked up
var currentProfile = UserProfile(
    userName = "Alex Driver",
    vehicleName = "EVGA-0001",
    selectedAvatar = 0,
    useMetric = true,
    useCelsius = true,
    memorySeats = true,
    keyFobLink = true,
    selectedPersona = "Balanced",
    anxietyBuffer = 20f,
    routineMorning = true,
    routineLowBattery = false,
    routineHome = true,
    biometricLock = true
)

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Think360 Edge - Mobile Kotlin Backend")
        }

        // Map Places Endpoint
        get("/api/places") {
            val category = call.request.queryParameters["category"] ?: "CHARGERS"
            // For now, return mock data from the backend instead of generating it on the frontend
            val places = listOf(
                Place("1", category, "Backend Fast Charge", "1.2 km", "4.5★", true, "150kW DC"),
                Place("2", category, "Backend Slow Charge", "2.5 km", "4.0★", false, "50kW AC")
            )
            call.respond(places)
        }

        // Profile & Settings Endpoints
        get("/api/profile") {
            call.respond(currentProfile)
        }

        post("/api/profile") {
            try {
                val profile = call.receive<UserProfile>()
                currentProfile = profile
                call.respond(HttpStatusCode.OK, mapOf("status" to "success"))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
            }
        }
    }
}
