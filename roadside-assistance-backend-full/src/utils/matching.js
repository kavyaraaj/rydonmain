import Workshop from '../models/Workshop.js';
import { calculateDistance } from './haversine.js';
import { logger } from './logger.js';

/**
 * Find matching workshops for a service request
 * @param {Object} params - Matching parameters
 * @param {string} params.vehicleType - Type of vehicle (2W, 3W, 4W, EV)
 * @param {number} params.lat - User latitude
 * @param {number} params.lng - User longitude
 * @param {number} params.radius - Search radius in km (default from env)
 * @param {number} params.limit - Maximum workshops to return
 * @returns {Promise} Array of matching workshops with distance
 */
export const findMatchingWorkshops = async ({
  vehicleType,
  lat,
  lng,
  radius = parseFloat(process.env.MAX_MATCHING_DISTANCE_KM) || 10,
  limit = parseInt(process.env.MAX_MATCHING_WORKSHOPS) || 10
}) => {
  try {
    // Find workshops that:
    // 1. Support the vehicle type
    // 2. Are currently online
    // 3. Have active subscription
    const currentDate = new Date();
    
    const workshops = await Workshop.find({
      vehicleTypes: vehicleType,
      isOnline: true,
      'subscription.status': 'active',
      'subscription.expiry': { $gt: currentDate }
    }).select('name location vehicleTypes servicesOffered rating isSponsored photos phone');

    if (workshops.length === 0) {
      logger.info('No online workshops found for vehicle type:', vehicleType);
      return [];
    }

    // Calculate distances and filter by radius
    const workshopsWithDistance = workshops
      .map(workshop => {
        const distance = calculateDistance(
          lat,
          lng,
          workshop.location.lat,
          workshop.location.lng
        );

        return {
          workshop: workshop.toObject(),
          distance: parseFloat(distance.toFixed(2))
        };
      })
      .filter(item => item.distance <= radius);

    // Sort by:
    // 1. Sponsored status (sponsored first)
    // 2. Distance (nearest first)
    // 3. Rating (highest first)
    workshopsWithDistance.sort((a, b) => {
      if (a.workshop.isSponsored !== b.workshop.isSponsored) {
        return b.workshop.isSponsored ? 1 : -1;
      }
      if (Math.abs(a.distance - b.distance) > 0.5) {
        return a.distance - b.distance;
      }
      return b.workshop.rating.average - a.workshop.rating.average;
    });

    // Limit results
    const limitedResults = workshopsWithDistance.slice(0, limit);

    logger.info(`Found ${limitedResults.length} matching workshops within ${radius}km`);
    
    return limitedResults;

  } catch (error) {
    logger.error('Error finding matching workshops:', error);
    throw error;
  }
};

/**
 * Example return format:
 * [
 *   {
 *     workshop: {
 *       _id: "...",
 *       name: "ABC Workshop",
 *       location: { lat: 21.1458, lng: 79.0882, address: "..." },
 *       vehicleTypes: ["2W", "4W"],
 *       servicesOffered: ["Battery", "Tire"],
 *       rating: { average: 4.5, count: 120 },
 *       isSponsored: false,
 *       photos: ["url1", "url2"],
 *       phone: "9876543210"
 *     },
 *     distance: 2.35
 *   }
 * ]
 */