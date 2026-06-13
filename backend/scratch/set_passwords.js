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
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const emails = ['vikram@example.com', 'rvaibhav403@gmail.com', 'vrajput202005@gmail.com'];
  for (const email of emails) {
    const res = await User.updateOne({ email }, { password: hashedPassword });
    console.log(`Updated ${email}:`, res);
  }
  
  console.log('Successfully set password to 123456 for test users.');
  await mongoose.disconnect();
}

run().catch(console.error);
