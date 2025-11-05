import express from 'express';
import {
  registerUser,
  loginUser,
  googleOAuth,
  registerWorkshop,
  loginWorkshop
} from '../controllers/authController.js';
import {
  registerUserValidator,
  loginValidator,
  registerWorkshopValidator,
  validate
} from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// User routes
router.post('/user/register', authLimiter, registerUserValidator, validate, registerUser);
router.post('/user/login', authLimiter, loginValidator, validate, loginUser);
router.post('/user/oauth', authLimiter, googleOAuth);

// Workshop routes
router.post('/workshop/register', authLimiter, registerWorkshopValidator, validate, registerWorkshop);
router.post('/workshop/login', authLimiter, loginValidator, validate, loginWorkshop);

export default router;