// Authentication utility functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const fetchWithAuth = async (url, options = {}, userType = 'business') => {
  try {
    const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      console.error(`No ${userType} authentication token found`);
      throw new Error(`No ${userType} authentication token found`);
    }

    console.log('Making authenticated request to:', url);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      signal: options.signal
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      const refreshTokenKey = userType === 'staffma' ? 'staffmaRefreshToken' : 'businessRefreshToken';
      const refreshToken = localStorage.getItem(refreshTokenKey);
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
        credentials: 'include',
        signal: options.signal
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        throw new Error('Failed to refresh token');
      }

      const { token: newToken } = await refreshResponse.json();
      localStorage.setItem(tokenKey, newToken);
      console.log('Token refreshed successfully');

      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        },
        credentials: 'include',
        signal: options.signal
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Handle specific error cases
      if (response.status === 401) {
        if (errorData.error === 'Token expired, no refresh token provided') {
          // Clear tokens and redirect to login
          const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
          const refreshTokenKey = userType === 'staffma' ? 'staffmaRefreshToken' : 'businessRefreshToken';
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(refreshTokenKey);
          const loginUrl = userType === 'staffma' ? '/staffma/login' : '/login';
          window.location.href = loginUrl;
        }
        throw new Error(errorData.message || 'Authentication failed. Please log in again.');
      }
      
      throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      throw error;
    }
    console.error('Error in fetchWithAuth:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const refreshToken = async (signal, userType = 'business') => {
  try {
    const refreshTokenKey = userType === 'staffma' ? 'staffmaRefreshToken' : 'businessRefreshToken';
    const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
      signal
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem(tokenKey, data.token);
    return data.token;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Token refresh aborted');
      throw error;
    }
    console.error('Error refreshing token:', error);
    // If refresh fails, clear tokens and redirect to appropriate login
    const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
    const refreshTokenKey = userType === 'staffma' ? 'staffmaRefreshToken' : 'businessRefreshToken';
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    const loginUrl = userType === 'staffma' ? '/staffma/login' : '/login';
    window.location.href = loginUrl;
    throw error;
  }
}; 