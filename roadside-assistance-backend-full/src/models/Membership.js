import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium']  // ← Added 'free' here
  },
  priceMonthly: {
    type: Number,
    required: true
  },
  priceYearly: {
    type: Number,
    required: true
  },
  maxRequestsMonthly: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Membership', membershipSchema);