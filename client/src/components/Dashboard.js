import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDetails from './EmployeeDetails';
import PayrollCard from './PayrollCard';
import { getDashboardData } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

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
    users: [],
    recentActivities: [],
    payrollSummary: {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getToken, logout, businessUser } = useAuth();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [employeeCount, setEmployeeCount] = useState({ total: 0, remaining: 100 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userManagementStats, setUserManagementStats] = useState({
    totalUsers: 0,
    activeUsers: 0
  });
  const [businessCurrency, setBusinessCurrency] = useState('KES');

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

      // Log current business user for debugging
      console.log('Current business user:', businessUser);
      console.log('Fetching dashboard data for business:', businessUser?.businessName || businessUser?.email);

      const data = await getDashboardData(abortController?.signal);
      
      if (!abortController?.signal.aborted) {
        console.log('Dashboard data received:', data);
        console.log('Business data:', data.business);
        console.log('Employee count:', data.metrics?.employeeCount);
        console.log('User count:', data.metrics?.userCount);
        
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
  }, [navigate, getToken, logout, businessUser]);

  const fetchBusinessCurrency = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/business', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusinessCurrency(data.currency || 'KES');
      }
    } catch (error) {
      console.error('Error fetching business currency:', error);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(abortController);
    fetchBusinessCurrency();
    return () => {
      abortController.abort();
    };
  }, [fetchDashboardData, fetchBusinessCurrency]);

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
          <h1 style={styles.title}>
            {dashboardData.business?.businessName || businessUser?.businessName || 'Dashboard'}
          </h1>
          <p style={styles.subtitle}>
            Welcome, {dashboardData.business?.applicantName || businessUser?.applicantName || 'User'}
          </p>
          {dashboardData.business && (
            <div style={styles.businessInfo}>
              <span style={styles.businessId}>Business ID: {dashboardData.business._id}</span>
              <span style={styles.businessEmail}>Email: {dashboardData.business.email}</span>
            </div>
          )}
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
                {getCurrencySymbol(businessCurrency)} {formatCurrency(dashboardData?.payrollSummary?.totalGrossSalary || 0)}
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

        {/* Payroll Summary Section */}
        {dashboardData?.metrics?.employeeCount?.total > 0 && (
          <div style={styles.payrollSummarySection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>💰</span>
              Payroll Summary
            </h2>
            <div style={styles.payrollSummaryGrid}>
              <div style={styles.payrollSummaryCard}>
                <div style={styles.payrollCardIcon}>👥</div>
                <span style={styles.payrollCardLabel}>Employees</span>
                <span style={styles.payrollCardValue}>{dashboardData?.metrics?.employeeCount?.total || 0}</span>
              </div>
              <div style={styles.payrollSummaryCard}>
                <div style={styles.payrollCardIcon}>💰</div>
                <span style={styles.payrollCardLabel}>Gross Salary</span>
                <span style={styles.payrollCardValue}>
                  <span style={styles.currencyText}>{getCurrencySymbol(businessCurrency)}</span>
                  <span style={styles.numberValue}>{formatCurrency(dashboardData?.payrollSummary?.totalGrossSalary || 0)}</span>
                </span>
              </div>
              <div style={styles.payrollSummaryCard}>
                <div style={styles.payrollCardIcon}>💵</div>
                <span style={styles.payrollCardLabel}>Net Salary</span>
                <span style={styles.payrollCardValue}>
                  <span style={styles.currencyText}>{getCurrencySymbol(businessCurrency)}</span>
                  <span style={styles.numberValue}>{formatCurrency(dashboardData?.payrollSummary?.totalNetSalary || 0)}</span>
                </span>
              </div>
              <div style={styles.payrollSummaryCard}>
                <div style={styles.payrollCardIcon}>➕</div>
                <span style={styles.payrollCardLabel}>Allowances</span>
                <span style={styles.payrollCardValue}>
                  <span style={styles.currencyText}>{getCurrencySymbol(businessCurrency)}</span>
                  <span style={styles.numberValue}>{formatCurrency(dashboardData?.payrollSummary?.totalAllowances || 0)}</span>
                </span>
              </div>
              <div style={styles.payrollSummaryCard}>
                <div style={styles.payrollCardIcon}>➖</div>
                <span style={styles.payrollCardLabel}>Deductions</span>
                  <span style={styles.payrollCardValue}>
                  <span style={styles.currencyText}>{getCurrencySymbol(businessCurrency)}</span>
                  <span style={styles.numberValue}>{formatCurrency(dashboardData?.payrollSummary?.totalDeductions || 0)}</span>
                  </span>
                </div>
            </div>
          </div>
        )}

        {/* Welcome Section for New Businesses */}
        {dashboardData?.metrics?.employeeCount?.total === 0 && (
          <div style={styles.welcomeSection}>
            <div style={styles.welcomeContent}>
              <div style={styles.welcomeIcon}>🎉</div>
              <h2 style={styles.welcomeTitle}>Welcome to Your Business Dashboard!</h2>
              <p style={styles.welcomeText}>
                You've successfully set up your business account. Now let's get started by adding your first employee.
              </p>
              <div style={styles.welcomeActions}>
                <button 
                  onClick={() => setShowAddEmployee(true)} 
                  style={styles.primaryAction}
                >
                  <span style={styles.actionIcon}>👥</span>
                  Add Your First Employee
                </button>
                <button 
                  onClick={() => navigate('/employees')} 
                  style={styles.secondaryAction}
                >
                  <span style={styles.actionIcon}>📋</span>
                  View Employee Management
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Employees Section */}
        {dashboardData?.metrics?.employeeCount?.total > 0 && (
          <div style={styles.recentEmployeesSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>👥</span>
              Recent Employees
            </h2>
            <div style={styles.employeesList}>
              {dashboardData.employees && dashboardData.employees.length > 0 ? (
                dashboardData.employees.slice(0, 5).map((employee) => (
                  <div key={employee._id} style={styles.employeeCard}>
                    <div style={styles.employeeInfo}>
                      <h4 style={styles.employeeName}>
                        {employee.firstName} {employee.lastName}
                      </h4>
                      <p style={styles.employeePosition}>{employee.position}</p>
                      <p style={styles.employeeDepartment}>{employee.department}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>👥</div>
                  <h3 style={styles.emptyStateTitle}>No Employees Yet</h3>
                  <p style={styles.emptyStateText}>
                    Start building your team by adding your first employee.
                  </p>
                  <button 
                    onClick={() => setShowAddEmployee(true)} 
                    style={styles.emptyStateAction}
                  >
                    Add Employee
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activities Section */}
        <div style={styles.recentActivitiesSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>🕒</span>
            Recent Activities
          </h2>
          <div style={styles.activitiesList}>
            {dashboardData?.metrics?.employeeCount?.total > 0 ? (
              <div style={styles.activityItem}>
                <span style={styles.activityIcon}>📊</span>
                <span style={styles.activityText}>
                  Dashboard loaded successfully with {dashboardData.metrics.employeeCount.total} employees
                </span>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📋</div>
                <h3 style={styles.emptyStateTitle}>No Activities Yet</h3>
                <p style={styles.emptyStateText}>
                  Activities will appear here as you start using the system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Add New Employee</h2>
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
          </div>
        </div>
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
    padding: '15px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px 0',
    borderBottom: '1px solid #e9ecef',
  },
  title: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '4px',
    fontWeight: '600',
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '0.8rem',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  overviewGrid: {
    marginTop: '15px',
  },
  quickStats: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.07)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '4px',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '400',
    marginTop: '2px',
  },
  sectionTitle: {
    fontSize: '1rem',
    color: '#2c3e50',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#7f8c8d',
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    color: '#e74c3c',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '15px',
  },
  '@media (max-width: 768px)': {
    formGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    '&:hover': {
      backgroundColor: '#219a52',
    },
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
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
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '1.125rem',
    color: '#2c3e50',
    marginBottom: '15px',
    fontWeight: '600',
  },
  permissionsSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  permissionsTitle: {
    fontSize: '0.9rem',
    color: '#2c3e50',
    marginBottom: '10px',
    fontWeight: '600',
  },
  permissionGroup: {
    marginBottom: '15px',
  },
  permissionGroupTitle: {
    fontSize: '0.8rem',
    color: '#2c3e50',
    marginBottom: '4px',
    fontWeight: '600',
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: '#2c3e50',
    cursor: 'pointer',
  },
  welcomeSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '25px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  welcomeContent: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  welcomeIcon: {
    fontSize: '2rem',
    marginBottom: '12px',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  },
  welcomeTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '10px'
  },
  welcomeText: {
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: '1.5',
    marginBottom: '20px'
  },
  welcomeActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryAction: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
    '&:hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)'
    }
  },
  secondaryAction: {
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
  },
  actionIcon: {
    fontSize: '0.9rem'
  },
  recentEmployeesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  employeesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  employeeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    padding: '15px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      borderColor: '#3b82f6'
    }
  },
  employeeInfo: {
    marginBottom: '10px'
  },
  employeeName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px'
  },
  employeePosition: {
    color: '#64748b',
    fontSize: '0.7rem',
    marginBottom: '2px'
  },
  employeeDepartment: {
    color: '#94a3b8',
    fontSize: '0.7rem',
    fontStyle: 'italic'
  },
  viewEmployeeBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#2563eb'
    }
  },
  recentActivitiesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  activityIcon: {
    fontSize: '1rem'
  },
  activityText: {
    color: '#475569',
    fontSize: '0.7rem'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '25px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px dashed #e2e8f0'
  },
  emptyStateIcon: {
    fontSize: '1.75rem',
    color: '#94a3b8',
    marginBottom: '10px',
    opacity: '0.7'
  },
  emptyStateTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px'
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: '0.7rem',
    lineHeight: '1.4',
    marginBottom: '15px',
    maxWidth: '250px'
  },
  emptyStateAction: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#2563eb'
    }
  },
  businessInfo: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '4px',
    display: 'flex',
    gap: '8px'
  },
  businessId: {
    fontWeight: '600'
  },
  businessEmail: {
    fontWeight: '400'
  },
  payrollSummarySection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  payrollSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px'
  },
  payrollSummaryCard: {
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  payrollCardIcon: {
    fontSize: '1.5rem',
    marginBottom: '10px'
  },
  payrollCardLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '600'
  },
  payrollCardValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  },
  currencyText: {
    fontSize: '0.6rem',
    color: '#64748b',
    fontWeight: '400'
  },
  numberValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#0f172a'
  }
};

export default Dashboard; 