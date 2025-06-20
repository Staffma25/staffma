import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      let endpoint = `${API_BASE_URL}/auth/me`; // Default for business users
      if (userType === 'staffma') {
        endpoint = `${API_BASE_URL}/staffma/profile`;
        console.log('Refreshing Staffma user session...');
      } else {
        console.log('Refreshing Business user session...');
      }

      const response = await axios.get(endpoint, {
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
      
      // Check if token is expired
      if (error.response?.status === 401) {
        console.log(`${userType} token expired, clearing session`);
        if (userType === 'staffma') {
          localStorage.removeItem('staffmaToken');
          setStaffmaUser(null);
        } else {
          localStorage.removeItem('businessToken');
          setBusinessUser(null);
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

  const login = async (email, password) => {
    try {
      console.log('Attempting business login with:', { email });
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      console.log('Business login response:', response.data);

      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('businessToken', token);
      setBusinessUser(user);

      return { success: true, user };

    } catch (error) {
      console.error('Business login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials and try again.'
      };
    }
  };
  
  const staffmaLogin = async (email, password) => {
    try {
      console.log('Attempting Staffma login with:', { email });
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      const response = await axios.post(`${API_BASE_URL}/staffma/login`, {
        email,
        password
      });

      console.log('Staffma login response:', response.data);

      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('staffmaToken', token);
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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { token, user } = response.data;
      localStorage.setItem('businessToken', token);
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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
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
      setStaffmaUser(null);
    }
    if (userType === 'business' || userType === 'all') {
      localStorage.removeItem('businessToken');
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
    hasPermission
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