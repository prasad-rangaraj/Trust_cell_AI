import 'dotenv/config'; // trigger nodemon restart!
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mqtt from 'mqtt';
import path from 'path';

import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

import prisma from './services/prisma.service.js';
import { simulatedRelays } from './simulator.js';


// ─── App Setup ────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
];

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── API Routes ───────────────────────────────────────────────
app.use(express.static(path.join(process.cwd(), 'public'))); // Serve 3D assets to mobile
app.use('/api', apiRoutes);

// ─── Expose MQTT client to route controllers ──────────────────
// mqttClient is defined further below but Node module caching
// means app.get('mqttClient') will resolve at request-time,
// after mqttClient is initialised.
// We set it after the mqtt.connect() call instead (see below).

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);
// ─── Socket.io ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

// ─── MQTT Subscriber ──────────────────────────────────────────
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC_LIVE = 'battery/live';
const MQTT_TOPIC_TERM = 'battery/terminal';

let lastStatus = 'Healthy';
let lastMqttTimestamp = 0;
let lastDbWriteTime = 0;
let lastTerminalData = { temp1: 0, temp2: 0, vibration: 0, co: 0 };

console.log(`[MQTT] Connecting to broker: ${MQTT_BROKER}`);
const mqttClient = mqtt.connect(MQTT_BROKER);

// ← Attach after construction so controllers can publish commands
app.set('mqttClient', mqttClient);

mqttClient.on('connect', () => {
  console.log(`[MQTT] Connected to broker. Subscribing to topics: ${MQTT_TOPIC_LIVE}, ${MQTT_TOPIC_TERM}`);
  mqttClient.subscribe([MQTT_TOPIC_LIVE, MQTT_TOPIC_TERM]);
});

