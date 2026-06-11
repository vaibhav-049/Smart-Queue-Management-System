/**
 * Backend API Integration Test Script
 * Runs via: node backend/scratch/test-api.js
 * Assumes the server is running on http://localhost:5000
 */

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🚀 Starting Smart Queue Backend Integration Test...');
  let adminToken = '';
  let userToken = '';
  let bookedTokenId = '';

  try {
    // 1. Test Base Router
    console.log('\n--- 1. Testing Base API URL ---');
    const baseRes = await fetch('http://localhost:5000/');
    const baseData = await baseRes.json();
    console.log('Base API Response:', baseData);
    if (!baseData.success) throw new Error('Base API test failed');

    // 2. Login Admin
    console.log('\n--- 2. Logging in default Admin (Vikram Patel) ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram@example.com', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.success) throw new Error(`Admin login failed: ${adminLoginData.message}`);
    adminToken = adminLoginData.data.token;
    console.log('✓ Admin login successful. Token acquired.');
    console.log('  User:', adminLoginData.data.user.name, '(' + adminLoginData.data.user.role + ')');

    // 3. Login User
    console.log('\n--- 3. Logging in default User (Priya Sharma) ---');
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@example.com', password: 'user123' }),
    });
    const userLoginData = await userLoginRes.json();
    if (!userLoginData.success) throw new Error(`User login failed: ${userLoginData.message}`);
    userToken = userLoginData.data.token;
    console.log('✓ User login successful. Token acquired.');
    console.log('  User:', userLoginData.data.user.name, '(' + userLoginData.data.user.role + ')');

    // 4. Get user profile via /auth/me
    console.log('\n--- 4. Getting authenticated user profile ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const meData = await meRes.json();
    if (!meData.success) throw new Error(`Get profile failed: ${meData.message}`);
    console.log('✓ Profile retrieved:', meData.data.name, '-', meData.data.email);

    // 5. View Queue Status (Public)
    console.log('\n--- 5. Checking initial Queue Status (Public) ---');
    const queueStatusRes = await fetch(`${BASE_URL}/queues/status`);
    const queueStatusData = await queueStatusRes.json();
    if (!queueStatusData.success) throw new Error('Queue Status check failed');
    const serviceNames = Object.keys(queueStatusData.data);
    console.log('✓ Queue status retrieved. Services:', serviceNames.join(', '));
    for (const svc of serviceNames) {
      const q = queueStatusData.data[svc];
      console.log(`  ${svc}: serving=${q.currentServing || 'none'}, waiting=${q.totalInQueue}, avgWait=${q.avgWait}min`);
    }

    // 6. Book Token as User (Normal priority)
    console.log('\n--- 6. Booking Token for Hospital OPD (Priya - Normal priority) ---');
    const bookRes = await fetch(`${BASE_URL}/tokens/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        service: 'hospital',
        timeSlot: '10:00 AM - 11:00 AM',
        priority: 'normal',
      }),
    });
    const bookData = await bookRes.json();
    if (!bookData.success) throw new Error(`Token booking failed: ${bookData.message}`);
    bookedTokenId = bookData.data._id;
    console.log('✓ Token booked successfully:', bookData.data.displayId);
    console.log('  Position in Line:', bookData.data.position);
    console.log('  Estimated Wait Time:', bookData.data.waitTime, 'mins');
    console.log('  QR Code Generated:', bookData.data.qrCodeUrl ? 'Yes (' + bookData.data.qrCodeUrl.substring(0, 30) + '...)' : 'No');

    // 7. Book Token as Admin for Emergency
    console.log('\n--- 7. Booking Token for Hospital Emergency (Vikram) ---');
    const adminBookRes = await fetch(`${BASE_URL}/tokens/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        service: 'hospital',
        timeSlot: '10:00 AM - 11:00 AM',
        priorityType: 'Emergency',
      }),
    });
    const adminBookData = await adminBookRes.json();
    if (!adminBookData.success) throw new Error(`Admin booking failed: ${adminBookData.message}`);
    console.log('✓ Emergency Token booked:', adminBookData.data.displayId);
    console.log('  Emergency Position (should be ahead of normal):', adminBookData.data.position);

    // 8. Check Queue Status after priority booking
    console.log('\n--- 8. Checking Queue Status after priority booking ---');
    const queueStatusRes2 = await fetch(`${BASE_URL}/queues/status`);
    const queueStatusData2 = await queueStatusRes2.json();
    console.log('✓ Hospital Queue Upcoming:', queueStatusData2.data.hospital.upcoming);
    console.log('  Hospital Currently Serving:', queueStatusData2.data.hospital.currentServing || 'none');

    // 9. Get user's tokens
    console.log('\n--- 9. Getting user tokens (Priya) ---');
    const myTokensRes = await fetch(`${BASE_URL}/tokens/my-tokens`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const myTokensData = await myTokensRes.json();
    if (!myTokensData.success) throw new Error(`Get my tokens failed: ${myTokensData.message}`);
    console.log('✓ User has', myTokensData.data.length, 'tokens');
    myTokensData.data.forEach(t => {
      console.log(`  ${t.displayId} - ${t.service} - ${t.status} - position: ${t.position}`);
    });

    // 10. Admin calls next in Hospital queue
    console.log('\n--- 10. Admin calls Next Patient for Hospital ---');
    const nextRes = await fetch(`${BASE_URL}/admin/queues/hospital/next`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const nextData = await nextRes.json();
    if (!nextData.success) throw new Error(`Call next failed: ${nextData.message}`);
    console.log('✓ Admin action successful:', nextData.message);
    if (nextData.data.nowServing) {
      console.log('  Now Serving:', nextData.data.nowServing.displayId, '(Priority:', nextData.data.nowServing.priority, ')');
    }

    // 11. Check Queue Status after Calling Next
    console.log('\n--- 11. Checking Queue Status after Calling Next ---');
    const queueStatusRes3 = await fetch(`${BASE_URL}/queues/status`);
    const queueStatusData3 = await queueStatusRes3.json();
    console.log('✓ Hospital Queue Now Serving:', queueStatusData3.data.hospital.currentServing);
    console.log('  Hospital Queue Upcoming Remaining:', queueStatusData3.data.hospital.upcoming);

    // 12. Live Queue Tracking
    console.log('\n--- 12. Testing Live Queue Tracking ---');
    const liveRes = await fetch(`${BASE_URL}/queue/live?service=Hospital`);
    const liveData = await liveRes.json();
    console.log('✓ Live Queue - Currently Serving:', liveData.currentlyServing || 'none');
    console.log('  Next Tokens:', liveData.nextTokens);

    // 13. Check Admin Dashboard Analytics
    console.log('\n--- 13. Retrieving Admin Analytics ---');
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await analyticsRes.json();
    if (!analyticsData.success) throw new Error(`Fetch analytics failed: ${analyticsData.message}`);
    console.log('✓ Analytics retrieved successfully.');
    console.log('  Dashboard Stats:', JSON.stringify(analyticsData.data.dashboardStats, null, 2));
    console.log('  Service Usage:', analyticsData.data.serviceUsageData.map(s => `${s.name}: ${s.value}%`).join(', '));
    console.log('  Recent Activity:', analyticsData.data.recentActivity.length, 'entries');

    // 14. Daily Report
    console.log('\n--- 14. Getting Daily Report ---');
    const dailyRes = await fetch(`${BASE_URL}/reports/daily`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dailyData = await dailyRes.json();
    if (!dailyData.success) throw new Error(`Daily report failed: ${dailyData.message}`);
    console.log('✓ Daily Report:', dailyData);

    // 15. Download Reports (JSON)
    console.log('\n--- 15. Downloading Queue Reports in JSON format ---');
    const reportRes = await fetch(`${BASE_URL}/reports/download?format=json`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reportData = await reportRes.json();
    if (!reportData.success) throw new Error(`Download report failed: ${reportData.message}`);
    console.log('✓ Report downloaded successfully. Total record count:', reportData.count);

    // 16. Cancel token
    console.log('\n--- 16. Cancelling booked token ---');
    const cancelRes = await fetch(`${BASE_URL}/tokens/${bookedTokenId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const cancelData = await cancelRes.json();
    if (!cancelData.success) throw new Error(`Cancel token failed: ${cancelData.message}`);
    console.log('✓ Token cancelled:', cancelData.message);

    // 17. Verify access control - User cannot access admin route
    console.log('\n--- 17. Testing access control (user should NOT access admin) ---');
    const forbiddenRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const forbiddenData = await forbiddenRes.json();
    if (forbiddenRes.status === 403) {
      console.log('✓ Access control working: User correctly denied admin access');
    } else {
      throw new Error('Access control BROKEN: User was able to access admin route!');
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log(`   Total tests run: 17`);
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED ❌');
    console.error(error.message);
    process.exit(1);
  }
};

runTests();
