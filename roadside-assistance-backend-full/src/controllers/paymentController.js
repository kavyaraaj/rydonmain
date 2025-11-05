import crypto from 'crypto';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Workshop from '../models/Workshop.js';
import Membership from '../models/Membership.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { logger } from '../utils/logger.js';

// Get Available Membership Plans
export const getMembershipPlans = async (req, res) => {
  try {
    const plans = await Membership.find({ isActive: true }).select('-__v');
    res.json({ plans });
  } catch (error) {
    logger.error('Get membership plans error:', error);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

// Create Subscription Order
export const createSubscription = async (req, res) => {
  console.log('💳 createSubscription called');
  console.log('User type:', req.userType);
  console.log('Request body:', req.body);
  
  try {
    // Check if Razorpay is configured
    if (!isRazorpayConfigured()) {
      console.log('❌ Razorpay not configured');
      return res.status(503).json({ 
        error: 'Payment service not configured. Please contact administrator.' 
      });
    }

    console.log('✅ Razorpay configured, proceeding...');
    
    const { plan, billingCycle } = req.body;
    console.log('📝 Plan:', plan, 'Billing:', billingCycle);

    let amount;
    let description;
    let entityType;
    let entityId;

    if (req.userType === 'user') {
      console.log('👤 Processing user subscription...');
      
      // User membership subscription
      const membership = await Membership.findOne({ name: plan, isActive: true });
      console.log('📋 Membership found:', membership ? 'Yes' : 'No');
      
      if (!membership) {
        console.log('❌ Membership plan not found for:', plan);
        return res.status(404).json({ error: 'Membership plan not found' });
      }

      amount = billingCycle === 'yearly' ? membership.priceYearly : membership.priceMonthly;
      description = `${plan.toUpperCase()} Membership - ${billingCycle}`;
      entityType = 'User';
      entityId = req.user._id;
      
      console.log('💰 Amount:', amount, 'Description:', description);
    } else if (req.userType === 'workshop') {
      console.log('🏪 Processing workshop subscription...');
      
      // Workshop SaaS subscription
      amount = parseInt(process.env.WORKSHOP_SUBSCRIPTION_MONTHLY) || 300;
      description = `Workshop Subscription - ${billingCycle}`;
      entityType = 'Workshop';
      entityId = req.workshop._id;
      
      console.log('💰 Amount:', amount, 'Description:', description);
    } else {
      console.log('❌ Invalid user type:', req.userType);
      return res.status(400).json({ error: 'Invalid user type' });
    }

    console.log('🔧 Creating Razorpay order...');
    
    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: {
        plan,
        billingCycle,
        entityType,
        entityId: entityId.toString()
      }
    };

    console.log('📦 Order options:', options);

    const razorpay = getRazorpayInstance();
    console.log('🔍 Razorpay instance:', razorpay ? 'Got instance' : 'NULL');
    
    if (!razorpay) {
      console.log('❌ Failed to get Razorpay instance');
      return res.status(503).json({ error: 'Payment service initialization failed' });
    }

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);

    // Store payment record
    const payment = await Payment.create({
      orderId: order.receipt,
      razorpayOrderId: order.id,
      amount: amount,
      currency: 'INR',
      status: 'created',
      paymentType: 'subscription',
      [entityType.toLowerCase()]: entityId,
      metadata: {
        plan,
        billingCycle,
        description
      }
    });

    console.log('✅ Payment record created:', payment._id);
    logger.info(`Subscription order created: ${order.id} for ${entityType} ${entityId}`);

    console.log('📤 Sending response...');
    const response = {
      message: 'Subscription order created',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      payment: payment
    };
    
    console.log('✅ Response ready, sending status 201...');
    return res.status(201).json(response);
    
  } catch (error) {
    console.log('❌ ERROR in createSubscription:', error);
    console.log('Error stack:', error.stack);
    logger.error('Create subscription error:', error);
    return res.status(500).json({ error: 'Failed to create subscription', details: error.message });
  }
};


// Razorpay Webhook Handler
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payloadData = req.body.payload.payment.entity;

    logger.info(`Webhook received: ${event}`);

    if (event === 'payment.authorized' || event === 'payment.captured') {
      // Find payment record
      const payment = await Payment.findOne({ razorpayOrderId: payloadData.order_id });

      if (!payment) {
        logger.error('Payment record not found for order:', payloadData.order_id);
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      payment.razorpayPaymentId = payloadData.id;
      payment.razorpaySignature = signature;
      payment.status = event === 'payment.captured' ? 'captured' : 'authorized';
      await payment.save();

      // Activate subscription (only for subscription payments)
      if (payment.paymentType === 'subscription') {
        if (payment.user) {
          // User membership
          const user = await User.findById(payment.user);
          const membership = await Membership.findOne({ name: payment.metadata.plan });

          const expiryMonths = payment.metadata.billingCycle === 'yearly' ? 12 : 1;
          user.membership = {
            plan: payment.metadata.plan,
            requestsUsed: 0,
            maxRequests: membership.maxRequestsMonthly,
            expiry: new Date(Date.now() + expiryMonths * 30 * 24 * 60 * 60 * 1000),
            lastResetDate: new Date()
          };
          await user.save();
          logger.info(`User ${user._id} membership activated: ${payment.metadata.plan}`);
        } else if (payment.workshop) {
          // Workshop subscription
          const workshop = await Workshop.findById(payment.workshop);
          const expiryMonths = payment.metadata.billingCycle === 'yearly' ? 12 : 1;
          
          workshop.subscription = {
            plan: payment.metadata.billingCycle,
            status: 'active',
            expiry: new Date(Date.now() + expiryMonths * 30 * 24 * 60 * 60 * 1000),
            razorpaySubscriptionId: payloadData.id
          };
          await workshop.save();
          logger.info(`Workshop ${workshop._id} subscription activated`);
        }
      }
    } else if (event === 'payment.failed') {
      const payment = await Payment.findOne({ razorpayOrderId: payloadData.order_id });
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = payloadData.error_description || 'Payment failed';
        await payment.save();
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Get Payment History
export const getPaymentHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const query = {};
    if (req.userType === 'user') {
      query.user = req.user._id;
    } else if (req.userType === 'workshop') {
      query.workshop = req.workshop._id;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};