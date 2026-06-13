const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});
const User = mongoose.model('User', UserSchema);

async function run() {
  console.log('Connecting to database:', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}).limit(10);
  console.log('Found users:', JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
