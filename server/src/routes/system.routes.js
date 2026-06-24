import { Router } from 'express';
import { getSystemHealth, exportData, getSystemStats, controlRelay } from '../controllers/system.controller.js';

const router = Router();

router.get('/health', getSystemHealth);
router.get('/export', exportData);
router.get('/stats', getSystemStats);
router.post('/relay', controlRelay);  // ← Relay control: POST { relay, action }

export default router;
