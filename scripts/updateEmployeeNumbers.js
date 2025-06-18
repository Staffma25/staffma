const axios = require('axios');

async function updateEmployeeNumbers() {
  try {
    const token = process.env.AUTH_TOKEN; // You'll need to set this environment variable
    if (!token) {
      throw new Error('AUTH_TOKEN environment variable is required');
    }

    const response = await axios.post(
      'http://localhost:5001/api/employees/update-missing-numbers',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

updateEmployeeNumbers(); 