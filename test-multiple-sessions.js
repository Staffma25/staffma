const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const CLIENT_URL = 'http://localhost:3000';

// Test data - using existing users
const testBusinessUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testStaffmaUser = {
  email: 'test.staffma@example.com',
  password: 'testpassword123'
};

async function testMultipleSessions() {
  console.log('🧪 TESTING MULTIPLE CONCURRENT SESSIONS');
  console.log('========================================\n');

  try {
    // Step 1: Login as business user
    console.log('1️⃣ Logging in as business user...');
    const businessLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testBusinessUser.email,
      password: testBusinessUser.password
    });
    
    const businessToken = businessLoginResponse.data.token;
    const businessUser = businessLoginResponse.data.user;
    console.log('✅ Business login successful');
    console.log('   User type:', businessUser.type);
    console.log('   Business name:', businessUser.businessName || 'N/A');

    // Step 2: Login as Staffma user (should work concurrently)
    console.log('\n2️⃣ Logging in as Staffma user (concurrent session)...');
    const staffmaLoginResponse = await axios.post(`${BASE_URL}/api/staffma/login`, {
      email: testStaffmaUser.email,
      password: testStaffmaUser.password
    });
    
    const staffmaToken = staffmaLoginResponse.data.token;
    const staffmaUser = staffmaLoginResponse.data.user;
    console.log('✅ Staffma login successful');
    console.log('   User type:', staffmaUser.type);
    console.log('   User role:', staffmaUser.role);

    // Step 3: Test both sessions are active
    console.log('\n3️⃣ Testing both sessions are active...');
    
    // Test business user session
    const businessProfileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${businessToken}` }
    });
    console.log('✅ Business session active:', businessProfileResponse.data.type);

    // Test Staffma user session
    const staffmaProfileResponse = await axios.get(`${BASE_URL}/api/staffma/profile`, {
      headers: { Authorization: `Bearer ${staffmaToken}` }
    });
    console.log('✅ Staffma session active:', staffmaProfileResponse.data.type);

    // Step 4: Test Staffma-only endpoints with Staffma token
    console.log('\n4️⃣ Testing Staffma-only endpoints...');
    const activitiesResponse = await axios.get(`${BASE_URL}/api/activities/summary`, {
      headers: { Authorization: `Bearer ${staffmaToken}` }
    });
    console.log('✅ Staffma activities endpoint accessible');

    // Step 5: Test business endpoints with business token
    console.log('\n5️⃣ Testing business endpoints...');
    try {
      const businessDashboardResponse = await axios.get(`${BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${businessToken}` }
      });
      console.log('✅ Business dashboard endpoint accessible');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Business dashboard endpoint not implemented yet');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 MULTIPLE SESSIONS TEST PASSED!');
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
    console.log('================================');
    console.log('1. Open two browser windows/tabs');
    console.log('2. In first window:');
    console.log('   - Go to: http://localhost:3000/login');
    console.log('   - Login with business credentials:');
    console.log(`     Email: ${testBusinessUser.email}`);
    console.log(`     Password: ${testBusinessUser.password}`);
    console.log('   - Verify you are on business dashboard');
    console.log('3. In second window:');
    console.log('   - Go to: http://localhost:3000/staffma/login');
    console.log('   - Login with Staffma credentials:');
    console.log(`     Email: ${testStaffmaUser.email}`);
    console.log(`     Password: ${testStaffmaUser.password}`);
    console.log('   - Verify you are on Staffma dashboard');
    console.log('4. Both sessions should remain active simultaneously');
    console.log('5. Test switching between windows - both should work');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMultipleSessions(); 