import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create axios instance with interceptors
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const api = axios.create({
  baseURL: API_BASE_URL
});

export const AuthProvider = ({ children }) => {
  const [businessUser, setBusinessUser] = useState(null);
  const [staffmaUser, setStaffmaUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for existing tokens on app load
    const businessToken = localStorage.getItem('businessToken');
    const staffmaToken = localStorage.getItem('staffmaToken');

    if (businessToken) {
      const decodedToken = decodeToken(businessToken);
      if (decodedToken) {
        fetchUserData(businessToken, 'business');
      } else {
        localStorage.removeItem('businessToken');
      }
    }

    if (staffmaToken) {
      const decodedToken = decodeToken(staffmaToken);
      if (decodedToken) {
        fetchUserData(staffmaToken, 'staffma');
    } else {
        localStorage.removeItem('staffmaToken');
      }
    }

    setLoading(false);
  }, []);

  const fetchUserData = async (token, userType) => {
    try {
      let endpoint = '/auth/me'; // Default for business users
      if (userType === 'staffma') {
        endpoint = '/staffma/profile';
        console.log('Refreshing Staffma user session...');
      } else {
        console.log('Refreshing Business user session...');
      }

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data) {
        if (userType === 'staffma') {
          setStaffmaUser(response.data);
        } else {
          setBusinessUser(response.data);
        }
      } else {
        throw new Error(`No user data received from ${endpoint}`);
      }
    } catch (error) {
      console.error('Error fetching user data on refresh:', error);
      
      // Check if token is expired and try to refresh
      if (error.response?.status === 401) {
        console.log(`${userType} token expired, attempting to refresh...`);
        
        const refreshResult = await refreshToken(userType);
        if (refreshResult.success) {
          // Retry the user data fetch with the new token
          console.log(`${userType} token refreshed successfully, retrying user data fetch`);
          return await fetchUserData(refreshResult.token, userType);
        } else {
          console.log(`${userType} token refresh failed, clearing session`);
          if (userType === 'staffma') {
            localStorage.removeItem('staffmaToken');
            localStorage.removeItem('staffmaRefreshToken');
            setStaffmaUser(null);
          } else {
            localStorage.removeItem('businessToken');
            localStorage.removeItem('businessRefreshToken');
            setBusinessUser(null);
          }
        }
      } else {
        // For other errors, keep the token but clear the user state
        if (userType === 'staffma') {
          setStaffmaUser(null);
        } else {
          setBusinessUser(null);
        }
      }
    }
  };

  const refreshToken = async (userType) => {
    try {
      const refreshTokenKey = userType === 'staffma' ? 'staffmaRefreshToken' : 'businessRefreshToken';
      const refreshToken = localStorage.getItem(refreshTokenKey);
      
      if (!refreshToken) {
        console.log(`No refresh token found for ${userType}`);
        return { success: false, error: 'No refresh token available' };
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken
      });

      const { token: newToken } = response.data;
      
      if (newToken) {
        // Store the new token
        const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
        localStorage.setItem(tokenKey, newToken);
        console.log(`${userType} token refreshed successfully`);
        return { success: true, token: newToken };
      } else {
        console.log(`No new token received for ${userType}`);
        return { success: false, error: 'No new token received' };
      }
    } catch (error) {
      console.error(`Error refreshing ${userType} token:`, error);
      return { success: false, error: error.message };
    }
  };

  // Add response interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Determine user type from the request
          const businessToken = localStorage.getItem('businessToken');
          const staffmaToken = localStorage.getItem('staffmaToken');
          
          let userType = null;
          if (originalRequest.headers.Authorization?.includes(businessToken)) {
            userType = 'business';
          } else if (originalRequest.headers.Authorization?.includes(staffmaToken)) {
            userType = 'staffma';
          }

          if (userType) {
            const refreshResult = await refreshToken(userType);
            if (refreshResult.success) {
              // Update the authorization header with the new token
              const tokenKey = userType === 'staffma' ? 'staffmaToken' : 'businessToken';
              const newToken = localStorage.getItem(tokenKey);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Retry the original request
              return api(originalRequest);
            } else {
              // Token refresh failed, clear session
              if (userType === 'staffma') {
                localStorage.removeItem('staffmaToken');
                localStorage.removeItem('staffmaRefreshToken');
                setStaffmaUser(null);
              } else {
                localStorage.removeItem('businessToken');
                localStorage.removeItem('businessRefreshToken');
                setBusinessUser(null);
              }
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting business login with:', { email });
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      console.log('Business login response:', response.data);

      const { token, refreshToken, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Ensure user type is set correctly
      if (!user.type) {
        user.type = 'business';
      }

      // Check for payment status in the response
      if (user.paymentStatus === 'pending') {
        return {
          success: true,
          paymentRequired: true,
          businessData: {
            businessName: user.businessName,
            email: user.email,
            businessType: user.businessType,
            applicantName: user.applicantName,
            applicantRole: user.applicantRole,
            businessAddress: user.businessAddress,
            contactNumber: user.contactNumber
          }
        };
      }

      // Check for suspended account
      if (user.suspended) {
        return {
          success: false,
          suspended: true,
          error: 'Your account has been suspended. Please contact support.'
        };
      }

      // Check for inactive subscription
      if (user.subscription && user.subscription.status === 'inactive') {
        return {
          success: true,
          subscriptionInactive: true,
          businessData: {
            businessName: user.businessName,
            email: user.email,
            payment: user.payment,
            subscription: user.subscription
          }
        };
      }

      console.log('Setting business user:', user);
      localStorage.setItem('businessToken', token);
      if (refreshToken) {
        localStorage.setItem('businessRefreshToken', refreshToken);
      }
      setBusinessUser(user);

      return { success: true, user };

    } catch (error) {
      console.error('Business login error:', error);
      
      // Handle specific error responses
      if (error.response?.status === 402) {
        const errorData = error.response.data;
        if (errorData.paymentRequired) {
          return {
            success: true,
            paymentRequired: true,
            businessData: errorData.businessData
          };
        }
        if (errorData.subscriptionInactive) {
          return {
            success: true,
            subscriptionInactive: true,
            businessData: errorData.businessData
          };
        }
      }
      
      if (error.response?.status === 403 && error.response.data?.suspended) {
        return {
          success: false,
          suspended: true,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials and try again.'
      };
    }
  };
  
  const staffmaLogin = async (email, password) => {
    try {
      console.log('Attempting Staffma login with:', { email });
      
      const response = await axios.post(`${API_BASE_URL}/staffma/login`, {
        email,
        password
      });

      console.log('Staffma login response:', response.data);

      const { token, refreshToken, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('staffmaToken', token);
      if (refreshToken) {
        localStorage.setItem('staffmaRefreshToken', refreshToken);
      }
      setStaffmaUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('Staffma login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials and try again.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { token, refreshToken, user } = response.data;
      localStorage.setItem('businessToken', token);
      if (refreshToken) {
        localStorage.setItem('businessRefreshToken', refreshToken);
      }
      setBusinessUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const staffmaRegister = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/staffma/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = (userType = 'all') => {
    console.log('User logged out:', userType);
    if (userType === 'staffma' || userType === 'all') {
      localStorage.removeItem('staffmaToken');
      localStorage.removeItem('staffmaRefreshToken');
      setStaffmaUser(null);
    }
    if (userType === 'business' || userType === 'all') {
      localStorage.removeItem('businessToken');
      localStorage.removeItem('businessRefreshToken');
      setBusinessUser(null);
    }
  };

  const getToken = (userType = 'business') => {
    if (userType === 'staffma') {
      return localStorage.getItem('staffmaToken');
    }
    return localStorage.getItem('businessToken');
  };

  const isAuthenticated = (userType = 'business') => {
    if (userType === 'staffma') {
      return !!staffmaUser;
    }
    return !!businessUser;
  };

  const isBusinessUser = () => {
    return !!businessUser;
  };

  const isStaffmaUser = () => {
    return !!staffmaUser;
  };

  const getCurrentUser = (userType = 'business') => {
    if (userType === 'staffma') {
      return staffmaUser;
    }
    return businessUser;
  };

  const hasPermission = (module, action, userType = 'business') => {
    const user = userType === 'staffma' ? staffmaUser : businessUser;
    if (!user) return false;
    
    // Handle Staffma users
    if (user.type === 'staffma') {
      return user.permissions?.[module]?.[action] || false;
    }
    
    // Handle business users
    if (user.type === 'user' || user.type === 'business') {
    return user.permissions?.[module]?.[action] || false;
    }
    
    return false;
  };

  // Inactivity logout logic
  useEffect(() => {
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in ms
    let inactivityTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (businessUser || staffmaUser) {
        inactivityTimer = setTimeout(() => {
          if (businessUser) logout('business');
          if (staffmaUser) logout('staffma');
          alert('You have been logged out due to inactivity.');
        }, INACTIVITY_LIMIT);
      }
    };

    // Listen for user activity
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start timer if logged in
    if (businessUser || staffmaUser) {
      resetInactivityTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [businessUser, staffmaUser]);

  const value = {
    businessUser,
    staffmaUser,
    loading,
    login,
    staffmaLogin,
    register,
    staffmaRegister,
    logout,
    getToken,
    isAuthenticated,
    isBusinessUser,
    isStaffmaUser,
    getCurrentUser,
    hasPermission,
    setBusinessUser,
    setStaffmaUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 