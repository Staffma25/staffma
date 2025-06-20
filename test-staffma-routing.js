const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const CLIENT_URL = 'http://localhost:3000';

// Test data
const testStaffmaUser = {
  firstName: 'Test',
  lastName: 'StaffmaAdmin',
  email: 'test.staffma@example.com',
  password: 'testpassword123',
  role: 'admin'
};

async function testStaffmaRouting() {
  console.log('🧪 TESTING STAFFMA ROUTING AND NAVIGATION');
  console.log('==========================================\n');

  try {
    // Step 1: Register a Staffma user
    console.log('1️⃣ Registering Staffma user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/staffma/register`, testStaffmaUser);
    console.log('✅ Staffma registration successful:', registerResponse.data.message);

    // Step 2: Test Staffma login
    console.log('\n2️⃣ Testing Staffma login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/staffma/login`, {
      email: testStaffmaUser.email,
      password: testStaffmaUser.password
    });
    
    const { token, user } = loginResponse.data;
    console.log('✅ Staffma login successful');
    console.log('   User type:', user.type);
    console.log('   User role:', user.role);
    console.log('   Token received:', !!token);

    // Step 3: Test Staffma profile endpoint
    console.log('\n3️⃣ Testing Staffma profile endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/api/staffma/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Staffma profile endpoint working');
    console.log('   Profile user type:', profileResponse.data.type);

    // Step 4: Test activities endpoint (Staffma only)
    console.log('\n4️⃣ Testing Staffma activities endpoint...');
    const activitiesResponse = await axios.get(`${BASE_URL}/api/activities/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Staffma activities endpoint working');
    console.log('   Activities summary received');

    console.log('\n🎉 ALL STAFFMA ROUTING TESTS PASSED!');
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
    console.log('================================');
    console.log('1. Go to: http://localhost:3000/');
    console.log('2. Click "Staffma System Login"');
    console.log('3. Login with credentials:');
    console.log(`   Email: ${testStaffmaUser.email}`);
    console.log(`   Password: ${testStaffmaUser.password}`);
    console.log('4. Verify you are redirected to: http://localhost:3000/staffma/dashboard');
    console.log('5. Verify the Staffma dashboard loads correctly');
    console.log('6. Test logout - should redirect to: http://localhost:3000/staffma/login');
    console.log('7. Try accessing business routes - should redirect to business dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('\n🔄 User already exists, testing login instead...');
      await testStaffmaLogin();
    }
  }
}

async function testStaffmaLogin() {
  try {
    console.log('\n🔄 Testing Staffma login with existing user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/staffma/login`, {
      email: testStaffmaUser.email,
      password: testStaffmaUser.password
    });
    
    const { token, user } = loginResponse.data;
    console.log('✅ Staffma login successful');
    console.log('   User type:', user.type);
    console.log('   User role:', user.role);
    console.log('   Token received:', !!token);

    console.log('\n🎉 STAFFMA LOGIN TEST PASSED!');
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
    console.log('================================');
    console.log('1. Go to: http://localhost:3000/staffma/login');
    console.log('2. Login with credentials:');
    console.log(`   Email: ${testStaffmaUser.email}`);
    console.log(`   Password: ${testStaffmaUser.password}`);
    console.log('3. Verify you are redirected to: http://localhost:3000/staffma/dashboard');
    console.log('4. Verify the Staffma dashboard loads correctly');

  } catch (error) {
    console.error('❌ Staffma login test failed:', error.response?.data || error.message);
  }
}

// Run the test
testStaffmaRouting(); 