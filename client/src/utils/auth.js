// Authentication utility functions
const API_BASE_URL = 'http://localhost:5001/api';

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('No authentication token found');
    }

    console.log('Making authenticated request to:', url);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token available');
        throw new Error('No refresh token available');
      }

      // Try to refresh the token
      const refreshResponse = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        throw new Error('Failed to refresh token');
      }

      const { token: newToken } = await refreshResponse.json();
      localStorage.setItem('token', newToken);
      console.log('Token refreshed successfully');

      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        },
        credentials: 'include'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }
}; 