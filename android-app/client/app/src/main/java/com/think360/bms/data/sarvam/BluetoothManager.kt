package com.think360.bms.data.sarvam

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.InputStream
import java.util.UUID
import okhttp3.*
import okhttp3.WebSocket
import okhttp3.WebSocketListener

private const val TAG = "BluetoothManager"
private val MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // Standard SerialPortService ID

class BluetoothManager(private val context: Context, private val scope: CoroutineScope) {

    private val httpClient = OkHttpClient()
    private var cloudWebSocket: WebSocket? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _rawPackets = MutableSharedFlow<String>()
    val rawPackets: SharedFlow<String> = _rawPackets.asSharedFlow()

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var bluetoothSocket: BluetoothSocket? = null
    private var inputStream: InputStream? = null
    private var isListening = false

    fun startConnection(deviceAddress: String) {
        if (bluetoothAdapter == null) {
            Log.e(TAG, "Bluetooth not supported on this device")
            return
        }
        if (!bluetoothAdapter.isEnabled) {
            Log.w(TAG, "Bluetooth is disabled")
            return
        }

        scope.launch(Dispatchers.IO) {
            try {
                val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(deviceAddress)
                _isConnected.value = false
                Log.d(TAG, "Attempting Bluetooth connection to ${device.name ?: deviceAddress}")

                // Standard insecure RFCOMM socket
                bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(MY_UUID)
                bluetoothSocket?.connect()
                _isConnected.value = true
                inputStream = bluetoothSocket?.inputStream
                Log.d(TAG, "Bluetooth connected successfully")

                listenForPackets()
            } catch (e: Exception) {
                Log.e(TAG, "Bluetooth connection failed: ${e.message}", e)
                closeConnection()
            }
        }
    }

    private fun listenForPackets() {
        val stream = inputStream ?: return
        isListening = true
        val buffer = ByteArray(1024)
        var bytes: Int

        scope.launch(Dispatchers.IO) {
            while (isListening) {
                try {
                    bytes = stream.read(buffer)
                    val readMessage = String(buffer, 0, bytes)
                    Log.d(TAG, "Bluetooth packet read: $readMessage")
                    _rawPackets.emit(readMessage)
                } catch (e: Exception) {
                    Log.e(TAG, "Error reading from Bluetooth input stream: ${e.message}")
                    closeConnection()
                    break
                }
            }
        }
    }

    fun closeConnection() {
        isListening = false
        _isConnected.value = false
        try {
            inputStream?.close()
            bluetoothSocket?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing Bluetooth connection: ${e.message}")
        }
        inputStream = null
        bluetoothSocket = null
        Log.d(TAG, "Bluetooth connection closed")
    }

    /**
     * Helper to mock/simulate incoming JSON packets during hackathon testing.
     */
    fun simulateReceive(json: String) {
        scope.launch {
            Log.d(TAG, "Simulating received Bluetooth packet: $json")
            _rawPackets.emit(json)
        }
    }

    /**
     * Start listening to the Cloud Ktor Backend for alerts as a fallback to Bluetooth.
     */
    fun startCloudListener(wssUrl: String) {
        Log.d(TAG, "Connecting to Cloud WebSocket: $wssUrl")
        val request = Request.Builder().url(wssUrl).build()
        cloudWebSocket = httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "Cloud WebSocket Connected")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Cloud alert received: $text")
                // Inject cloud alert directly into the Bluetooth UI flow!
                scope.launch { _rawPackets.emit(text) }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Cloud WebSocket Error: ${t.message}")
            }
        })
    }
}
