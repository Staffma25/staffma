const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testStaffmaRegistration() {
  try {
    console.log('Testing Staffma registration and login functionality...\n');

    // Test 1: Register first Staffma super admin
    console.log('1. Testing Staffma super admin registration...');
    
    const registrationData = {
      firstName: 'Staffma',
      lastName: 'Super Admin',
      email: 'superadmin@staffma.com',
      password: 'superadmin123',
      role: 'super_admin'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/staffma/register`, registrationData);
      
      console.log('✅ Registration successful');
      console.log('User data:', {
        id: registerResponse.data.user.id,
        email: registerResponse.data.user.email,
        firstName: registerResponse.data.user.firstName,
        lastName: registerResponse.data.user.lastName,
        role: registerResponse.data.user.role
      });
      
    } catch (registerError) {
      if (registerError.response?.status === 400 && registerError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Super admin already exists, proceeding to login test');
      } else {
        console.log('❌ Registration failed:', registerError.response?.data?.message || registerError.message);
        return;
      }
    }

    // Test 2: Login with Staffma super admin credentials
    console.log('\n2. Testing Staffma super admin login...');
    
    const loginData = {
      email: 'superadmin@staffma.com',
      password: 'superadmin123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/staffma/login`, loginData);
    
    if (loginResponse.data.token && loginResponse.data.user) {
      console.log('✅ Login successful');
      console.log('User data:', {
        id: loginResponse.data.user.id,
        email: loginResponse.data.user.email,
        firstName: loginResponse.data.user.firstName,
        lastName: loginResponse.data.user.lastName,
        role: loginResponse.data.user.role,
        type: loginResponse.data.user.type,
        permissions: loginResponse.data.user.permissions
      });
      
      const token = loginResponse.data.token;
      
      // Test 3: Access Staffma profile
      console.log('\n3. Testing Staffma profile access...');
      
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/staffma/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Staffma profile access successful');
        console.log('Profile data:', profileResponse.data);
        
      } catch (profileError) {
        console.log('❌ Staffma profile access failed:', profileError.response?.data?.message || profileError.message);
      }
      
      // Test 4: Register another Staffma user (admin)
      console.log('\n4. Testing Staffma admin user registration...');
      
      const adminRegistrationData = {
        firstName: 'Staffma',
        lastName: 'Admin',
        email: 'admin@staffma.com',
        password: 'admin123',
        role: 'admin'
      };

      try {
        const adminRegisterResponse = await axios.post(`${API_BASE_URL}/staffma/register`, adminRegistrationData);
        
        console.log('✅ Admin registration successful');
        console.log('Admin user data:', {
          id: adminRegisterResponse.data.user.id,
          email: adminRegisterResponse.data.user.email,
          firstName: adminRegisterResponse.data.user.firstName,
          lastName: adminRegisterResponse.data.user.lastName,
          role: adminRegisterResponse.data.user.role
        });
        
      } catch (adminRegisterError) {
        if (adminRegisterError.response?.status === 400 && adminRegisterError.response?.data?.message?.includes('already exists')) {
          console.log('ℹ️  Admin user already exists');
        } else {
          console.log('❌ Admin registration failed:', adminRegisterError.response?.data?.message || adminRegisterError.message);
        }
      }
      
      // Test 5: Get all Staffma users
      console.log('\n5. Testing get all Staffma users...');
      
      try {
        const usersResponse = await axios.get(`${API_BASE_URL}/staffma/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Get Staffma users successful');
        console.log('Users count:', usersResponse.data.users.length);
        console.log('Users:', usersResponse.data.users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          status: u.status
        })));
        
      } catch (usersError) {
        console.log('❌ Get Staffma users failed:', usersError.response?.data?.message || usersError.message);
      }
      
    } else {
      console.log('❌ Login failed - no token or user data received');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Instructions for testing
function showTestInstructions() {
  console.log('\n📋 TESTING INSTRUCTIONS:');
  console.log('========================');
  console.log('1. Make sure the server is running on port 5001');
  console.log('2. Make sure the client is running on port 3000');
  console.log('3. Test the registration flow:');
  console.log('   - Go to: http://localhost:3000/');
  console.log('   - Click "Register Staffma Account"');
  console.log('   - Fill in the registration form');
  console.log('   - Submit and verify success message');
  console.log('4. Test the login flow:');
  console.log('   - Go to: http://localhost:3000/staffma/login');
  console.log('   - Login with the registered credentials');
  console.log('   - Verify redirection to Staffma dashboard');
  console.log('5. Test the dashboard:');
  console.log('   - Verify Staffma dashboard loads correctly');
  console.log('   - Check that business users cannot access Staffma routes');
  
  console.log('\n🌐 NEW ROUTES:');
  console.log('==============');
  console.log('• Staffma Registration: http://localhost:3000/staffma/register');
  console.log('• Staffma Login: http://localhost:3000/staffma/login');
  console.log('• Staffma Dashboard: http://localhost:3000/staffma/dashboard');
  console.log('• Landing Page: http://localhost:3000/');
  
  console.log('\n🔍 DEBUGGING TIPS:');
  console.log('==================');
  console.log('• Check browser console for any errors');
  console.log('• Verify user type in AuthContext');
  console.log('• Ensure user has type: "staffma"');
  console.log('• Check if user data is properly stored in AuthContext state');
  console.log('• Verify StaffmaProtectedRoute is working correctly');
}

// Run the test
testStaffmaRegistration().then(() => {
  showTestInstructions();
}).catch(error => {
  console.error('Test execution failed:', error);
  showTestInstructions();
}); 