import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AddUser = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        `${API_BASE_URL}/users`,
        newUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      navigate('/user-management');
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Add New User</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formSection}>
          <label style={styles.label}>First Name</label>
          <input
            type="text"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Last Name</label>
          <input
            type="text"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>User Type</label>
          <select
            value={newUser.type}
            onChange={(e) => handleRoleChange(e.target.value)}
            style={styles.select}
            required
          >
            <option value="employee">Employee</option>
            <option value="hr_manager">HR Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={styles.permissionsSection}>
          <h3 style={styles.sectionTitle}>Permissions</h3>
          {Object.entries(newUser.permissions).map(([module, permissions]) => (
            <div key={module} style={styles.permissionGroup}>
              <h4 style={styles.permissionGroupTitle}>
                {module.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <div style={styles.permissionsGrid}>
                {Object.entries(permissions).map(([action, value]) => (
                  <label key={action} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                    />
                    {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Creating User...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/user-management')}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
    color: '#2c3e50',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formSection: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  permissionsSection: {
    marginTop: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  permissionGroup: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  permissionGroupTitle: {
    fontSize: '16px',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#2c3e50',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '30px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
};

export default AddUser; 