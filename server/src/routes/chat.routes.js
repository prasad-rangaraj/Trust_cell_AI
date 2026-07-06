import { Router } from 'express';
import { handleChat, generateInsight, speechToText } from '../controllers/chat.controller.js';

const router = Router();

router.post('/', handleChat);
router.post('/analyze', generateInsight);
router.post('/speech', speechToText);

export default router;
