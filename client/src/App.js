import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LogIn from './components/LogIn';
import Register from './components/Register';
import EmployeesList from './components/EmployeesList';
import EmployeeDetails from './components/EmployeeDetails';
import PayrollManagement from './components/PayrollManagement';
import PerformanceReviews from './components/PerformanceReviews';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute>
              <EmployeesList />
            </ProtectedRoute>
          } />
          <Route path="/employee/:id" element={
            <ProtectedRoute>
              <EmployeeDetails />
            </ProtectedRoute>
          } />
          <Route path="/payroll" element={
            <ProtectedRoute>
              <PayrollManagement />
            </ProtectedRoute>
          } />
          <Route path="/performance-reviews" element={
            <ProtectedRoute>
              <PerformanceReviews />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
  }
};

export default App;
