import User from '../models/User.js';
import Workshop from '../models/Workshop.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Payment from '../models/Payment.js';
import { logger } from '../utils/logger.js';

// Get Admin Stats
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalWorkshops,
      activeRequests,
      completedRequests,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      Workshop.countDocuments(),
      ServiceRequest.countDocuments({ status: { $in: ['Pending', 'Accepted', 'InProgress'] } }),
      ServiceRequest.countDocuments({ status: 'Completed' }),
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const stats = {
      totalUsers,
      totalWorkshops,
      activeRequests,
      completedRequests,
      totalRevenue: totalRevenue[0]?.total || 0,
      timestamp: new Date()
    };

    res.json({ stats });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};