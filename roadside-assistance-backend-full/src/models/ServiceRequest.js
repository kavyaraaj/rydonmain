import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  issueType: {
    type: String,
    enum: ['Battery', 'Tire', 'Towing', 'FuelDelivery', 'LockOut', 'JumpStart', 'FlatTire', 'Engine', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attachments: [String],
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
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  assignedWorkshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },
  assignedMechanic: {
    name: String,
    phone: String,
    photo: String
  },
  eta: {
    type: Date,
    default: null
  },
  chat: [{
    senderRole: {
      type: String,
      enum: ['user', 'workshop'],
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    senderName: String,
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  pricingEstimate: {
    labor: {
      type: Number,
      default: 0
    },
    parts: {
      type: Number,
      default: 0
    },
    travel: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    notes: String
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'card', 'pending'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  notifiedWorkshops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop'
  }],
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
serviceRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ assignedWorkshop: 1, status: 1 });
serviceRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ServiceRequest', serviceRequestSchema);