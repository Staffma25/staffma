import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStaffmaUsers, updateStaffmaUser, deleteStaffmaUser, createStaffmaUser } from '../utils/api';

const StaffmaUserManagement = () => {
  const navigate = useNavigate();
  const { getToken, logout, getCurrentUser } = useAuth();
  const user = getCurrentUser('staffma');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  // Check permissions
  const canCreateUsers = user?.permissions?.userManagement?.createStaffmaUsers || user?.role === 'super_admin';
  const canManageUsers = user?.permissions?.userManagement?.manageStaffmaUsers || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const fetchUsers = useCallback(async (abortController) => {
    try {
      const token = getToken('staffma');
      if (!token) {
        console.error('No Staffma authentication token found');
        logout('staffma');
        navigate('/staffma/login');
        return;
      }

      const response = await getStaffmaUsers(abortController?.signal);
      if (!abortController?.signal.aborted) {
        setUsers(response.users || []);
        setError(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching Staffma users:', error);
        setError(error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('No authentication token found')) {
          logout('staffma');
          navigate('/staffma/login');
        }
      }
    } finally {
      if (!abortController?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [navigate, getToken, logout]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchUsers(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData(e.target);
      const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        role: formData.get('role'),
        status: formData.get('status')
      };

      const response = await updateStaffmaUser(editingUser.id, userData);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? response.user : u));
      setEditingUser(null);
      setSuccess('Staffma user updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating Staffma user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this Staffma user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteStaffmaUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('Staffma user deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting Staffma user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAddForm = () => {
    if (!addFormData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!addFormData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!addFormData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!addFormData.password) {
      setError('Password is required');
      return false;
    }
    if (addFormData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (addFormData.password !== addFormData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!addFormData.role) {
      setError('Role is required');
      return false;
    }
    return true;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!canCreateUsers) {
      setError('You do not have permission to create new users');
      return;
    }

    if (!validateAddForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = {
        firstName: addFormData.firstName.trim(),
        lastName: addFormData.lastName.trim(),
        email: addFormData.email.trim().toLowerCase(),
        password: addFormData.password,
        role: addFormData.role
      };

      const response = await createStaffmaUser(userData);
      setUsers(prev => [...prev, response.user]);
      setShowAddModal(false);
      setAddFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
      });
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
    const matchesRole = !filterRole || user.role === filterRole;
    const userStatus = user.dynamicStatus || user.status || 'active';
    const matchesStatus = !filterStatus || userStatus === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return '#d32f2f';
      case 'admin': return '#1976d2';
      case 'support': return '#388e3c';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'idle': return '#ff9800';
      case 'inactive': return '#9e9e9e';
      case 'suspended': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !users.length) {
    return <div style={styles.loading}>Loading Staffma User Management...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button style={styles.backButton} onClick={() => navigate('/staffma/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.title}>Staffma User Management</h1>
          <p style={styles.subtitle}>Manage Staffma platform users and permissions</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.statusInfo}>
        <h3 style={styles.statusInfoTitle}>Status Information</h3>
        <div style={styles.statusInfoGrid}>
          <div style={styles.statusInfoItem}>
            <span style={{...styles.badge, backgroundColor: '#4caf50'}}>ACTIVE</span>
            <span>≤7 days</span>
          </div>
          <div style={styles.statusInfoItem}>
            <span style={{...styles.badge, backgroundColor: '#ff9800'}}>IDLE</span>
            <span>7-30 days</span>
          </div>
          <div style={styles.statusInfoItem}>
            <span style={{...styles.badge, backgroundColor: '#9e9e9e'}}>INACTIVE</span>
            <span>>30 days</span>
          </div>
          <div style={styles.statusInfoItem}>
            <span style={{...styles.badge, backgroundColor: '#f44336'}}>SUSPENDED</span>
            <span>Manual</span>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchButton}
            >
              Clear
            </button>
          )}
        </div>

        <div style={styles.filters}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {canCreateUsers && (
          <button
            style={styles.createButton}
            onClick={() => setShowAddModal(true)}
          >
            + Add New User
          </button>
        )}
      </div>

      {/* Edit User Form */}
      {editingUser && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Edit Staffma User</h2>
              <button
                style={styles.closeButton}
                onClick={() => setEditingUser(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={editingUser.firstName}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={editingUser.lastName}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role *</label>
                  <select name="role" defaultValue={editingUser.role} required style={styles.select}>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select name="status" defaultValue={editingUser.status} required style={styles.select}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <p style={styles.helpText}>
                    Note: Status is automatically determined by login activity. Only "Suspended" can be manually set.
                  </p>
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  Update User
                </button>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Add New Staffma User</h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddUser} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={addFormData.firstName}
                    onChange={handleAddInputChange}
                    placeholder="Enter first name"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={addFormData.lastName}
                    onChange={handleAddInputChange}
                    placeholder="Enter last name"
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={addFormData.email}
                  onChange={handleAddInputChange}
                  placeholder="Enter email address"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={addFormData.password}
                    onChange={handleAddInputChange}
                    placeholder="Enter password (min 8 characters)"
                    required
                    minLength={8}
                    style={styles.input}
                  />
                  <p style={styles.helpText}>Password must be at least 8 characters long</p>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={addFormData.confirmPassword}
                    onChange={handleAddInputChange}
                    placeholder="Confirm password"
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Role *</label>
                <select 
                  name="role" 
                  value={addFormData.role} 
                  onChange={handleAddInputChange}
                  required 
                  style={styles.select}
                >
                  <option value="">Select a role</option>
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                </select>
                <div style={styles.roleDescriptions}>
                  {isSuperAdmin && (
                    <div style={styles.roleDescription}>
                      <strong>Super Administrator:</strong> Full system access, can create other super admins
                    </div>
                  )}
                  <div style={styles.roleDescription}>
                    <strong>Administrator:</strong> Manage users, businesses, and system settings
                  </div>
                  <div style={styles.roleDescription}>
                    <strong>Support Staff:</strong> View activities and provide customer support
                  </div>
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  Create User
                </button>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowAddModal(false);
                    setAddFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      role: ''
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Last Login</th>
              <th style={styles.tableHeader}>Created</th>
              {canManageUsers && <th style={styles.tableHeader}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {(user.firstName || '')} {(user.lastName || '')}
                    </div>
                  </div>
                </td>
                <td style={styles.tableCell}>{user.email || 'No email'}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getRoleColor(user.role)
                  }}>
                    {(user.role || 'admin').replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getStatusColor(user.dynamicStatus || user.status)
                  }}>
                    {(user.dynamicStatus || user.status || 'active').toUpperCase()}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </td>
                <td style={styles.tableCell}>
                  {formatDate(user.createdAt)}
                </td>
                {canManageUsers && (
                  <td style={styles.tableCell}>
                    <div style={styles.actions}>
                      <button
                        style={styles.iconButton}
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                      >
                        ✏️
                      </button>
                      {user.id !== getCurrentUser('staffma')?.userId && (
                        <button
                          style={{ ...styles.iconButton, ...styles.deleteIconButton }}
                          onClick={() => handleDelete(user.id)}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div style={styles.emptyState}>
            <p>No Staffma users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    }
  },
  title: {
    fontSize: '1.5rem',
    margin: '0 0 4px 0',
    color: '#2c3e50',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6c757d',
    margin: 0
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statusInfo: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  statusInfoTitle: {
    fontSize: '1rem',
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontWeight: '600'
  },
  statusInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  statusInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#2c3e50'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase'
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: '250px'
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)'
    }
  },
  clearSearchButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#e53935'
    }
  },
  filters: {
    display: 'flex',
    gap: '8px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '120px',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3'
    }
  },
  createButton: {
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '&:hover': {
      backgroundColor: '#43a047',
      transform: 'translateY(-1px)'
    }
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e0e0e0'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#2c3e50'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)'
    }
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3'
    }
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '4px',
    fontStyle: 'italic'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0'
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#1976d2'
    }
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#5a6268'
    }
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #e9ecef'
  },
  tableRow: {
    borderBottom: '1px solid #e9ecef',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '0.75rem',
    color: '#2c3e50',
    verticalAlign: 'middle'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#2c3e50'
  },
  actions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  iconButton: {
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  deleteIconButton: {
    '&:hover': {
      backgroundColor: '#ffebee'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px',
    color: '#666',
    fontSize: '0.875rem'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '1rem',
    color: '#666'
  },
  roleDescriptions: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#666'
  },
  roleDescription: {
    marginBottom: '5px'
  }
};

export default StaffmaUserManagement; 