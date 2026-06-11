const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Queue = require('../models/Queue');

const seedDatabase = async () => {
  try {
    // 1. Seed Services
    const defaultServices = [
      {
        id: 'hospital',
        name: 'Hospital',
        icon: '🏥',
        color: '#EF4444',
        description: 'Book tokens for hospital OPD, lab tests, and consultations',
        prefix: 'H',
        avgServiceTime: 10,
      },
      {
        id: 'bank',
        name: 'Bank',
        icon: '🏦',
        color: '#3B82F6',
        description: 'Queue for banking services, account operations, and loans',
        prefix: 'B',
        avgServiceTime: 12,
      },
      {
        id: 'college',
        name: 'College Office',
        icon: '🎓',
        color: '#8B5CF6',
        description: 'Student services, transcript requests, and admissions',
        prefix: 'C',
        avgServiceTime: 15,
      },
      {
        id: 'government',
        name: 'Government Office',
        icon: '🏛️',
        color: '#F59E0B',
        description: 'Government document processing, permits, and licenses',
        prefix: 'G',
        avgServiceTime: 20,
      },
      {
        id: 'salon',
        name: 'Salon',
        icon: '💇',
        color: '#EC4899',
        description: 'Haircuts, styling, spa, and beauty services',
        prefix: 'S',
        avgServiceTime: 25,
      },
    ];

    for (const service of defaultServices) {
      const exists = await Service.findOne({ id: service.id });
      if (!exists) {
        await Service.create(service);
        console.log(`Seeded Service: ${service.name}`);
      }
    }

    // 2. Seed Default Queues for Services
    for (const service of defaultServices) {
      const exists = await Queue.findOne({ service: service.id });
      if (!exists) {
        await Queue.create({
          service: service.id,
          currentServing: null,
          upcoming: [],
          totalInQueue: 0,
          avgWait: service.avgServiceTime,
        });
        console.log(`Seeded Queue container for service: ${service.id}`);
      }
    }

    // 3. Seed Users (Admin only)
    const defaultUsers = [
      {
        name: 'Vikram Patel',
        email: 'vikram@example.com',
        phone: '+91 98765 43210',
        password: 'admin123',
        role: 'admin',
      },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Seeded User: ${u.name} (${u.role})`);
      }
    }
    
    console.log('Database verification and seeding complete.');
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Run seeding
    await seedDatabase();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
