import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workshop from '../models/Workshop.js';
import AuditLog from '../models/AuditLog.js';
import { encrypt } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';

const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or phone' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'user'
    });

    // Generate token
    const token = generateToken(user._id, 'user');

    // Audit log
    await AuditLog.create({
      entityType: 'User',
      entityId: user._id,
      action: 'CREATE',
      performedBy: user._id,
      performedByModel: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('User registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, 'user');

    await AuditLog.create({
      entityType: 'User',
      entityId: user._id,
      action: 'LOGIN',
      performedBy: user._id,
      performedByModel: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membership: user.membership
      },
      token
    });
  } catch (error) {
    logger.error('User login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Google OAuth
export const googleOAuth = async (req, res) => {
  try {
    const { token: googleToken, name, email, googleId } = req.body;

    // In production, verify the Google token with Google's API
    // For now, accepting the payload

    let user = await User.findOne({ email });

    if (user) {
      // Update OAuth info if not set
      if (!user.oauthProvider) {
        user.oauthProvider = 'google';
        user.oauthId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        phone: `OAUTH_${Date.now()}`, // Temporary, should ask user to update
        oauthProvider: 'google',
        oauthId: googleId,
        role: 'user'
      });
    }

    const token = generateToken(user._id, 'user');

    await AuditLog.create({
      entityType: 'User',
      entityId: user._id,
      action: 'LOGIN',
      performedBy: user._id,
      performedByModel: 'User',
      meta: { method: 'google-oauth' },
      ipAddress: req.ip
    });

    res.json({
      message: 'OAuth authentication successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membership: user.membership
      },
      token
    });
  } catch (error) {
    logger.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
};

// Workshop Registration
export const registerWorkshop = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      email,
      phone,
      password,
      vehicleTypes,
      servicesOffered,
      location,
      gstNumber,
      photos
    } = req.body;

    const existingWorkshop = await Workshop.findOne({ $or: [{ email }, { phone }] });
    if (existingWorkshop) {
      return res.status(400).json({ error: 'Workshop already exists with this email or phone' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Encrypt sensitive data
    const encryptedGST = gstNumber ? encrypt(gstNumber) : null;

    const workshop = await Workshop.create({
      name,
      ownerName,
      email,
      phone,
      passwordHash,
      vehicleTypes,
      servicesOffered: servicesOffered || [],
      location,
      gstNumber: gstNumber,
      photos: photos || [],
      documents: [], // Upload separately
      isOnline: false,
      subscription: {
        plan: 'monthly',
        status: 'inactive'
      }
    });

    const token = generateToken(workshop._id, 'workshop');

    await AuditLog.create({
      entityType: 'Workshop',
      entityId: workshop._id,
      action: 'CREATE',
      performedBy: workshop._id,
      performedByModel: 'Workshop',
      ipAddress: req.ip
    });

    logger.info(`New workshop registered: ${workshop.email}`);

    res.status(201).json({
      message: 'Workshop registered successfully. Please complete payment to activate.',
      workshop: {
        id: workshop._id,
        name: workshop.name,
        email: workshop.email,
        phone: workshop.phone,
        location: workshop.location,
        subscription: workshop.subscription
      },
      token
    });
  } catch (error) {
    logger.error('Workshop registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Workshop Login
export const loginWorkshop = async (req, res) => {
  try {
    const { email, password } = req.body;

    const workshop = await Workshop.findOne({ email });
    if (!workshop) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, workshop.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(workshop._id, 'workshop');

    await AuditLog.create({
      entityType: 'Workshop',
      entityId: workshop._id,
      action: 'LOGIN',
      performedBy: workshop._id,
      performedByModel: 'Workshop',
      ipAddress: req.ip
    });

    res.json({
      message: 'Login successful',
      workshop: {
        id: workshop._id,
        name: workshop.name,
        email: workshop.email,
        phone: workshop.phone,
        location: workshop.location,
        isOnline: workshop.isOnline,
        subscription: workshop.subscription
      },
      token
    });
  } catch (error) {
    logger.error('Workshop login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};