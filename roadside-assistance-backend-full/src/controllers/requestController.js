import ServiceRequest from '../models/ServiceRequest.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Workshop from '../models/Workshop.js';
import AuditLog from '../models/AuditLog.js';
import { findMatchingWorkshops } from '../utils/matching.js';
import { logger } from '../utils/logger.js';

// Create Service Request
export const createRequest = async (req, res) => {
  try {
    const {
      vehicleId,
      issueType,
      description,
      attachments,
      location
    } = req.body;

    // Check membership and quota
    if (!req.user.canMakeRequest()) {
      const remainingRequests = req.user.membership.maxRequests - req.user.membership.requestsUsed;
      
      if (req.user.membership.plan === 'free' && remainingRequests === 0) {
        return res.status(403).json({
          error: 'Free trial limit reached. Please upgrade to continue.',
          membership: req.user.membership,
          message: 'You have used all 5 free requests. Subscribe to a plan to continue using our services.'
        });
      }
      
      return res.status(403).json({
        error: 'Request limit exceeded or no active membership',
        membership: req.user.membership
      });
    }

    // Verify vehicle belongs to user
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: req.user._id,
      isActive: true
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Create service request
    const serviceRequest = await ServiceRequest.create({
      user: req.user._id,
      vehicle: vehicle._id,
      issueType,
      description,
      attachments: attachments || [],
      location,
      status: 'Pending'
    });

    // Increment user request count
    await req.user.incrementRequestCount();

    // Find matching workshops
    const matchingWorkshops = await findMatchingWorkshops({
      vehicleType: vehicle.type,
      lat: location.lat,
      lng: location.lng
    });

    // Store notified workshops
    serviceRequest.notifiedWorkshops = matchingWorkshops.map(w => w.workshop._id);
    await serviceRequest.save();

    // Populate request data
    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('user', 'name phone')
      .populate('vehicle');

    // Emit Socket.IO event to matching workshops
    const io = req.app.get('io');
    matchingWorkshops.forEach(({ workshop, distance }) => {
      io.to(`workshop_${workshop._id}`).emit('new_request', {
        request: populatedRequest,
        distance
      });
    });

    await AuditLog.create({
      entityType: 'ServiceRequest',
      entityId: serviceRequest._id,
      action: 'CREATE',
      performedBy: req.user._id,
      performedByModel: 'User',
      meta: { notifiedWorkshops: matchingWorkshops.length }
    });

    logger.info(`Service request created: ${serviceRequest._id}, notified ${matchingWorkshops.length} workshops`);

    res.status(201).json({
      message: 'Service request created successfully',
      request: populatedRequest,
      notifiedWorkshops: matchingWorkshops.length
    });
  } catch (error) {
    logger.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create service request' });
  }
};

// Get User's Requests
export const getMyRequests = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const requests = await ServiceRequest.find(query)
      .populate('vehicle', 'type brand model registrationNumber')
      .populate('assignedWorkshop', 'name phone location rating')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ServiceRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get my requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// Get Request Details
export const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id)
      .populate('user', 'name phone profilePhoto')
      .populate('vehicle')
      .populate('assignedWorkshop', 'name phone location rating photos');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check authorization
    const isUser = req.userType === 'user' && request.user._id.toString() === req.user._id.toString();
    const isWorkshop = req.userType === 'workshop' && 
      (request.assignedWorkshop?._id.toString() === req.workshop._id.toString() ||
       request.notifiedWorkshops.some(w => w.toString() === req.workshop._id.toString()));

    if (!isUser && !isWorkshop) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    logger.error('Get request details error:', error);
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
};

// Update Request Status
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, eta, pricingEstimate, paymentMode } = req.body;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Authorization check
    const isUser = req.userType === 'user' && request.user.toString() === req.user._id.toString();
    const isAssignedWorkshop = req.userType === 'workshop' && 
      request.assignedWorkshop?.toString() === req.workshop._id.toString();

    if (!isUser && !isAssignedWorkshop) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    request.status = status;
    if (eta) request.eta = eta;
    if (pricingEstimate) request.pricingEstimate = pricingEstimate;
    if (paymentMode) request.paymentMode = paymentMode;

    if (status === 'Completed') {
      request.completedAt = new Date();
      // Mark as paid if payment mode is specified
      if (paymentMode && paymentMode !== 'pending') {
        request.isPaid = true;
        request.paidAt = new Date();
      }
    } else if (status === 'Cancelled') {
      request.cancelledAt = new Date();
      request.cancellationReason = req.body.cancellationReason;
    }

    await request.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    io.to(`request_${request._id}`).emit('request_status_updated', {
      requestId: request._id,
      status: request.status,
      eta: request.eta,
      pricingEstimate: request.pricingEstimate
    });

    await AuditLog.create({
      entityType: 'ServiceRequest',
      entityId: request._id,
      action: 'STATUS_CHANGE',
      performedBy: req.userType === 'user' ? req.user._id : req.workshop._id,
      performedByModel: req.userType === 'user' ? 'User' : 'Workshop',
      meta: { oldStatus: request.status, newStatus: status }
    });

    res.json({
      message: 'Status updated successfully',
      request
    });
  } catch (error) {
    logger.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Workshop Accepts Request
export const assignWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const { mechanicDetails, eta } = req.body;

    const request = await ServiceRequest.findById(id).populate('user', 'name phone');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is no longer available' });
    }

    // Check if workshop was notified
    if (!request.notifiedWorkshops.some(w => w.toString() === req.workshop._id.toString())) {
      return res.status(403).json({ error: 'Workshop was not notified for this request' });
    }

    // Check workshop subscription
    if (!req.workshop.canReceiveRequests()) {
      return res.status(403).json({ error: 'Subscription expired or inactive' });
    }

    // Assign workshop
    request.assignedWorkshop = req.workshop._id;
    request.status = 'Accepted';
    request.eta = eta;
    if (mechanicDetails) {
      request.assignedMechanic = mechanicDetails;
    }

    await request.save();

    // Emit Socket.IO event to user
    const io = req.app.get('io');
    io.to(`user_${request.user._id}`).emit('request_accepted', {
      requestId: request._id,
      workshop: {
        id: req.workshop._id,
        name: req.workshop.name,
        phone: req.workshop.phone,
        location: req.workshop.location,
        rating: req.workshop.rating
      },
      mechanic: mechanicDetails,
      eta
    });

    await AuditLog.create({
      entityType: 'ServiceRequest',
      entityId: request._id,
      action: 'UPDATE',
      performedBy: req.workshop._id,
      performedByModel: 'Workshop',
      meta: { action: 'assigned' }
    });

    logger.info(`Request ${request._id} assigned to workshop ${req.workshop._id}`);

    res.json({
      message: 'Request accepted successfully',
      request
    });
  } catch (error) {
    logger.error('Assign workshop error:', error);
    res.status(500).json({ error: 'Failed to assign workshop' });
  }
};