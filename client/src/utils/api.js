import { fetchWithAuth } from './auth';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Business API calls
export const getBusiness = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/business`);
  if (!response.ok) {
    throw new Error('Failed to fetch business data');
  }
  return response.json();
};

// Employees API calls
export const getEmployees = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/employees`);
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
};

// Dashboard API calls
export const getDashboardData = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
};

// Update business API calls
export const updateBusiness = async (data) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/business/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update business');
  }
  return response.json();
}; 

export const resetPassword = async (token, password) => {
  try {
    const response = await fetch(`http://localhost:5001/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}; 