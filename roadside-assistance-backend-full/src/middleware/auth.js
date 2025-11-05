import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workshop from '../models/Workshop.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    req.user = user;
    req.userType = 'user';
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticateWorkshop = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const workshop = await Workshop.findById(decoded.id).select('-passwordHash');
    
    if (!workshop) {
      return res.status(401).json({ error: 'Invalid token or workshop not found' });
    }

    req.workshop = workshop;
    req.userType = 'workshop';
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticateAny = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('🔐 authenticateAny middleware - token exists:', !!token);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);
    
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
        req.userType = 'user';
        console.log('✅ User authenticated:', user._id);
        return next();
      }
    } else if (decoded.type === 'workshop') {
      const workshop = await Workshop.findById(decoded.id).select('-passwordHash');
      if (workshop) {
        req.workshop = workshop;
        req.userType = 'workshop';
        console.log('✅ Workshop authenticated:', workshop._id);
        return next();
      }
    }
    
    console.log('❌ Invalid token type or user not found');
    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};