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

export const getBusinessActivityDetails = async (businessId, filters = {}, signal) => {
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
      throw new Error(errorData.message || 'Failed to fetch business activity details');
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Business activity details fetch aborted');
      throw error;
    }
    throw new Error('Failed to fetch business activity details: ' + error.message);
  }
}; 