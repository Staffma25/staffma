// Authentication utility functions
const API_BASE_URL = 'http://localhost:5001/api';

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const newToken = await refreshToken();
      // Retry the request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      });
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
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
      body: JSON.stringify({ refreshToken })
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