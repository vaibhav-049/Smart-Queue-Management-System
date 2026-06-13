const mongoose = require('mongoose');
const User = require('./src/models/User');
const OTP = require('./src/models/OTP');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let displayId = '';
let tokenId = '';
const email = `testuser_${Date.now()}@example.com`;

async function testFlow() {
  console.log('--- STARTING COMPLETE PROJECT TEST FLOW ---');

  // 0. Connect to DB at startup
  console.log(`\nConnecting to database at ${process.env.MONGODB_URI}...`);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Database connected.');

  // 1. Register
  console.log(`\n[1] Registering new user: ${email}...`);
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, phone: '9999988888', password: 'password123' })
  });
  const registerData = await registerRes.json();
  if (!registerData.success) throw new Error('Registration failed: ' + JSON.stringify(registerData));
  console.log('✅ Registration request accepted. OTP sent.');

  // 1.5. Fetch OTP from DB and Verify
  console.log('\n[1.5] Fetching OTP from database...');
  const otpRecord = await OTP.findOne({ email, type: 'register' });
  if (!otpRecord) throw new Error('OTP record not found in MongoDB!');
  const otpCode = otpRecord.otp;
  console.log(`✅ Retrieved OTP: ${otpCode}. Verifying registration...`);

  const verifyRes = await fetch(`${API_URL}/auth/verify-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: otpCode })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) throw new Error('OTP verification failed: ' + JSON.stringify(verifyData));
  authToken = verifyData.data.token;
  console.log('✅ Registration successful. JWT Token received.');

  // 2. Book Token
  console.log(`\n[2] Booking a token for Hospital service...`);
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };
  const todayStr = getLocalDateString();

  const bookRes = await fetch(`${API_URL}/tokens/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({
      service: 'hospital',
      timeSlot: '11:00 PM - 11:59 PM',
      priorityType: 'Normal',
      bookingDate: todayStr,
      name: 'Test User',
      phone: '9999988888'
    })
  });
  const bookData = await bookRes.json();
  if (!bookData.success) throw new Error('Booking failed: ' + JSON.stringify(bookData));
  displayId = bookData.data.displayId;
  tokenId = bookData.data._id;
  console.log(`✅ Booking successful. Generated Token Display ID: ${displayId}, ID: ${tokenId}`);

  // 3. Track Token
  console.log(`\n[3] Testing public Tracking Endpoint for ${displayId}...`);
  const trackRes = await fetch(`${API_URL}/tokens/track/${displayId}`);
  const trackData = await trackRes.json();
  if (!trackData.success || trackData.data.displayId !== displayId) throw new Error('Tracking failed: ' + JSON.stringify(trackData));
  console.log(`✅ Public Tracking successful. Status: ${trackData.data.status}, Position: ${trackData.data.position}`);

  // 4. Elevate User to Admin
  console.log(`\n[4] Elevating user to Admin via DB...`);
  await User.findOneAndUpdate({ email }, { role: 'admin' });
  console.log('✅ User role elevated to admin.');
  
  // Re-login to get admin token
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const loginData = await loginRes.json();
  authToken = loginData.data.token;
  console.log('✅ Re-logged in as Admin.');

  // 5. Admin Call Next Token
  console.log(`\n[5] Admin calling next token in hospital queue...`);
  const callRes = await fetch(`${API_URL}/admin/queues/hospital/next`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const callData = await callRes.json();
  if (!callData.success) throw new Error('Call Next failed: ' + JSON.stringify(callData));
  console.log(`✅ Call Next successful. Now Serving: ${callData.data.nowServing ? callData.data.nowServing.displayId : 'None'}`);

  // 6. Admin Analytics
  console.log(`\n[6] Fetching Admin Analytics...`);
  const analyticsRes = await fetch(`${API_URL}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const analyticsData = await analyticsRes.json();
  if (!analyticsData.success) throw new Error('Analytics failed: ' + JSON.stringify(analyticsData));
  console.log(`✅ Analytics fetched successfully. Total Tokens: ${analyticsData.data.dashboardStats.totalTokens}`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The features are perfectly integrated.');
  mongoose.disconnect();
}

testFlow().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
