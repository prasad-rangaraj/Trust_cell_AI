import { Router } from 'express';
import readingsRoutes from './readings.routes.js';
import faultsRoutes from './faults.routes.js';
import anomaliesRoutes from './anomalies.routes.js';

import systemRoutes from './system.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

/**
 * API Route Registry
 * All routes prefixed with /api from the main app
 */
router.use('/readings', readingsRoutes);     // GET /api/readings/latest, /history, /stats
router.use('/faults', faultsRoutes);         // GET /api/faults, /summary | DELETE /api/faults
router.use('/anomalies', anomaliesRoutes);   // GET /api/anomalies, /trend, /distribution

router.use('/system', systemRoutes);         // GET /api/system/health, /export, /stats
router.use('/chat', chatRoutes);             // POST /api/chat

export default router;
