import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDetails from './EmployeeDetails';
import PayrollCard from './PayrollCard';
import { getDashboardData } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    business: null,
    metrics: {
      employeeCount: { total: 0, remaining: 0 },
      userCount: { total: 0, active: 0 }
    },
    payrollSummary: { 
      totalGrossSalary: 0, 
      totalNetSalary: 0 
    },
    performanceReviewsStats: { 
      pendingReviews: 0, 
      completedReviews: 0 
    },
    leaveManagementStats: {
      pendingLeaves: 0,
      approvedLeaves: 0,
      rejectedLeaves: 0
    },
    employees: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [employeeCount, setEmployeeCount] = useState({ total: 0, remaining: 100 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userManagementStats, setUserManagementStats] = useState({
    totalUsers: 0,
    activeUsers: 0
  });

  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    salary: '',
    joiningDate: '',
    startDate: '',
    offerLetter: null
  });

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    type: 'employee',
    permissions: {
      employeeManagement: {
        add: false,
        edit: false,
        delete: false,
        view: false,
        manageOnboarding: false,
        manageDocuments: false,
        setStatus: false
      },
      payrollManagement: {
        processPayroll: false,
        configureSalary: false,
        manageAllowances: false,
        manageDeductions: false,
        generatePayslips: false,
        bulkPayments: false,
        viewReports: false
      },
      performanceManagement: {
        createReviews: false,
        viewAllReviews: false,
        editTemplates: false,
        generateReports: false,
        manageTraining: false,
        trackDevelopment: false
      },
      userManagement: {
        createUsers: false,
        assignRoles: false,
        modifyPermissions: false,
        manageAccounts: false,
        resetPasswords: false,
        manageSecurity: false
      },
      financialServices: {
        configureAdvances: false,
        approveAdvances: false,
        manageWallet: false,
        viewTransactions: false,
        configurePayments: false
      },
      systemAdministration: {
        configureSettings: false,
        manageIntegrations: false,
        handleBackups: false,
        viewAuditTrail: false,
        manageNotifications: false
      }
    }
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [reviewStats, setReviewStats] = useState({ pendingReviews: 0, completedReviews: 0 });

  const fetchDashboardData = useCallback(async (abortController) => {
    try {
      const token = getToken();
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }

      const data = await getDashboardData(abortController?.signal);
      
      if (!abortController?.signal.aborted) {
        console.log('Dashboard data received:', data);
        setDashboardData(prevData => ({
          ...prevData,
          ...data,
          users: data.users || []
        }));
        setEmployeeCount({
          total: data.metrics?.employeeCount?.total || 0,
          remaining: data.metrics?.employeeCount?.remaining || 100
        });
        setReviewStats(data.performanceReviewsStats || {
          pendingReviews: 0,
          completedReviews: 0
        });
        setUserManagementStats({
          totalUsers: data.metrics?.userCount?.total || 0,
          activeUsers: data.metrics?.userCount?.active || 0
        });
        setLoading(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('No authentication token found')) {
          logout();
          navigate('/login');
        }
      }
    }
  }, [navigate, getToken, logout]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchDashboardData]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const employeeData = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        department: newEmployee.department,
        position: newEmployee.position,
        salary: {
          basic: Number(newEmployee.salary),
          allowances: 0,
          deductions: 0
        },
        joiningDate: newEmployee.joiningDate,
        startDate: newEmployee.startDate
      };

      const abortController = new AbortController();

      const response = await fetch('http://localhost:5001/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add employee');
      }

      const addedEmployee = await response.json();
      if (!abortController.signal.aborted) {
      setDashboardData(prevData => ({
        ...prevData,
        employees: [...prevData.employees, addedEmployee]
      }));
      }

      return () => {
        abortController.abort();
      };
    } catch (error) {
      if (error.name !== 'AbortError') {
      console.error('Error adding employee:', error);
        throw error;
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      
      // Format the user data according to the server's expectations
      const userData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        type: newUser.type,
        // The server will handle setting default permissions based on type
      };

      console.log('Sending user data:', userData);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server response:', responseData);
        throw new Error(responseData.error || responseData.message || 'Failed to add user');
      }

      // Update the dashboard data with the new user
      setDashboardData(prevData => ({
        ...prevData,
        users: [...prevData.users, responseData.user]
      }));
      
      // Reset form
      setShowAddUser(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        type: 'employee',
        permissions: {
          employeeManagement: {
            add: false, edit: false, delete: false, view: false,
            manageOnboarding: false, manageDocuments: false, setStatus: false
          },
          payrollManagement: {
            processPayroll: false, configureSalary: false, manageAllowances: false,
            manageDeductions: false, generatePayslips: false, bulkPayments: false,
            viewReports: false
          },
          performanceManagement: {
            createReviews: false, viewAllReviews: false, editTemplates: false,
            generateReports: false, manageTraining: false, trackDevelopment: false
          },
          userManagement: {
            createUsers: false, assignRoles: false, modifyPermissions: false,
            manageAccounts: false, resetPasswords: false, manageSecurity: false
          },
          financialServices: {
            configureAdvances: false, approveAdvances: false, manageWallet: false,
            viewTransactions: false, configurePayments: false
          },
          systemAdministration: {
            configureSettings: false, manageIntegrations: false, handleBackups: false,
            viewAuditTrail: false, manageNotifications: false
          }
        }
      });

      alert('User added successfully!');

    } catch (error) {
      console.error('Error adding user:', error);
      console.error('Error details:', error.message);
      alert(error.message || 'Failed to add user. Please try again.');
    }
  };

  const handleRoleChange = (type) => {
    const rolePermissions = {
      admin: {
        employeeManagement: { add: true, edit: true, delete: true, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
        payrollManagement: { processPayroll: true, configureSalary: true, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: true, viewReports: true },
        performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
        userManagement: { createUsers: true, assignRoles: true, modifyPermissions: true, manageAccounts: true, resetPasswords: true, manageSecurity: true },
        financialServices: { configureAdvances: true, approveAdvances: true, manageWallet: true, viewTransactions: true, configurePayments: true },
        systemAdministration: { configureSettings: true, manageIntegrations: true, handleBackups: true, viewAuditTrail: true, manageNotifications: true }
      },
      hr_manager: {
        employeeManagement: { add: true, edit: true, delete: false, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
        payrollManagement: { processPayroll: true, configureSalary: false, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: false, viewReports: true },
        performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
        userManagement: { createUsers: true, assignRoles: false, modifyPermissions: false, manageAccounts: true, resetPasswords: true, manageSecurity: false },
        financialServices: { configureAdvances: false, approveAdvances: true, manageWallet: false, viewTransactions: true, configurePayments: false },
        systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: true, manageNotifications: false }
      },
      employee: {
        employeeManagement: { add: false, edit: false, delete: false, view: false, manageOnboarding: false, manageDocuments: false, setStatus: false },
        payrollManagement: { processPayroll: false, configureSalary: false, manageAllowances: false, manageDeductions: false, generatePayslips: false, bulkPayments: false, viewReports: false },
        performanceManagement: { createReviews: false, viewAllReviews: false, editTemplates: false, generateReports: false, manageTraining: false, trackDevelopment: false },
        userManagement: { createUsers: false, assignRoles: false, modifyPermissions: false, manageAccounts: false, resetPasswords: false, manageSecurity: false },
        financialServices: { configureAdvances: false, approveAdvances: false, manageWallet: false, viewTransactions: false, configurePayments: false },
        systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: false, manageNotifications: false }
      }
    };

    setNewUser(prev => ({
      ...prev,
      type,
      permissions: rolePermissions[type]
    }));
  };

  const handlePermissionChange = (module, action, value) => {
    setNewUser(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value
        }
      }
    }));
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!dashboardData) return <div style={styles.error}>No data available</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{dashboardData.business?.businessName || 'Dashboard'}</h1>
          <p style={styles.subtitle}>Welcome, {dashboardData.business?.applicantName || 'User'}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* Dashboard Overview Grid */}
      <div style={styles.overviewGrid}>
        {/* Quick Stats */}
        <div style={styles.quickStats}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>📊</span>
            Quick Overview
          </h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Total Workforce</h3>
              <p style={styles.statValue}>
                {dashboardData?.metrics?.employeeCount?.total || 0}
                <span style={styles.statLabel}>Employees</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Monthly Payroll</h3>
              <p style={styles.statValue}>
                R{(dashboardData?.payrollSummary?.totalGrossSalary || 0).toLocaleString()}
                <span style={styles.statLabel}>Gross Total</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>System Users</h3>
              <p style={styles.statValue}>
                {dashboardData?.metrics?.userCount?.active || 0}
                <span style={styles.statLabel}>Active Users</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Leave Requests</h3>
              <p style={styles.statValue}>
                {dashboardData?.leaveManagementStats?.pendingLeaves || 0}
                <span style={styles.statLabel}>Pending</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <form onSubmit={handleAddEmployee} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                style={styles.input}
                type="date"
                value={newEmployee.startDate}
                onChange={(e) => setNewEmployee({...newEmployee, startDate: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Position</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Basic Salary</label>
              <input
                style={styles.input}
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Joining Date</label>
              <input
                style={styles.input}
                type="date"
                value={newEmployee.joiningDate}
                onChange={(e) => setNewEmployee({...newEmployee, joiningDate: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Offer Letter</label>
              <input
                style={styles.input}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNewEmployee({
                  ...newEmployee, 
                  offerLetter: e.target.files[0]
                })}
              />
            </div>
          </div>
          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitBtn}>
              Add Employee
            </button>
            <button 
              type="button" 
              style={styles.cancelBtn}
              onClick={() => {
                setShowAddEmployee(false);
                setNewEmployee({
                  firstName: '',
                  lastName: '',
                  email: '',
                  department: '',
                  position: '',
                  salary: '',
                  joiningDate: '',
                  startDate: '',
                  offerLetter: null
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Add New User</h2>
            <form onSubmit={handleAddUser} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select
                    style={styles.input}
                    value={newUser.type}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={styles.permissionsSection}>
                <h3 style={styles.permissionsTitle}>Permissions</h3>
                
                {/* Employee Management Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>Employee Management</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.employeeManagement).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('employeeManagement', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payroll Management Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>Payroll Management</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.payrollManagement).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('payrollManagement', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Performance Management Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>Performance Management</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.performanceManagement).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('performanceManagement', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                {/* User Management Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>User Management</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.userManagement).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('userManagement', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Financial Services Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>Financial Services</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.financialServices).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('financialServices', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                {/* System Administration Permissions */}
                <div style={styles.permissionGroup}>
                  <h4 style={styles.permissionGroupTitle}>System Administration</h4>
                  <div style={styles.permissionsGrid}>
                    {Object.entries(newUser.permissions.systemAdministration).map(([action, value]) => (
                      <label key={action} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePermissionChange('systemAdministration', action, e.target.checked)}
                          disabled={newUser.type !== 'admin'}
                        />
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={styles.submitBtn}>
                  Add User
                </button>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      type: 'employee',
                      permissions: {
                        employeeManagement: {
                          add: false, edit: false, delete: false, view: false,
                          manageOnboarding: false, manageDocuments: false, setStatus: false
                        },
                        payrollManagement: {
                          processPayroll: false, configureSalary: false, manageAllowances: false,
                          manageDeductions: false, generatePayslips: false, bulkPayments: false,
                          viewReports: false
                        },
                        performanceManagement: {
                          createReviews: false, viewAllReviews: false, editTemplates: false,
                          generateReports: false, manageTraining: false, trackDevelopment: false
                        },
                        userManagement: {
                          createUsers: false, assignRoles: false, modifyPermissions: false,
                          manageAccounts: false, resetPasswords: false, manageSecurity: false
                        },
                        financialServices: {
                          configureAdvances: false, approveAdvances: false, manageWallet: false,
                          viewTransactions: false, configurePayments: false
                        },
                        systemAdministration: {
                          configureSettings: false, manageIntegrations: false, handleBackups: false,
                          viewAuditTrail: false, manageNotifications: false
                        }
                      }
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    padding: '1rem 0',
    borderBottom: '2px solid #e9ecef',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '1.1rem',
  },
  logoutBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  overviewGrid: {
    marginTop: '2rem',
  },
  quickStats: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '400',
    marginTop: '0.25rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1.5rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#e74c3c',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  '@media (max-width: 768px)': {
    formGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    padding: '0.8rem 2rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    '&:hover': {
      backgroundColor: '#219a52',
    },
  },
  cancelBtn: {
    padding: '0.8rem 2rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    fontWeight: '600',
  },
  permissionsSection: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  permissionsTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  permissionGroup: {
    marginBottom: '1.5rem',
  },
  permissionGroupTitle: {
    fontSize: '1rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    color: '#2c3e50',
    cursor: 'pointer',
  },
};

export default Dashboard; 