import express from 'express';
import {
  getNearbyWorkshops,
  getWorkshopRequests,
  updateWorkshopProfile
} from '../controllers/workshopController.js';
import { authenticateWorkshop, authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Public route for debugging
router.get('/nearby', getNearbyWorkshops);

// Workshop-only routes
router.get('/requests', authenticateWorkshop, getWorkshopRequests);
router.put('/:id/profile', authenticateWorkshop, updateWorkshopProfile);

export default router;