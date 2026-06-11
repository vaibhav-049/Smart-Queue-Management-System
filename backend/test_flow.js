const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let displayId = '';
let tokenId = '';
const email = `testuser_${Date.now()}@example.com`;

async function testFlow() {
  console.log('--- STARTING COMPLETE PROJECT TEST FLOW ---');

  // 1. Register
  console.log(`\n[1] Registering new user: ${email}...`);
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, phone: '1234567890', password: 'password123' })
  });
  const registerData = await registerRes.json();
  if (!registerData.success) throw new Error('Registration failed: ' + JSON.stringify(registerData));
  authToken = registerData.data.token;
  console.log('✅ Registration successful. JWT Token received.');

  // 2. Book Token
  console.log(`\n[2] Booking a token for Hospital service...`);
  const bookRes = await fetch(`${API_URL}/tokens/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ service: 'Hospital', timeSlot: '10:00 AM - 11:00 AM', priorityType: 'Normal' })
  });
  const bookData = await bookRes.json();
  if (!bookData.success) throw new Error('Booking failed: ' + JSON.stringify(bookData));
  displayId = bookData.data.displayId;
  tokenId = bookData.data._id;
  console.log(`✅ Booking successful. Generated Token: ${displayId}`);

  // 3. Track Token (Public QR endpoint we added)
  console.log(`\n[3] Testing new QR Tracking Endpoint for ${displayId}...`);
  const trackRes = await fetch(`${API_URL}/tokens/track/${displayId}`);
  const trackData = await trackRes.json();
  if (!trackData.success || trackData.data.displayId !== displayId) throw new Error('Tracking failed: ' + JSON.stringify(trackData));
  console.log(`✅ Public Tracking successful. Status: ${trackData.data.status}, Position: ${trackData.data.position}`);

  // 4. Elevate User to Admin
  console.log(`\n[4] Elevating user to Admin via DB...`);
  await mongoose.connect(process.env.MONGODB_URI);
  await User.findOneAndUpdate({ email }, { role: 'admin' });
  console.log('✅ User role elevated to admin.');
  
  // Re-login to get admin token (token payload might contain role if they use it, or middleware checks DB. Usually middleware checks DB but it's safe to re-login)
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const loginData = await loginRes.json();
  authToken = loginData.data.token;
  console.log('✅ Re-logged in as Admin.');

  // 5. Admin Call Next Token
  console.log(`\n[5] Admin calling next token in Hospital queue...`);
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
