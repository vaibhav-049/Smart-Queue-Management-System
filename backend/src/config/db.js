const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const Branch = require('../models/Branch');
const { getLocalDateString } = require('../utils/dateUtils');

const seedDatabase = async () => {
  try {
    
    const defaultBranches = [
      { id: 'main', name: 'Main Campus / Head Office', location: 'City Center' },
      { id: 'north', name: 'North Branch', location: 'North District' },
    ];

    for (const branch of defaultBranches) {
      const exists = await Branch.findOne({ id: branch.id });
      if (!exists) {
        await Branch.create(branch);
        console.log(`Seeded Branch: ${branch.name}`);
      }
    }

    
    const defaultServices = [
      {
        id: 'hospital',
        name: 'Hospital',
        branchId: 'main',
        icon: '🏥',
        color: '#EF4444',
        description: 'Book tokens for hospital OPD, lab tests, and consultations',
        prefix: 'H',
        avgServiceTime: 10,
      },
      {
        id: 'college',
        name: 'College Office',
        branchId: 'main',
        icon: '🎓',
        color: '#8B5CF6',
        description: 'Student services, transcript requests, and admissions',
        prefix: 'C',
        avgServiceTime: 15,
      },
      {
        id: 'salon',
        name: 'Salon',
        branchId: 'main',
        icon: '💇',
        color: '#EC4899',
        description: 'Haircuts, styling, spa, and beauty services',
        prefix: 'S',
        avgServiceTime: 25,
      },
      {
        id: 'hospital-north',
        name: 'Hospital (North)',
        branchId: 'north',
        icon: '🏥',
        color: '#3B82F6',
        description: 'North Branch OPD & Consultations',
        prefix: 'HN',
        avgServiceTime: 10,
      },
    ];

    
    const allowedServiceIds = defaultServices.map(s => s.id);
    const deleteServicesResult = await Service.deleteMany({ id: { $nin: allowedServiceIds } });
    if (deleteServicesResult.deletedCount > 0) {
      console.log(`Removed ${deleteServicesResult.deletedCount} deprecated services from DB.`);
    }
    const deleteQueuesResult = await Queue.deleteMany({ service: { $nin: allowedServiceIds } });
    if (deleteQueuesResult.deletedCount > 0) {
      console.log(`Removed ${deleteQueuesResult.deletedCount} deprecated queues from DB.`);
    }

    for (const service of defaultServices) {
      const exists = await Service.findOne({ id: service.id });
      if (!exists) {
        await Service.create(service);
        console.log(`Seeded Service: ${service.name}`);
      }
    }

    
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

    
    const defaultUsers = [
      {
        name: 'Soumya Bansal',
        email: 'soumyabansal184@gmail.com',
        phone: '+91 98765 43210',
        password: process.env.ADMIN_SEED_PASSWORD || (Math.random().toString(36).slice(-10) + 'A1!'),
        role: 'admin',
        service: null, 
      },
      {
        name: 'Hospital Staff',
        email: 'hospital_staff@example.com',
        phone: '+91 98765 43211',
        password: process.env.ADMIN_SEED_PASSWORD || (Math.random().toString(36).slice(-10) + 'A1!'),
        role: 'admin',
        service: 'hospital', 
      },
      {
        name: 'College Staff',
        email: 'college_staff@example.com',
        phone: '+91 98765 43212',
        password: process.env.ADMIN_SEED_PASSWORD || (Math.random().toString(36).slice(-10) + 'A1!'),
        role: 'admin',
        service: 'college', 
      },
      {
        name: 'Salon Staff',
        email: 'salon_staff@example.com',
        phone: '+91 98765 43213',
        password: process.env.ADMIN_SEED_PASSWORD || (Math.random().toString(36).slice(-10) + 'A1!'),
        role: 'admin',
        service: 'salon', 
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
    
    
    try {
      await mongoose.connection.collection('tokens').dropIndex('displayId_1');
      console.log('Stale unique index displayId_1 successfully dropped.');
    } catch (e) {
      
    }

    
    try {

      const todayStr = getLocalDateString();
      
      const tokens = await mongoose.connection.collection('tokens').find({}).toArray();
      let migratedCount = 0;
      for (const token of tokens) {
        let rawDate = token.bookingDate;
        let formattedDate = '';
        
        if (!rawDate) {
          const d = token.createdAt ? new Date(token.createdAt) : new Date();
          const offset = d.getTimezoneOffset();
          const localDate = new Date(d.getTime() - (offset * 60 * 1000));
          formattedDate = localDate.toISOString().split('T')[0];
        } else if (rawDate instanceof Date) {
          const offset = rawDate.getTimezoneOffset();
          const localDate = new Date(rawDate.getTime() - (offset * 60 * 1000));
          formattedDate = localDate.toISOString().split('T')[0];
        } else if (typeof rawDate === 'string') {
          if (rawDate.includes('T')) {
            formattedDate = rawDate.split('T')[0];
          } else {
            formattedDate = rawDate.trim();
          }
        }
        
        if (formattedDate && /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          if (token.bookingDate !== formattedDate) {
            await mongoose.connection.collection('tokens').updateOne(
              { _id: token._id },
              { $set: { bookingDate: formattedDate } }
            );
            migratedCount++;
          }
        }
      }
      if (migratedCount > 0) {
        console.log(`Successfully migrated ${migratedCount} legacy tokens to YYYY-MM-DD bookingDate format.`);
      }
    } catch (e) {
      console.error('Error running legacy token migration:', e);
    }

    
    await seedDatabase();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
