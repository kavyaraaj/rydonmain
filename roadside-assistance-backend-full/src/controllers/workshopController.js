import Workshop from '../models/Workshop.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Vehicle from '../models/Vehicle.js';
import AuditLog from '../models/AuditLog.js';
import { calculateDistance } from '../utils/haversine.js';
import { logger } from '../utils/logger.js';

// Get Nearby Workshops (for debugging/testing)
export const getNearbyWorkshops = async (req, res) => {
  try {
    const { lat, lng, radius = 10, vehicleType } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const query = {
      isOnline: true,
      'subscription.status': 'active',
      'subscription.expiry': { $gt: new Date() }
    };

    if (vehicleType) {
      query.vehicleTypes = vehicleType;
    }

    const workshops = await Workshop.find(query).select('-passwordHash -bankDetails -documents');

    const workshopsWithDistance = workshops
      .map(workshop => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          workshop.location.lat,
          workshop.location.lng
        );
        return { workshop, distance: parseFloat(distance.toFixed(2)) };
      })
      .filter(item => item.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json({ workshops: workshopsWithDistance });
  } catch (error) {
    logger.error('Get nearby workshops error:', error);
    res.status(500).json({ error: 'Failed to fetch workshops' });
  }
};

// Get Workshop Requests
export const getWorkshopRequests = async (req, res) => {
  try {
    const { status = 'Pending' } = req.query;

    let query;
    
    if (status === 'Pending') {
      // Get pending requests that match workshop's vehicle types and are nearby
      query = {
        status: 'Pending',
        notifiedWorkshops: req.workshop._id
      };
    } else {
      // Get assigned requests
      query = {
        assignedWorkshop: req.workshop._id,
        status
      };
    }

    const requests = await ServiceRequest.find(query)
      .populate('user', 'name phone')
      .populate('vehicle', 'type brand model registrationNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate distances for pending requests
    const requestsWithDistance = requests.map(request => {
      const distance = calculateDistance(
        req.workshop.location.lat,
        req.workshop.location.lng,
        request.location.lat,
        request.location.lng
      );
      return {
        ...request.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    });

    res.json({ requests: requestsWithDistance });
  } catch (error) {
    logger.error('Get workshop requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// Update Workshop Profile
export const updateWorkshopProfile = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      phone,
      vehicleTypes,
      servicesOffered,
      location,
      photos,
      bankDetails
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (ownerName) updateData.ownerName = ownerName;
    if (phone) updateData.phone = phone;
    if (vehicleTypes) updateData.vehicleTypes = vehicleTypes;
    if (servicesOffered) updateData.servicesOffered = servicesOffered;
    if (location) updateData.location = location;
    if (photos) updateData.photos = photos;
    if (bankDetails) updateData.bankDetails = bankDetails;

    const workshop = await Workshop.findByIdAndUpdate(
      req.workshop._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await AuditLog.create({
      entityType: 'Workshop',
      entityId: workshop._id,
      action: 'UPDATE',
      performedBy: workshop._id,
      performedByModel: 'Workshop',
      meta: { updatedFields: Object.keys(updateData) }
    });

    res.json({
      message: 'Workshop profile updated successfully',
      workshop
    });
  } catch (error) {
    logger.error('Update workshop profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};