require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update ALL admins (super admin, hospital, college, salon)
    const result = await User.updateMany(
      { role: 'admin' },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`Successfully reset passwords to 'admin123' for ${result.modifiedCount} admin accounts.`);
    
    const admins = await User.find({ role: 'admin' });
    console.log('Current Admins:');
    admins.forEach(a => console.log(`- ${a.email} (${a.service || 'Super Admin'})`));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
