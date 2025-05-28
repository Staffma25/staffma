import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDetails from './EmployeeDetails';
import PayrollCard from './PayrollCard';
import { getDashboardData } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    business: null,
    metrics: {
      employeeCount: { total: 0, remaining: 100 },
      userCount: { total: 0, active: 0 }
    },
    payrollSummary: { totalGrossSalary: 0, totalNetSalary: 0 },
    performanceReviewsStats: { pendingReviews: 0, completedReviews: 0 },
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

  const [isEditing, setIsEditing] = useState(false);
  const [editedBusiness, setEditedBusiness] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [reviewStats, setReviewStats] = useState({ pendingReviews: 0, completedReviews: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.error('No authentication token found');
          navigate('/login');
          return;
        }

        const data = await getDashboardData();
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
        setPayrollSummary(data.payrollSummary || {
          totalGrossSalary: 0,
          totalNetSalary: 0
        });
        setReviewStats(data.performanceReviewsStats || {
          pendingReviews: 0,
          completedReviews: 0
        });
        setUserManagementStats({
          totalUsers: data.metrics?.userCount?.total || 0,
          activeUsers: data.metrics?.userCount?.active || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('No authentication token found')) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, getToken, logout]);

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

      const response = await fetch('http://localhost:5001/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add employee');
      }

      const addedEmployee = await response.json();
      setDashboardData(prevData => ({
        ...prevData,
        employees: [...prevData.employees, addedEmployee]
      }));
      
      // Reset form
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

      alert('Employee added successfully!');

    } catch (error) {
      console.error('Error adding employee:', error);
      if (error.message.includes('No authentication token found')) {
        logout();
        navigate('/login');
      } else {
      alert(error.message || 'Failed to add employee. Please try again.');
      }
    }
  };

  const handleEditBusiness = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5001/api/business/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedBusiness)
      });

      if (!response.ok) {
        throw new Error('Failed to update business information');
      }

      const updatedBusiness = await response.json();
      setDashboardData(prevData => ({
        ...prevData,
        business: updatedBusiness
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating business:', error);
      if (error.message.includes('No authentication token found')) {
        logout();
        navigate('/login');
      } else {
        setError(error.message);
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

      {/* Business Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Business Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
              Edit Info
            </button>
          ) : (
            <div style={styles.editButtons}>
              <button onClick={handleEditBusiness} style={styles.saveBtn}>
                Save
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedBusiness(dashboardData.business);
                }} 
                style={styles.cancelEditBtn}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.label}>Business Type:</span>
            {isEditing ? (
              <select
                style={styles.input}
                value={editedBusiness?.businessType}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  businessType: e.target.value
                })}
              >
                <option value="limited">Limited Company</option>
                <option value="sole">Sole Proprietorship</option>
              </select>
            ) : (
              <span>{dashboardData.business?.businessType === 'limited' ? 'Limited Company' : 'Sole Proprietorship'}</span>
            )}
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Contact Email:</span>
            <span>{dashboardData.business?.email}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Contact Number:</span>
            {isEditing ? (
              <input
                style={styles.input}
                type="tel"
                value={editedBusiness?.contactNumber}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  contactNumber: e.target.value
                })}
              />
            ) : (
              <span>{dashboardData.business?.contactNumber}</span>
            )}
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Address:</span>
            {isEditing ? (
              <input
                style={styles.input}
                type="text"
                value={editedBusiness?.businessAddress}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  businessAddress: e.target.value
                })}
              />
            ) : (
              <span>{dashboardData.business?.businessAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* Three Main Cards Section */}
      <div style={styles.cardsContainer}>
        {/* Employees Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Employees</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Total Employees</span>
                <h3>{employeeCount.total}</h3>
              </div>
              <div style={styles.stat}>
                <span>Remaining Slots</span>
                <h3>{employeeCount.remaining}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/employees')} 
                style={styles.actionButton}
              >
                View Employee List
              </button>
            </div>
          </div>
        </div>

        {/* Payroll Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Payroll Management</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Total Gross Salary</span>
                <h3>KES {payrollSummary?.totalGrossSalary?.toLocaleString() || 0}</h3>
              </div>
              <div style={styles.stat}>
                <span>Total Net Salary</span>
                <h3>KES {payrollSummary?.totalNetSalary?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/payroll')} 
                style={styles.actionButton}
              >
                Manage Payroll
              </button>
            </div>
          </div>
        </div>

        {/* Performance Reviews Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Performance Reviews</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Pending Reviews</span>
                <h3>{reviewStats.pendingReviews}</h3>
              </div>
              <div style={styles.stat}>
                <span>Completed Reviews</span>
                <h3>{reviewStats.completedReviews}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/performance-reviews')} 
                style={styles.actionButton}
              >
                View Reviews
              </button>
            </div>
          </div>
        </div>

        {/* User Management Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>User Management</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Total Users</span>
                <h3>{userManagementStats.totalUsers}</h3>
              </div>
              <div style={styles.stat}>
                <span>Active Users</span>
                <h3>{userManagementStats.activeUsers}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => setShowAddUser(true)} 
                style={styles.actionButton}
              >
                Add New User
              </button>
              <button 
                onClick={() => navigate('/user-management')} 
                style={styles.actionButton}
              >
                Manage Users
              </button>
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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    fontWeight: '600',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '0.75rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
    margin: '2rem 0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cardStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  stat: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e9ecef',
    },
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionButton: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  
  editBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  editButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  
  saveBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  cancelEditBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '0.9rem',
    width: '100%',
  },
  viewBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
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