const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test business registration data
const testBusiness = {
  businessName: 'Test Business Registration Fix',
  email: `testbusiness${Date.now()}@example.com`,
  password: 'testpass123',
  businessType: 'limited',
  applicantName: 'John Doe',
  applicantRole: 'CEO',
  businessAddress: '123 Test Street, Nairobi',
  contactNumber: '+254700000000'
};

async function testRegistrationFix() {
  console.log('🧪 TESTING BUSINESS REGISTRATION FIX');
  console.log('====================================');

  try {
    // Step 1: Register new business
    console.log('\n1️⃣ Registering new business...');
    const registrationResponse = await axios.post(`${API_BASE_URL}/register`, testBusiness);
    
    console.log('✅ Registration successful');
    console.log('Response:', {
      message: registrationResponse.data.message,
      hasToken: !!registrationResponse.data.token,
      hasUser: !!registrationResponse.data.user,
      userType: registrationResponse.data.user?.type,
      userId: registrationResponse.data.user?.id
    });

    // Step 2: Test dashboard access with the token
    console.log('\n2️⃣ Testing dashboard access...');
    const token = registrationResponse.data.token;
    
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Dashboard access successful');
    console.log('Dashboard data:', {
      businessName: dashboardResponse.data.business?.businessName,
      employeeCount: dashboardResponse.data.metrics?.employeeCount,
      userCount: dashboardResponse.data.metrics?.userCount,
      leaveStats: dashboardResponse.data.leaveManagementStats
    });

    // Step 3: Test auth/me endpoint
    console.log('\n3️⃣ Testing auth/me endpoint...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Auth/me endpoint successful');
    console.log('User data:', {
      id: meResponse.data._id,
      businessName: meResponse.data.businessName,
      email: meResponse.data.email,
      type: meResponse.data.type
    });

    console.log('\n🎉 All tests passed! Registration fix is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('ℹ️  Business already exists, this is expected for repeated tests');
    } else {
      console.log('🔍 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  }
}

// Run the test
testRegistrationFix(); 