mqttClient.on('message', async (topic, message) => {
  try {
    const msgStr = message.toString();

    if (topic === MQTT_TOPIC_TERM) {
      console.log(`[MQTT TERMINAL] ${msgStr}`);
      const t1Match = msgStr.match(/T1:\s*([\d.]+)C/);
      const t2Match = msgStr.match(/T2:\s*([\d.]+)C/);
      const vibMatch = msgStr.match(/VIB:\s*([\d.]+)G/);
      const coMatch = msgStr.match(/CO:\s*([\d.]+)PPM/);
      
      if (t1Match) lastTerminalData.temp1 = parseFloat(t1Match[1]);
      if (t2Match) lastTerminalData.temp2 = parseFloat(t2Match[1]);
      if (vibMatch) lastTerminalData.vibration = parseFloat(vibMatch[1]);
      if (coMatch) lastTerminalData.co = parseFloat(coMatch[1]);

      io.emit('terminal:log', msgStr);
      return;
    }

    if (topic === MQTT_TOPIC_LIVE) {
      lastMqttTimestamp = Date.now();
      const rawData = JSON.parse(msgStr);
      console.log(`[MQTT LIVE]`, rawData);

      const data = {
        cell1: parseFloat(rawData.cell1 ?? 0),
        cell2: parseFloat(rawData.cell2 ?? 0),
        cell3: parseFloat(rawData.cell3 ?? 0),
        cell4: parseFloat(rawData.cell4 ?? 0),
        current: parseFloat(rawData.current ?? 0),
        temp1: parseFloat(rawData.temp1 ?? (lastTerminalData.temp1 || rawData.temperature || 0)),
        temp2: parseFloat(rawData.temp2 ?? (lastTerminalData.temp2 || rawData.temperature || 0)),
        gas: parseFloat(rawData.gas ?? (lastTerminalData.co || 0)),
        vibration: parseFloat(rawData.vibration ?? (lastTerminalData.vibration || 0)),
        batteryHealth: parseFloat(rawData.batteryHealth ?? 100),
        anomalyScore: parseFloat(rawData.anomalyScore ?? 0),
        status: rawData.status || 'Healthy',
        relay: rawData.relay || 'CONNECTED',
        spn: rawData.spn !== undefined ? parseInt(rawData.spn) : null,
        fmi: rawData.fmi !== undefined ? parseInt(rawData.fmi) : null,
        activeCells: rawData.activeCells !== undefined ? parseInt(rawData.activeCells) : 4,
        soc: rawData.soc !== undefined ? parseFloat(rawData.soc) : 100,
        soh: rawData.soh !== undefined ? parseFloat(rawData.soh) : 100,
        chargeStatus: rawData.chargeStatus || 'Idle',
        mlOp: rawData.mlOp || 'NORMAL',
        batteryScore: rawData.batteryScore !== undefined ? parseFloat(rawData.batteryScore) : 100,
        relayCooling: rawData.relayCooling || simulatedRelays.cooling,
        relayIsolation: rawData.relayIsolation || simulatedRelays.isolation,
        relayCell1: rawData.relayCell1 || simulatedRelays.cell1,
        relayCell2: rawData.relayCell2 || simulatedRelays.cell2,
        relayCell3: rawData.relayCell3 || simulatedRelays.cell3,
        relayCell4: rawData.relayCell4 || simulatedRelays.cell4,
      };

      // Calculate health & anomaly locally if not provided
      if (rawData.batteryHealth === undefined) {
        const avgCell = (data.cell1 + data.cell2 + data.cell3 + data.cell4) / 4;
        const cellMin = Math.min(data.cell1, data.cell2, data.cell3, data.cell4);
        const cellMax = Math.max(data.cell1, data.cell2, data.cell3, data.cell4);
        const imbalance = cellMax - cellMin;
        const voltagePct = Math.max(0, Math.min(100, ((avgCell - 3.0) / (4.2 - 3.0)) * 100));
        const imbalancePenalty = Math.max(0, Math.min(30, imbalance * 100));
        const tempPenalty = (data.temp1 > 50 || data.temp2 > 50) ? (Math.max(data.temp1, data.temp2) - 50) * 0.5 : 0;
        data.batteryHealth = parseFloat(Math.max(0, Math.min(100, voltagePct - imbalancePenalty - tempPenalty)).toFixed(1));
      }

      if (rawData.anomalyScore === undefined) {
        let score = 0;
        if (data.temp1 > 45 || data.temp2 > 45) score += (Math.max(data.temp1, data.temp2) - 45) * 2.5;
        if (data.gas > 150) score += (data.gas - 150) * 0.15;
        if (data.vibration > 1.5) score += (data.vibration - 1.5) * 15;
        const cellMin = Math.min(data.cell1, data.cell2, data.cell3, data.cell4);
        const cellMax = Math.max(data.cell1, data.cell2, data.cell3, data.cell4);
        const imbalance = cellMax - cellMin;
        if (imbalance > 0.1) score += imbalance * 100;
        data.anomalyScore = parseFloat(Math.max(0, Math.min(100, score)).toFixed(1));
      }

      if (!rawData.status) {
        if (data.anomalyScore > 50 || data.temp1 > 60 || data.temp2 > 60 || data.gas > 400 || data.vibration > 3.0) {
          data.status = 'Critical';
        } else if (data.anomalyScore > 15 || data.temp1 > 45 || data.temp2 > 45 || data.gas > 200 || data.vibration > 1.5) {
          data.status = 'Warning';
        } else {
          data.status = 'Healthy';
        }
      }

      // ── Only persist critical events (Warning / Critical) ──────────────
      // Healthy readings flow over WebSocket but are never written to DB.
      // battery_readings = full snapshot of the critical moment
      // fault_logs       = status transition history
      const isCriticalEvent = data.status !== 'Healthy';

      if (isCriticalEvent) {
        const now = Date.now();
        if (now - lastDbWriteTime > 5000) {
          try {
            await prisma.batteryReading.create({ data });
            console.log(`[DB] Critical snapshot saved → ${data.status} | Score: ${data.anomalyScore}% | Max Temp: ${Math.max(data.temp1, data.temp2)}°C`);
            lastDbWriteTime = now;
          } catch (err) {
            console.warn(`[DB] Write failed: ${err.message}`);
          }
        }
      }

      // Log every status transition regardless of direction
      if (data.status !== lastStatus) {
        try {
          await prisma.faultLog.create({
            data: {
              faultType: 'Status Change (HW)',
              severity: data.status,
              actionTaken: data.status === 'Critical'
                ? 'CRITICAL: Hardware Relay Isolated'
                : data.status === 'Warning'
                  ? 'Warning: Hardware alert generated'
                  : 'System returned to normal',
              value: `Score: ${data.anomalyScore.toFixed(1)}%`,
            },
          });
          console.log(`[DB] Status transition: ${lastStatus} → ${data.status}`);
        } catch (err) {
          console.warn(`[DB] Fault log failed: ${err.message}`);
        }
        lastStatus = data.status;
      }

      io.emit('battery:update', data);
    }
  } catch (err) {
    console.error('[MQTT] Parsing error:', err.message);
  }
});



// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  CAT® Edge Server v2.0               ║');
  console.log(`║  HTTP  → http://localhost:${PORT}       ║`);
  console.log('║  WS    → Socket.io ready             ║');
  console.log('╚══════════════════════════════════════╝\n');

});
