import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validators
export const registerUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const registerWorkshopValidator = [
  body('name').trim().notEmpty().withMessage('Workshop name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('vehicleTypes').isArray({ min: 1 }).withMessage('At least one vehicle type is required'),
  body('vehicleTypes.*').isIn(['2W', '3W', '4W', 'EV']).withMessage('Invalid vehicle type'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required')
];

// Vehicle validators
export const addVehicleValidator = [
  body('type').isIn(['2W', '3W', '4W', 'EV']).withMessage('Invalid vehicle type'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('fuelType').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']).withMessage('Invalid fuel type')
];

// Service request validators
export const createRequestValidator = [
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('issueType').isIn(['Battery', 'Tire', 'Towing', 'FuelDelivery', 'LockOut', 'JumpStart', 'FlatTire', 'Engine', 'Other']).withMessage('Invalid issue type'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required')
];

export const updateStatusValidator = [
  body('status').isIn(['Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled']).withMessage('Invalid status')
];

// Chat validators
export const sendMessageValidator = [
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
];

// Payment validators
export const createSubscriptionValidator = [
  body('plan').isIn(['basic', 'premium', 'monthly', 'yearly']).withMessage('Invalid plan'),
  body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
];