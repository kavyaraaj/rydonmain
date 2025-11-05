import express from 'express';
import { diagnose, submitFeedback } from '../controllers/aiController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/diagnose', authenticateUser, diagnose);
router.post('/diagnose/:diagnosisId/feedback', authenticateUser, submitFeedback);

export default router;