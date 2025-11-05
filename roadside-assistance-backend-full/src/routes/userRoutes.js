import express from 'express';
import {
  getProfile,
  updateProfile,
  getVehicles,
  addVehicle,
  deleteVehicle
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';
import { addVehicleValidator, validate } from '../middleware/validator.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/vehicles', getVehicles);
router.post('/vehicles', addVehicleValidator, validate, addVehicle);
router.delete('/vehicles/:id', deleteVehicle);

export default router;