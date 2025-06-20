import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function StaffmaProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated('staffma')) {
    // Redirect to Staffma login while saving the attempted location
    return <Navigate to="/staffma/login" state={{ from: location }} replace />;
  }

  return children;
}

export default StaffmaProtectedRoute; 