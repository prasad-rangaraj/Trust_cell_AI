import { Router } from 'express';
import { getSystemHealth, exportData, getSystemStats, controlRelay } from '../controllers/system.controller.js';
import { requireApiKey } from '../middleware/auth.js';

const router = Router();

router.get('/health', getSystemHealth);
router.get('/export', exportData);
router.get('/stats', getSystemStats);
router.post('/relay', requireApiKey, controlRelay);

export default router;
