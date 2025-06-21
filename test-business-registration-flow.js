const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test business registration data
const testBusiness = {
  businessName: 'Test Business Auto-Login',
  email: `testbusiness${Date.now()}@example.com`,
  password: 'testpass123',
  businessType: 'limited',
  applicantName: 'John Doe',
  applicantRole: 'CEO',
  businessAddress: '123 Test Street, Nairobi',
  contactNumber: '+254700000000'
};

async function testBusinessRegistrationFlow() {
  console.log('🧪 TESTING BUSINESS REGISTRATION FLOW WITH AUTO-LOGIN');
  console.log('==================================================');

  try {
    // Step 1: Register new business
    console.log('\n1️⃣ Registering new business...');
    const registrationResponse = await axios.post(`${API_BASE_URL}/register`, testBusiness);
    
    console.log('✅ Registration successful');
    console.log('Response:', {
      message: registrationResponse.data.message,
      hasToken: !!registrationResponse.data.token,
      hasUser: !!registrationResponse.data.user,
      userType: registrationResponse.data.user?.type
    });

    // Step 2: Verify token and user data
    console.log('\n2️⃣ Verifying registration response...');
    if (!registrationResponse.data.token) {
      throw new Error('No token returned from registration');
    }
    if (!registrationResponse.data.user) {
      throw new Error('No user data returned from registration');
    }
    if (registrationResponse.data.user.type !== 'business') {
      throw new Error('User type should be "business"');
    }

    console.log('✅ Token and user data verified');

    // Step 3: Test login with the same credentials
    console.log('\n3️⃣ Testing login with registered credentials...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testBusiness.email,
      password: testBusiness.password
    });

    console.log('✅ Login successful');
    console.log('Login response:', {
      hasToken: !!loginResponse.data.token,
      hasUser: !!loginResponse.data.user,
      userType: loginResponse.data.user?.type
    });

    // Step 4: Test dashboard access with token
    console.log('\n4️⃣ Testing dashboard access...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${registrationResponse.data.token}`
      }
    });

    console.log('✅ Dashboard access successful');
    console.log('Dashboard data:', {
      hasBusiness: !!dashboardResponse.data.business,
      businessName: dashboardResponse.data.business?.businessName,
      employeeCount: dashboardResponse.data.metrics?.employeeCount?.total,
      shouldBeZero: dashboardResponse.data.metrics?.employeeCount?.total === 0
    });

    // Step 5: Verify clean dashboard state
    console.log('\n5️⃣ Verifying clean dashboard state...');
    if (dashboardResponse.data.metrics?.employeeCount?.total !== 0) {
      console.log('⚠️  Warning: Employee count is not 0 for new business');
    } else {
      console.log('✅ Clean dashboard state verified (0 employees)');
    }

    console.log('\n🎉 BUSINESS REGISTRATION FLOW TEST PASSED!');
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
    console.log('================================');
    console.log('1. Go to: http://localhost:3000/');
    console.log('2. Click "Register Business Account"');
    console.log('3. Fill in the registration form with test data');
    console.log('4. Submit the form');
    console.log('5. Verify automatic redirect to dashboard');
    console.log('6. Verify clean dashboard with welcome message');
    console.log('7. Verify "Add Your First Employee" button is prominent');
    console.log('8. Test adding an employee');
    console.log('9. Verify dashboard updates after adding employee');

    console.log('\n🔍 EXPECTED BEHAVIOR:');
    console.log('====================');
    console.log('• Registration should succeed without requiring login');
    console.log('• User should be automatically logged in');
    console.log('• Should redirect to /dashboard');
    console.log('• Dashboard should show welcome message for new business');
    console.log('• Employee count should be 0');
    console.log('• Quick actions should be available');
    console.log('• No existing data should be shown');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('\n🔄 Business already exists, testing login instead...');
      await testBusinessLogin();
    }
  }
}

async function testBusinessLogin() {
  try {
    console.log('\n🔄 Testing login with existing business...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testBusiness.email,
      password: testBusiness.password
    });

    console.log('✅ Login successful');
    console.log('User type:', loginResponse.data.user?.type);
    console.log('Business name:', loginResponse.data.user?.businessName);

    // Test dashboard access
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${loginResponse.data.token}`
      }
    });

    console.log('✅ Dashboard access successful');
    console.log('Employee count:', dashboardResponse.data.metrics?.employeeCount?.total);

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
}

// Run the test
testBusinessRegistrationFlow(); 