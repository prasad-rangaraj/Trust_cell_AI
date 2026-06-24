import 'dotenv/config'; // trigger nodemon restart!
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mqtt from 'mqtt';

import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { generateReading } from './simulator.js';
import prisma from './services/prisma.service.js';


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
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────
app.use('/api', apiRoutes);

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

console.log(`[MQTT] Connecting to broker: ${MQTT_BROKER}`);
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log(`[MQTT] Connected to broker. Subscribing to topics: ${MQTT_TOPIC_LIVE}, ${MQTT_TOPIC_TERM}`);
  mqttClient.subscribe([MQTT_TOPIC_LIVE, MQTT_TOPIC_TERM]);
});

mqttClient.on('message', async (topic, message) => {
  try {
    const msgStr = message.toString();

    if (topic === MQTT_TOPIC_TERM) {
      console.log(`[MQTT TERMINAL] ${msgStr}`);
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
        temp1: parseFloat(rawData.temp1 ?? 0),
        temp2: parseFloat(rawData.temp2 ?? 0),
        gas: parseFloat(rawData.gas ?? 0),
        vibration: parseFloat(rawData.vibration ?? 0.5),
        batteryHealth: parseFloat(rawData.batteryHealth ?? 100),
        anomalyScore: parseFloat(rawData.anomalyScore ?? 0),
        status: rawData.status || 'Healthy',
        relay: rawData.relay || 'CONNECTED',
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
        try {
          await prisma.batteryReading.create({ data });
          console.log(`[DB] Critical snapshot saved → ${data.status} | Score: ${data.anomalyScore}% | Max Temp: ${Math.max(data.temp1, data.temp2)}°C`);
        } catch (err) {
          console.warn(`[DB] Write failed: ${err.message}`);
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

// ─── Simulation Loop (Fallback) ──────────────────────────────
async function simulationTick() {
  // If we received an MQTT reading within the last 10 seconds, skip the simulator
  if (Date.now() - lastMqttTimestamp < 10000) {
    return;
  }

  const data = generateReading();

  try {
    await prisma.batteryReading.create({ data });

    if (data.status !== 'Healthy' || data.anomalyScore > 20) {
      await prisma.anomalyLog.create({
        data: {
          anomalyScore: data.anomalyScore,
          status: data.status,
          details: `Score: ${data.anomalyScore}% | Max Temp: ${Math.max(data.temp1, data.temp2)}°C | Gas: ${data.gas}ppm`,
        },
      });
    }

    if (data.status !== lastStatus) {
      await prisma.faultLog.create({
        data: {
          faultType: 'Status Change',
          severity: data.status,
          actionTaken: data.status === 'Critical'
            ? 'CRITICAL: Relay action taken'
            : data.status === 'Warning'
              ? 'AI Warning — monitoring elevated'
              : 'System returned to normal',
          value: `Score: ${data.anomalyScore.toFixed(1)}%`,
        },
      });
      lastStatus = data.status;
    }

    const count = await prisma.batteryReading.count();
    if (count > 1000) {
      const oldest = await prisma.batteryReading.findFirst({ orderBy: { timestamp: 'asc' } });
      if (oldest) await prisma.batteryReading.delete({ where: { id: oldest.id } });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DB] Write skipped: ${err.message}`);
    }
  }

  io.emit('battery:update', data);
}

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  Think360 Edge Server v2.0           ║');
  console.log(`║  HTTP  → http://localhost:${PORT}       ║`);
  console.log('║  WS    → Socket.io ready             ║');
  console.log('╚══════════════════════════════════════╝\n');

  setInterval(simulationTick, 2000);
  simulationTick();
});
