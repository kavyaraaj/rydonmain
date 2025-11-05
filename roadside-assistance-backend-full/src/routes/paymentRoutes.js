import express from 'express';
import {
  getMembershipPlans,
  createSubscription,
  handleWebhook,
  getPaymentHistory
} from '../controllers/paymentController.js';
import { authenticateAny } from '../middleware/auth.js';

const router = express.Router();

console.log('🔧 Payment routes loading...');

router.get('/plans', (req, res, next) => {
  console.log('✅ /plans hit');
  next();
}, getMembershipPlans);

router.post('/subscription/create', (req, res, next) => {
  console.log('✅ /subscription/create hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
}, authenticateAny, createSubscription);

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/history', authenticateAny, getPaymentHistory);

console.log('✅ Payment routes registered');

export default router;