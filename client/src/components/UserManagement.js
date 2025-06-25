import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const { getToken, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Ensure we're sending the correct user type
      const updatedUser = {
        ...editingUser,
        type: editingUser.type || 'employee' // Default to employee if type is not set
      };

      const response = await fetchWithAuth(
        `${API_BASE_URL}/users/${editingUser._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedUser)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data = await response.json();
      setUsers(users.map(u => u._id === editingUser._id ? data : u));
      setEditingUser(null);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u._id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.type?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && !users.length) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>User Management</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search users by name, email, or type..."
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Type</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  {editingUser?._id === user._id ? (
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        firstName: e.target.value
                      })}
                      style={styles.input}
                    />
                  ) : (
                    `${user.firstName} ${user.lastName}`
                  )}
                </td>
                <td style={styles.tableCell}>
                  {editingUser?._id === user._id ? (
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        email: e.target.value
                      })}
                      style={styles.input}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td style={styles.tableCell}>
                  {editingUser?._id === user._id ? (
                    <select
                      value={editingUser.type || 'employee'}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        type: e.target.value
                      })}
                      style={styles.select}
                    >
                      <option value="admin">Admin</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  ) : (
                    user.type
                  )}
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    color: user.status === 'active' ? '#4caf50' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    {editingUser?._id === user._id ? (
                      <>
                        <button
                          onClick={handleUpdate}
                          style={styles.saveButton}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={styles.cancelButton}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          style={styles.editButton}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          style={styles.deleteButton}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={styles.noData}>
                  {searchTerm 
                    ? 'No users found matching your search criteria.'
                    : 'No users found.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '15px',
    fontSize: '0.875rem',
  },
  title: {
    fontSize: '1.5rem',
    margin: 0,
    color: '#2c3e50',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '0.875rem',
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '0.875rem',
  },
  searchContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
  },
  searchInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.875rem',
  },
  clearSearchButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #dee2e6',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '0.75rem',
    color: '#2c3e50',
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  saveButton: {
    padding: '6px 12px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  input: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.75rem',
    width: '100%',
  },
  select: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.75rem',
    width: '100%',
  },
  noData: {
    textAlign: 'center',
    padding: '15px',
    color: '#666',
    fontSize: '0.875rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1rem',
    color: '#666',
  },
};

export default UserManagement; 