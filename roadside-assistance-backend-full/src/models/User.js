import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  oauthProvider: {
    type: String,
    enum: ['google', null],
    default: null
  },
  oauthId: {
    type: String,
    sparse: true
  },
  membership: {
    plan: {
      type: String,
      enum: ['none', 'free', 'basic', 'premium'],
      default: 'free'
    },
    requestsUsed: {
      type: Number,
      default: 0
    },
    maxRequests: {
      type: Number,
      default: 5
    },
    expiry: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year for free plan
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  profilePhoto: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1, phone: 1 });
userSchema.index({ 'membership.expiry': 1 });

// Methods
userSchema.methods.canMakeRequest = function() {
  // Free plan users can make requests until they hit the limit
  if (this.membership.plan === 'free') {
    return this.membership.requestsUsed < this.membership.maxRequests;
  }
  
  // Paid plans need active subscription
  if (this.membership.plan === 'none') return false;
  if (new Date() > this.membership.expiry) return false;
  return this.membership.requestsUsed < this.membership.maxRequests;
};

userSchema.methods.incrementRequestCount = function() {
  this.membership.requestsUsed += 1;
  return this.save();
};

userSchema.methods.resetMonthlyQuota = function() {
  this.membership.requestsUsed = 0;
  this.membership.lastResetDate = new Date();
  return this.save();
};

export default mongoose.model('User', userSchema);