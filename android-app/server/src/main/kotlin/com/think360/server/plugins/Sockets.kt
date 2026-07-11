package com.think360.server.plugins

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import java.time.Duration
import kotlinx.coroutines.channels.ClosedReceiveChannelException

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(15)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    routing {
        webSocket("/ws/telemetry") {
            // A simple echo for now, later we'll attach this to the MQTT flow
            send("Connected to telemetry stream")
            try {
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        send(Frame.Text("Server received: $text"))
                    }
                }
            } catch (e: ClosedReceiveChannelException) {
                println("Client disconnected")
            } catch (e: Throwable) {
                println("WebSocket error: ${e.message}")
            }
        }
    }
}
