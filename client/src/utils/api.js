import { fetchWithAuth } from './auth';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Business API calls
export const getBusiness = async (signal) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/business`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch business data');
  }
  return response.json();
};

// Employees API calls
export const getEmployees = async (signal) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/employees`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
};

// Dashboard API calls
export const getDashboardData = async (signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/dashboard`, { signal });
  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch dashboard data');
  }
  return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Dashboard data fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch dashboard data: ' + error.message);
  }
};

// Update business API calls
export const updateBusiness = async (data, signal) => {
  try {
  const response = await fetchWithAuth(`${API_BASE_URL}/business/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
      body: JSON.stringify(data),
      signal
  });
    
  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update business');
  }
  return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business update aborted');
      throw error;
    }
    throw new Error('Failed to update business: ' + error.message);
  }
}; 

export const resetPassword = async (token, password, signal) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Password reset aborted');
      throw error;
    }
    console.error('Password reset error:', error);
    throw new Error('Failed to reset password: ' + error.message);
  }
}; 