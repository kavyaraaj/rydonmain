import express from 'express';
import {
  createRequest,
  getMyRequests,
  getRequestDetails,
  updateStatus,
  assignWorkshop
} from '../controllers/requestController.js';
import { authenticateUser, authenticateWorkshop, authenticateAny } from '../middleware/auth.js';
import {
  createRequestValidator,
  updateStatusValidator,
  validate
} from '../middleware/validator.js';
import { requestLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// User routes
router.post('/', authenticateUser, requestLimiter, createRequestValidator, validate, createRequest);
router.get('/my', authenticateUser, getMyRequests);

// Shared routes
router.get('/:id', authenticateAny, getRequestDetails);
router.patch('/:id/status', authenticateAny, updateStatusValidator, validate, updateStatus);

// Workshop routes
router.patch('/:id/assign', authenticateWorkshop, assignWorkshop);

export default router;