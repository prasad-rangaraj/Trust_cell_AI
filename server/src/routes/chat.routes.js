import { Router } from 'express';
import { handleChat, generateInsight } from '../controllers/chat.controller.js';

const router = Router();

router.post('/', handleChat);
router.post('/analyze', generateInsight);

export default router;
