const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testLeaveRequestFix() {
  try {
    console.log('🧪 Testing Leave Request Fix...\n');

    // Test 1: Check if leave request submission works with valid user data
    console.log('1. Testing leave request submission...');
    
    const testData = {
      type: 'annual',
      startDate: '2024-12-20',
      endDate: '2024-12-22',
      reason: 'Test leave request for debugging',
      duration: '3'
    };

    const response = await axios.post(`${API_BASE_URL}/leaves`, testData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 201) {
      console.log('✅ Leave request submission successful');
      console.log('Leave request created:', {
        id: response.data._id,
        employeeId: response.data.employeeId,
        type: response.data.type,
        status: response.data.status,
        department: response.data.department
      });
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.status);
    
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      console.log('Error details:', errorData);
      
      if (errorData.error === 'User profile incomplete') {
        console.log('✅ Correctly caught missing user profile data');
        console.log('Expected behavior: User needs to complete their profile');
      } else {
        console.log('❌ Unexpected 400 error:', errorData);
      }
    } else if (error.response?.status === 500) {
      console.log('❌ Server error:', error.response.data);
      
      // Check if it's the employee validation error
      if (error.response.data.details && error.response.data.details.includes('firstName')) {
        console.log('❌ This is the employee validation error we\'re trying to fix');
        console.log('The fix should handle business users properly');
      }
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 2: Check if we can fetch leave requests
  console.log('\n2. Testing leave requests fetch...');
  
  try {
    const fetchResponse = await axios.get(`${API_BASE_URL}/leaves`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`
      }
    });

    if (fetchResponse.status === 200) {
      console.log('✅ Leave requests fetch successful');
      console.log(`Found ${fetchResponse.data.length} leave requests`);
      
      if (fetchResponse.data.length > 0) {
        console.log('Sample leave request:', {
          id: fetchResponse.data[0]._id,
          employeeId: fetchResponse.data[0].employeeId,
          type: fetchResponse.data[0].type,
          status: fetchResponse.data[0].status
        });
      }
    }
  } catch (error) {
    console.log('❌ Failed to fetch leave requests:', error.response?.status);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }

  // Test 3: Check user profile information
  console.log('\n3. Testing user profile information...');
  
  try {
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`
      }
    });

    if (userResponse.status === 200) {
      console.log('✅ User profile fetch successful');
      const userData = userResponse.data;
      console.log('User data:', {
        id: userData._id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        type: userData.type,
        businessId: userData.businessId
      });
    }
  } catch (error) {
    console.log('❌ Failed to fetch user profile:', error.response?.status);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }

  console.log('\n✅ Leave request fix test completed!');
}

// Run the test
testLeaveRequestFix(); 