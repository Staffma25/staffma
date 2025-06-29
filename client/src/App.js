import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LogIn from './components/LogIn';
import StaffmaLogin from './components/StaffmaLogin';
import StaffmaRegister from './components/StaffmaRegister';
import Register from './components/Register';
import SubscriptionSelection from './components/SubscriptionSelection';
import PaymentPage from './components/PaymentPage';
import RegistrationSuccess from './components/RegistrationSuccess';
import EmployeesList from './components/EmployeesList';
import EmployeeDetails from './components/EmployeeDetails';
import PayrollManagement from './components/PayrollManagement';
import PayrollSettings from './components/PayrollSettings';
import PayrollReview from './components/PayrollReview';
import PaymentProcessing from './components/PaymentProcessing';
import PayrollWorkflow from './components/PayrollWorkflow';
import PerformanceReviews from './components/PerformanceReviews';
import ReviewForm from './components/ReviewForm';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentProtectedRoute from './components/PaymentProtectedRoute';
import LandingPage from './components/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import UserManagement from './components/UserManagement';
import AddUser from './components/AddUser';
import EmailVerification from './components/EmailVerification';
import ResetPassword from './components/ResetPassword';
import LeaveRequest from './components/LeaveRequest';
import LeaveManagement from './components/LeaveManagement';
import LeaveRequestForm from './components/LeaveRequestForm';
import LeaveRequests from './components/LeaveRequests';
import AddEmployee from './components/AddEmployee';
import Settings from './components/Settings';
import LeaveRequestDetails from './components/LeaveRequestDetails';
import StaffmaDashboard from './components/StaffmaDashboard';
import StaffmaLayout from './components/StaffmaLayout';
import StaffmaProtectedRoute from './components/StaffmaProtectedRoute';
import StaffmaUserManagement from './components/StaffmaUserManagement';
import StaffmaActivityLogs from './components/StaffmaActivityLogs';
import StaffmaBusinesses from './components/StaffmaBusinesses';
import StaffmaAlerts from './components/StaffmaAlerts';
import StaffmaReports from './components/StaffmaReports';
import StaffmaInsights from './components/StaffmaInsights';
import StaffmaPerformance from './components/StaffmaPerformance';
import StaffmaBackups from './components/StaffmaBackups';
import StaffmaLogs from './components/StaffmaLogs';
import StaffmaMaintenance from './components/StaffmaMaintenance';
import StaffmaBusinessManagement from './components/StaffmaBusinessManagement';
import StaffmaSystemSettings from './components/StaffmaSystemSettings';

