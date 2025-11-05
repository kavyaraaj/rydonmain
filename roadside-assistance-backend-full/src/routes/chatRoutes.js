import express from 'express';
import { sendMessage, getChatHistory } from '../controllers/chatController.js';
import { authenticateAny } from '../middleware/auth.js';
import { sendMessageValidator, validate } from '../middleware/validator.js';

const router = express.Router();

router.post('/requests/:id/chat', authenticateAny, sendMessageValidator, validate, sendMessage);
router.get('/requests/:id/chat', authenticateAny, getChatHistory);

export default router;