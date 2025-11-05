import mongoose from 'mongoose';

const workshopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  vehicleTypes: [{
    type: String,
    enum: ['2W', '3W', '4W', 'EV'],
    required: true
  }],
  servicesOffered: [{
    type: String,
    enum: ['Battery', 'Tire', 'Towing', 'FuelDelivery', 'LockOut', 'JumpStart', 'FlatTire', 'Engine', 'Other']
  }],
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  photos: [String],
  documents: [{
    type: {
      type: String,
      enum: ['license', 'registration', 'insurance', 'gst']
    },
    url: String,
    encryptedData: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  subscription: {
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive'
    },
    expiry: Date,
    razorpaySubscriptionId: String
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isSponsored: {
    type: Boolean,
    default: false
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    encryptedData: String
  },
  gstNumber: {
    type: String,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
workshopSchema.index({ location: '2dsphere' });
workshopSchema.index({ email: 1, phone: 1 });
workshopSchema.index({ vehicleTypes: 1, isOnline: 1 });
workshopSchema.index({ 'subscription.status': 1, 'subscription.expiry': 1 });

// Methods
workshopSchema.methods.canReceiveRequests = function() {
  return this.isOnline && 
         this.subscription.status === 'active' && 
         new Date() < this.subscription.expiry;
};

export default mongoose.model('Workshop', workshopSchema);