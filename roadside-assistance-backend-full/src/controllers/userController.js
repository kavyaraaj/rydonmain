import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

// Get User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, profilePhoto } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await AuditLog.create({
      entityType: 'User',
      entityId: user._id,
      action: 'UPDATE',
      performedBy: user._id,
      performedByModel: 'User',
      meta: { updatedFields: Object.keys(updateData) }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get User Vehicles
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      user: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ vehicles });
  } catch (error) {
    logger.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Add Vehicle
export const addVehicle = async (req, res) => {
  try {
    const {
      type,
      brand,
      model,
      registrationNumber,
      color,
      fuelType,
      year,
      photoUrl
    } = req.body;

    // Check if registration number already exists
    const existingVehicle = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      type,
      brand,
      model,
      registrationNumber: registrationNumber.toUpperCase(),
      color,
      fuelType,
      year,
      photoUrl
    });

    await AuditLog.create({
      entityType: 'Vehicle',
      entityId: vehicle._id,
      action: 'CREATE',
      performedBy: req.user._id,
      performedByModel: 'User'
    });

    logger.info(`Vehicle added: ${vehicle.registrationNumber} by user ${req.user._id}`);

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    logger.error('Add vehicle error:', error);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
};

// Delete Vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      user: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Soft delete
    vehicle.isActive = false;
    await vehicle.save();

    await AuditLog.create({
      entityType: 'Vehicle',
      entityId: vehicle._id,
      action: 'DELETE',
      performedBy: req.user._id,
      performedByModel: 'User'
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    logger.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};