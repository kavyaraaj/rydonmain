import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  paymentType: {
    type: String,
    enum: ['subscription', 'service_request', 'ad_hoc'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop'
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  metadata: {
    plan: String,
    billingCycle: String,
    description: String
  },
  invoiceUrl: String,
  failureReason: String,
  refundDetails: {
    refundId: String,
    amount: Number,
    reason: String,
    refundedAt: Date
  }
}, {
  timestamps: true
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ workshop: 1, createdAt: -1 });
paymentSchema.index({ status: 1, paymentType: 1 });

export default mongoose.model('Payment', paymentSchema);