const DashboardLayout = ({ children }) => {
  const [expandedSections, setExpandedSections] = useState({
    employees: true,
    payroll: true,
    performance: true,
    userManagement: true,
    leaveManagement: true,
    system: true
  });

  const { businessUser, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    logout('business');
    navigate('/login');
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>
            {businessUser?.businessName || 'Business Dashboard'}
          </h2>
          {businessUser?.applicantName && (
            <p style={styles.userInfo}>
              {businessUser.applicantName}
              <br />
              <span style={styles.userRole}>
                {businessUser.applicantRole || 'Business Owner'}
              </span>
            </p>
          )}
        </div>
        <nav style={styles.nav}>
          <a href="/dashboard" style={styles.navItem}>
            <span style={styles.icon}>📊</span>
            Overview
          </a>
          
          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('employees')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>👥</span>
              Employees
              <span style={{
                ...styles.arrow,
                transform: expandedSections.employees ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.employees ? 'flex' : 'none'
            }}>
              <a href="/employees" style={styles.navSubItem}>View Employees</a>
              <a href="/employees/add" style={styles.navSubItem}>Add Employee</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('payroll')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>💰</span>
              Payroll
              <span style={{
                ...styles.arrow,
                transform: expandedSections.payroll ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.payroll ? 'flex' : 'none'
            }}>
              <a href="/payroll/process" style={styles.navSubItem}>Process Payroll</a>
              <a href="/payroll/settings" style={styles.navSubItem}>Payroll Settings</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('performance')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>📈</span>
              Performance
              <span style={{
                ...styles.arrow,
                transform: expandedSections.performance ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.performance ? 'flex' : 'none'
            }}>
              <a href="/performance-reviews/create" style={styles.navSubItem}>Create Review</a>
              <a href="/performance-reviews" style={styles.navSubItem}>View Reviews</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('userManagement')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>👤</span>
              User Management
              <span style={{
                ...styles.arrow,
                transform: expandedSections.userManagement ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.userManagement ? 'flex' : 'none'
            }}>
              <a href="/user-management/add" style={styles.navSubItem}>Add User</a>
              <a href="/user-management" style={styles.navSubItem}>Manage Users</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('leaveManagement')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>📅</span>
              Leave Management
              <span style={{
                ...styles.arrow,
                transform: expandedSections.leaveManagement ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.leaveManagement ? 'flex' : 'none'
            }}>
              <a href="/leave-request" style={styles.navSubItem}>Request Leave</a>
              <a href="/leave-requests" style={styles.navSubItem}>View Requests</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('system')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>⚙️</span>
              System
              <span style={{
                ...styles.arrow,
                transform: expandedSections.system ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.system ? 'flex' : 'none'
            }}>
              <a href="/settings" style={styles.navSubItem}>Business Settings</a>
            </div>
          </div>
        </nav>
        
        {/* Logout Button */}
        <div style={styles.logoutSection}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.icon}>🚪</span>
            Logout
          </button>
        </div>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/staffma/login" element={<StaffmaLogin />} />
            <Route path="/staffma/register" element={<StaffmaRegister />} />
            <Route path="//staffma/login" element={<Navigate to="/staffma/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subscription" element={<SubscriptionSelection />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected routes with DashboardLayout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <EmployeesList />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/:id" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <EmployeeDetails />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll/process" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PayrollManagement />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll/settings" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PayrollSettings />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll/workflow/:month/:year" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PayrollWorkflow />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll/review/:month/:year" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PayrollReview />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll/payments/:month/:year" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PaymentProcessing />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/performance-reviews" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <PerformanceReviews />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/performance-reviews/create" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <ReviewForm />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-management/*" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <UserManagement />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-management/add" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <AddUser />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-management/*" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <LeaveManagement />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-request" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <LeaveRequest />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-requests" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <LeaveRequests />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees/add" 
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <AddEmployee />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-details/:id"
              element={
                <ProtectedRoute>
                  <PaymentProtectedRoute>
                  <DashboardLayout>
                    <LeaveRequestDetails />
                  </DashboardLayout>
                  </PaymentProtectedRoute>
                </ProtectedRoute>
              }
            />

            {/* Staffma Routes */}
            <Route 
              path="/staffma/dashboard" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaDashboard />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/users" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaUserManagement />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/activities" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaActivityLogs />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/businesses" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaBusinesses />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/alerts" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaAlerts />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/reports" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaReports />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/insights" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaInsights />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/performance" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaPerformance />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/backups" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaBackups />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/logs" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaLogs />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/maintenance" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaMaintenance />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/businesses/manage" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaBusinessManagement />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />
            <Route 
              path="/staffma/system-settings" 
              element={
                <StaffmaProtectedRoute>
                  <StaffmaLayout>
                    <StaffmaSystemSettings />
                  </StaffmaLayout>
                </StaffmaProtectedRoute>
              } 
            />

            {/* Catch-all route for malformed URLs */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '220px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '12px 0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  sidebarHeader: {
    padding: '0 15px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 500,
    color: 'white',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 15px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  navGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 15px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.875rem',
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  icon: {
    fontSize: '0.875rem',
    width: '16px',
    textAlign: 'center',
  },
  navSubItem: {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    padding: '6px 15px 6px 35px',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  content: {
    flex: 1,
    marginLeft: '220px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  arrow: {
    marginLeft: 'auto',
    fontSize: '0.625rem',
    transition: 'transform 0.2s ease',
  },
  subItems: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'height 0.2s ease',
  },
  userInfo: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.8)',
  },
  userRole: {
    fontWeight: 500,
  },
  logoutSection: {
    padding: '12px 15px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  logoutButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
};

export default App;
