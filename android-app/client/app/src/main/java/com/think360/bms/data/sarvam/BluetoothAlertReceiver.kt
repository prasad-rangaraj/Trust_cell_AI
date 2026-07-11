package com.think360.bms.data.sarvam

import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

private const val TAG = "BluetoothAlertReceiver"

class BluetoothAlertReceiver(
    private val bluetoothManager: BluetoothManager,
    private val scope: CoroutineScope
) {
    private val gson = Gson()

    private val _alertEvents = MutableSharedFlow<AlertEvent>()
    val alertEvents: SharedFlow<AlertEvent> = _alertEvents.asSharedFlow()

    init {
        scope.launch {
            bluetoothManager.rawPackets.collect { packet ->
                try {
                    val trimmed = packet.trim()
                    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                        val event = gson.fromJson(trimmed, AlertEvent::class.java)
                        Log.d(TAG, "Successfully deserialized event: $event")
                        _alertEvents.emit(event)
                    } else {
                        Log.w(TAG, "Ignored invalid packet structure: $packet")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to deserialize JSON packet: $packet", e)
                }
            }
        }
    }
}
