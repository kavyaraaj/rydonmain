import express from 'express';
import { getStats } from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateAdmin, getStats);

export default router;