import prisma from '../services/prisma.service.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * GET /api/readings/latest
 * Returns the most recent battery reading.
 */
export const getLatestReading = asyncHandler(async (req, res) => {
  const reading = await prisma.batteryReading.findFirst({
    orderBy: { timestamp: 'desc' },
  });
  res.json({ success: true, data: reading });
});

/**
 * GET /api/readings/history?limit=30&offset=0
 * Returns paginated reading history ordered oldest → newest (for charts).
 */
export const getReadingHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);
  const offset = parseInt(req.query.offset) || 0;

  const [readings, total] = await Promise.all([
    prisma.batteryReading.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.batteryReading.count(),
  ]);

  res.json({
    success: true,
    data: readings.reverse(), // Oldest → newest for charts
    meta: { total, limit, offset },
  });
});

/**
 * GET /api/readings/stats
 * Returns aggregate stats: avg, min, max for each field over last N readings.
 */
export const getReadingStats = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);

  const readings = await prisma.batteryReading.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      cell1: true, cell2: true, cell3: true, cell4: true,
      current: true, temp1: true, temp2: true, gas: true,
      batteryHealth: true, anomalyScore: true,
    },
  });

  const fields = ['cell1', 'cell2', 'cell3', 'cell4', 'current', 'temp1', 'temp2', 'gas', 'batteryHealth', 'anomalyScore'];
  const stats = {};

  for (const field of fields) {
    const vals = readings.map((r) => r[field]).filter((v) => v != null);
    if (vals.length === 0) { stats[field] = { avg: 0, min: 0, max: 0 }; continue; }
    stats[field] = {
      avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
      min: parseFloat(Math.min(...vals).toFixed(3)),
      max: parseFloat(Math.max(...vals).toFixed(3)),
    };
  }

  res.json({ success: true, data: stats, meta: { count: readings.length } });
});
