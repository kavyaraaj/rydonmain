import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';
import Workshop from '../src/models/Workshop.js';
import Vehicle from '../src/models/Vehicle.js';
import Membership from '../src/models/Membership.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Workshop.deleteMany({}),
      Vehicle.deleteMany({}),
      Membership.deleteMany({})
    ]);

    logger.info('Cleared existing data');

    // Seed Membership Plans
    const memberships = await Membership.create([
      {
        planId: 'free',
        name: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        maxRequestsMonthly: 5,
        features: ['5 service requests (one-time)', 'Basic support', 'Standard response time'],
        isActive: true
      },
      {
        planId: 'basic',
        name: 'basic',
        priceMonthly: 99,
        priceYearly: 990,
        maxRequestsMonthly: 15,
        features: ['15 service requests per month', 'Basic support', 'Standard response time'],
        isActive: true
      },
      {
        planId: 'premium',
        name: 'premium',
        priceMonthly: 199,
        priceYearly: 1990,
        maxRequestsMonthly: 25,
        features: ['25 service requests per month', 'Priority support', 'Faster response time', 'Exclusive offers'],
        isActive: true
      }
    ]);

    logger.info('✅ Membership plans seeded');

    // Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        passwordHash,
        role: 'user',
        membership: {
          plan: 'premium',
          requestsUsed: 5,
          maxRequests: 25,
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543211',
        passwordHash,
        role: 'user',
        membership: {
          plan: 'free',
          requestsUsed: 0,
          maxRequests: 5,
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '9876543212',
        passwordHash,
        role: 'admin'
      }
    ]);

    logger.info('✅ Users seeded');

    // Seed Workshops
    const workshops = await Workshop.create([
      {
        name: 'Express Auto Care',
        ownerName: 'Ramesh Kumar',
        email: 'express@example.com',
        phone: '9123456780',
        passwordHash,
        vehicleTypes: ['2W', '4W'],
        servicesOffered: ['Battery', 'Tire', 'JumpStart', 'FlatTire'],
        location: {
          lat: 21.1458,
          lng: 79.0882,
          address: 'Sitabuldi, Nagpur, Maharashtra'
        },
        isOnline: true,
        subscription: {
          plan: 'monthly',
          status: 'active',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        rating: { average: 4.5, count: 120 },
        photos: ['https://example.com/workshop1.jpg']
      },
      {
        name: 'Quick Fix Motors',
        ownerName: 'Suresh Patil',
        email: 'quickfix@example.com',
        phone: '9123456781',
        passwordHash,
        vehicleTypes: ['2W', '3W', '4W'],
        servicesOffered: ['Towing', 'Engine', 'Battery', 'Tire'],
        location: {
          lat: 21.1565,
          lng: 79.0950,
          address: 'Dharampeth, Nagpur, Maharashtra'
        },
        isOnline: true,
        subscription: {
          plan: 'monthly',
          status: 'active',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        rating: { average: 4.2, count: 85 }
      },
      {
        name: 'EV Service Center',
        ownerName: 'Amit Sharma',
        email: 'evservice@example.com',
        phone: '9123456782',
        passwordHash,
        vehicleTypes: ['EV', '4W'],
        servicesOffered: ['Battery', 'Tire', 'Engine'],
        location: {
          lat: 21.1350,
          lng: 79.0780,
          address: 'Sadar, Nagpur, Maharashtra'
        },
        isOnline: true,
        subscription: {
          plan: 'monthly',
          status: 'active',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        rating: { average: 4.8, count: 200 },
        isSponsored: true
      }
    ]);

    logger.info('✅ Workshops seeded');

    // Seed Vehicles
    const vehicles = await Vehicle.create([
      {
        user: users[0]._id,
        type: '4W',
        brand: 'Maruti',
        model: 'Swift',
        registrationNumber: 'MH31AB1234',
        color: 'Red',
        fuelType: 'Petrol',
        year: 2020
      },
      {
        user: users[0]._id,
        type: '2W',
        brand: 'Honda',
        model: 'Activa',
        registrationNumber: 'MH31CD5678',
        color: 'Black',
        fuelType: 'Petrol',
        year: 2021
      },
      {
        user: users[1]._id,
        type: 'EV',
        brand: 'Tata',
        model: 'Nexon EV',
        registrationNumber: 'MH31EF9012',
        color: 'White',
        fuelType: 'Electric',
        year: 2022
      }
    ]);

    logger.info('✅ Vehicles seeded');

    logger.info('\n📊 Seed Summary:');
    logger.info(`   Users: ${users.length}`);
    logger.info(`   Workshops: ${workshops.length}`);
    logger.info(`   Vehicles: ${vehicles.length}`);
    logger.info(`   Membership Plans: ${memberships.length}`);
    
    logger.info('\n🔐 Test Credentials:');
    logger.info('   User: john@example.com / password123');
    logger.info('   Workshop: express@example.com / password123');
    logger.info('   Admin: admin@example.com / password123');

    mongoose.connection.close();
    logger.info('\n✅ Database seeding completed successfully!');
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();