const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testStaffmaLogin() {
  try {
    console.log('Testing Staffma login functionality...\n');

    // Test 1: Login with Staffma admin credentials
    console.log('1. Testing Staffma admin login...');
    
    const loginData = {
      email: 'admin@staffma.com', // You'll need to create this user
      password: 'admin123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    
    if (loginResponse.data.token && loginResponse.data.user) {
      console.log('✅ Login successful');
      console.log('User data:', {
        id: loginResponse.data.user._id,
        email: loginResponse.data.user.email,
        firstName: loginResponse.data.user.firstName,
        lastName: loginResponse.data.user.lastName,
        type: loginResponse.data.user.type,
        permissions: loginResponse.data.user.permissions
      });
      
      const token = loginResponse.data.token;
      
      // Test 2: Access Staffma dashboard
      console.log('\n2. Testing Staffma dashboard access...');
      
      try {
        const dashboardResponse = await axios.get(`${API_BASE_URL}/activities/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Staffma dashboard access successful');
        console.log('Summary data:', dashboardResponse.data);
        
      } catch (dashboardError) {
        console.log('❌ Staffma dashboard access failed:', dashboardError.response?.data?.message || dashboardError.message);
      }
      
      // Test 3: Access regular dashboard (should be denied)
      console.log('\n3. Testing regular dashboard access (should be denied)...');
      
      try {
        const regularDashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('❌ Regular dashboard access should have been denied');
        
      } catch (regularError) {
        console.log('✅ Regular dashboard access correctly denied:', regularError.response?.data?.message || regularError.message);
      }
      
    } else {
      console.log('❌ Login failed - no token or user data received');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('This might be because the Staffma admin user doesn\'t exist yet.');
      console.log('You need to create a user with role: "admin" and type: "user"');
    }
  }
}

// Instructions for setting up Staffma admin user
function showSetupInstructions() {
  console.log('\n📋 SETUP INSTRUCTIONS FOR STAFFMA ADMIN USER:');
  console.log('==============================================');
  console.log('1. First, create a Staffma admin user using the existing user creation endpoint');
  console.log('2. Use these credentials:');
  console.log('   - Email: admin@staffma.com');
  console.log('   - Password: admin123');
  console.log('   - Type: admin');
  console.log('3. Make sure the user has admin permissions');
  console.log('4. Then run this test again');
  console.log('\nExample API call to create Staffma admin:');
  console.log(`
POST ${API_BASE_URL}/auth/create-user
Headers: { Authorization: "Bearer <existing_admin_token>" }
Body: {
  "firstName": "Staffma",
  "lastName": "Admin",
  "email": "admin@staffma.com",
  "password": "admin123",
  "type": "admin"
}
  `);
  
  console.log('\n🌐 NEW LOGIN ROUTES:');
  console.log('===================');
  console.log('• Business Login: http://localhost:3000/login');
  console.log('• Staffma System Login: http://localhost:3000/staffma/login');
  console.log('• Landing Page: http://localhost:3000/');
  
  console.log('\n🔍 DEBUGGING TIPS:');
  console.log('==================');
  console.log('• Check browser console for any errors');
  console.log('• Verify user type in AuthContext');
  console.log('• Ensure user has type: "admin"');
  console.log('• Check if user data is properly stored in AuthContext state');
}

// Run the test
testStaffmaLogin().then(() => {
  showSetupInstructions();
}).catch(error => {
  console.error('Test execution failed:', error);
  showSetupInstructions();
}); 