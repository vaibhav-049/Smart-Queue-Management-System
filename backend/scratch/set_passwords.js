const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  password: String,
});
const User = mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const superAdminPassword = await bcrypt.hash('2@Vaibhav0790', 10);
  const staffPassword = await bcrypt.hash('12345671', 10);
  
  await User.updateOne({ email: 'soumyabansal184@gmail.com' }, { password: superAdminPassword });
  console.log('Updated soumyabansal184@gmail.com');
  
  const staffEmails = ['hospital_staff@example.com', 'college_staff@example.com', 'salon_staff@example.com'];
  for (const email of staffEmails) {
    await User.updateOne({ email }, { password: staffPassword });
    console.log(`Updated ${email}`);
  }
  
  console.log('Successfully set passwords for live admins.');
  await mongoose.disconnect();
}

run().catch(console.error);
