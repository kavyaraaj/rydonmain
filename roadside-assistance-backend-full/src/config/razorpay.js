import Razorpay from 'razorpay';
import { logger } from '../utils/logger.js';

let razorpayInstance = null;

export const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // DEBUG: Check if env vars are loaded
    console.log('🔍 DEBUG - Razorpay Key ID:', keyId ? '✅ Found' : '❌ Not Found');
    console.log('🔍 DEBUG - Razorpay Secret:', keySecret ? '✅ Found' : '❌ Not Found');

    if (!keyId || !keySecret) {
      logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
      logger.warn('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
      return null;
    }

    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      logger.info('✅ Razorpay initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Razorpay:', error);
      return null;
    }
  }
  return razorpayInstance;
};

export const isRazorpayConfigured = () => {
  const configured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  console.log('🔍 DEBUG - Is Razorpay Configured:', configured);
  return configured;
};