import asyncHandler from '../middleware/asyncHandler.js';
import prisma from '../services/prisma.service.js';
import { updateSimulatedRelay } from '../simulator.js';

/**
 * GET /api/system/health
 * Server health check with DB status.
 */
export const getSystemHealth = asyncHandler(async (req, res) => {
  let dbStatus = 'connected';
  let dbLatency = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    data: {
      server: 'online',
      uptime: Math.floor(process.uptime()),
      db: dbStatus,
      dbLatency: `${dbLatency}ms`,

      timestamp: new Date().toISOString(),
      version: '2.0.0',
    },
  });
});

/**
 * GET /api/system/export?format=csv
 * Exports recent readings as CSV or JSON.
 */
export const exportData = asyncHandler(async (req, res) => {
  const format = req.query.format || 'json';
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

  const readings = await prisma.batteryReading.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  const data = readings.reverse();

  if (format === 'csv') {
    const headers = ['timestamp', 'cell1', 'cell2', 'cell3', 'cell4', 'current', 'temperature', 'gas', 'batteryHealth', 'anomalyScore', 'status', 'relay'];
    const rows = data.map((r) =>
      headers.map((h) => (r[h] instanceof Date ? r[h].toISOString() : r[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cat_edge_export_${Date.now()}.csv"`);
    return res.send(csv);
  }

  res.json({ success: true, data, meta: { count: data.length, format } });
});

/**
 * GET /api/system/stats
 * Returns high-level system statistics for the dashboard.
 */
export const getSystemStats = asyncHandler(async (req, res) => {
  const [totalReadings, totalFaults, totalAnomalies, latestReading] = await Promise.all([
    prisma.batteryReading.count(),
    prisma.faultLog.count(),
    prisma.anomalyLog.count(),
    prisma.batteryReading.findFirst({ orderBy: { timestamp: 'desc' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalReadings,
      totalFaults,
      totalAnomalies,
      uptime: Math.floor(process.uptime()),

      latest: latestReading,
    },
  });
});

/**
 * POST /api/system/relay
 * Body: { relay: 'isolation'|'cooling'|'cell1'|'cell2'|'cell3'|'cell4', action: 'CONNECT'|'DISCONNECT' }
 * Publishes a relay control command over MQTT to the STM32 hardware.
 */
export const controlRelay = asyncHandler(async (req, res) => {
  const VALID_RELAYS  = ['isolation', 'cooling', 'cell1', 'cell2', 'cell3', 'cell4'];
  const VALID_ACTIONS = ['CONNECT', 'DISCONNECT'];

  const { relay, action } = req.body;

  if (!relay || !action) {
    return res.status(400).json({ success: false, error: 'Missing relay or action in request body.' });
  }
  if (!VALID_RELAYS.includes(relay)) {
    return res.status(400).json({ success: false, error: `Invalid relay. Must be one of: ${VALID_RELAYS.join(', ')}` });
  }
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ success: false, error: `Invalid action. Must be CONNECT or DISCONNECT.` });
  }

  // Build the ASCII command expected by the STM32 firmware
  // e.g. "RELAY:COOLING:ON"  or  "RELAY:CELL1:OFF"
  const relayCode = relay.toUpperCase();
  const stateCode = action === 'CONNECT' ? 'ON' : 'OFF';
  const commandStr = `RELAY:${relayCode}:${stateCode}`;

  // Update backend simulator state
  updateSimulatedRelay(relay, action);

  // Publish to hardware via the shared MQTT client
  const mqttClient = req.app.get('mqttClient');
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish('battery/control', commandStr, { qos: 1 });
    console.log(`[RELAY] MQTT publish → battery/control | ${commandStr}`);
  } else {
    console.warn(`[RELAY] MQTT not connected — command NOT dispatched: ${commandStr}`);
  }

  res.json({
    success: true,
    message: `Relay command dispatched: ${commandStr}`,
    relay,
    action,
  });
});
