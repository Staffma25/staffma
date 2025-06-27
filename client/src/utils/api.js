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

// Business Management API calls (for Staffma)
export const getAllBusinesses = async (signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/business/all`, { signal }, 'staffma');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch businesses');
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Businesses fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch businesses: ' + error.message);
  }
};

export const updateBusinessDetails = async (businessId, data, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/business/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal
    }, 'staffma');
    
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

export const suspendBusiness = async (businessId, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/business/${businessId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal
    }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to suspend business');
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business suspend aborted');
      throw error;
    }
    throw new Error('Failed to suspend business: ' + error.message);
  }
};

export const reactivateBusiness = async (businessId, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/business/${businessId}/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal
    }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reactivate business');
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business reactivate aborted');
      throw error;
    }
    throw new Error('Failed to reactivate business: ' + error.message);
  }
};

// Activities API calls
export const getActivities = async (filters = {}, signal) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.severity) queryParams.append('severity', filters.severity);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
    if (filters.businessId) queryParams.append('businessId', filters.businessId);
    if (filters.userId) queryParams.append('userId', filters.userId);
    if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.page) queryParams.append('page', filters.page);

    const url = `${API_BASE_URL}/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithAuth(url, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch activities');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Activities fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch activities: ' + error.message);
  }
};

export const getActivity = async (id, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/activities/${id}`, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch activity');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Activity fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch activity: ' + error.message);
  }
};

export const getActivitySummary = async (signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/activities/summary`, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch activity summary');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Activity summary fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch activity summary: ' + error.message);
  }
};

export const exportActivities = async (filters = {}, signal) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.severity) queryParams.append('severity', filters.severity);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
    if (filters.businessId) queryParams.append('businessId', filters.businessId);
    if (filters.userId) queryParams.append('userId', filters.userId);
    if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);

    const url = `${API_BASE_URL}/activities/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithAuth(url, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export activities');
    }
    
    const blob = await response.blob();
    const url2 = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url2;
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url2);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Activity export aborted');
      throw error;
    }
    throw new Error('Failed to export activities: ' + error.message);
  }
};

export const deleteActivity = async (id, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      signal
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete activity');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Activity deletion aborted');
      throw error;
    }
    throw new Error('Failed to delete activity: ' + error.message);
  }
};

export const bulkDeleteActivities = async (ids, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/activities`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids }),
      signal
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete activities');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Bulk activity deletion aborted');
      throw error;
    }
    throw new Error('Failed to delete activities: ' + error.message);
  }
};

export const getBusinessActivities = async (signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/activities/businesses`, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch business activities');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business activities fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch business activities: ' + error.message);
  }
};

export const getBusinessDetails = async (businessId, filters = {}, signal) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.severity) queryParams.append('severity', filters.severity);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.page) queryParams.append('page', filters.page);

    const url = `${API_BASE_URL}/activities/business/${businessId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithAuth(url, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch business details');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business details fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch business details: ' + error.message);
  }
};

// Staffma User Management API calls
export const getStaffmaUsers = async (signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/staffma/users`, { signal }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch Staffma users');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Staffma users fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch Staffma users: ' + error.message);
  }
};

export const createStaffmaUser = async (userData, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/staffma/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      signal
    }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create Staffma user');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Staffma user creation aborted');
      throw error;
    }
    throw new Error('Failed to create Staffma user: ' + error.message);
  }
};

export const updateStaffmaUser = async (userId, userData, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/staffma/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      signal
    }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update Staffma user');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Staffma user update aborted');
      throw error;
    }
    throw new Error('Failed to update Staffma user: ' + error.message);
  }
};

export const deleteStaffmaUser = async (userId, signal) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/staffma/users/${userId}`, {
      method: 'DELETE',
      signal
    }, 'staffma');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete Staffma user');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Staffma user deletion aborted');
      throw error;
    }
    throw new Error('Failed to delete Staffma user: ' + error.message);
  }
}; 