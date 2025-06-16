import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Settings() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessAddress: '',
    businessEmail: '',
    businessPhone: '',
    businessRegistrationNumber: '',
    taxNumber: '',
    industry: '',
    website: ''
  });

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/business`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business information');
      }

      const data = await response.json();
      setBusinessInfo(data);
    } catch (error) {
      console.error('Error fetching business info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/business`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessInfo)
      });

      if (!response.ok) {
        throw new Error('Failed to update business information');
      }

      setSuccess('Business information updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating business info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !businessInfo.businessName) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Business Settings</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} style={styles.editButton}>
            Edit Information
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={businessInfo.businessName}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Address</label>
            <input
              type="text"
              name="businessAddress"
              value={businessInfo.businessAddress}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Email</label>
            <input
              type="email"
              name="businessEmail"
              value={businessInfo.businessEmail}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Phone</label>
            <input
              type="tel"
              name="businessPhone"
              value={businessInfo.businessPhone}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Registration Number</label>
            <input
              type="text"
              name="businessRegistrationNumber"
              value={businessInfo.businessRegistrationNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tax Number</label>
            <input
              type="text"
              name="taxNumber"
              value={businessInfo.taxNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Industry</label>
            <input
              type="text"
              name="industry"
              value={businessInfo.industry}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Website</label>
            <input
              type="url"
              name="website"
              value={businessInfo.website}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.input}
            />
          </div>
        </div>

        {isEditing && (
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                fetchBusinessInfo(); // Reset to original data
              }}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.875rem',
    color: '#1f2937',
    margin: 0,
  },
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    color: '#4b5563',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    width: '100%',
    backgroundColor: 'white',
    '&:disabled': {
      backgroundColor: '#f3f4f6',
      cursor: 'not-allowed',
    },
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
  },
  editButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:disabled': {
      backgroundColor: '#d1d5db',
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:disabled': {
      backgroundColor: '#d1d5db',
      cursor: 'not-allowed',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  },
  success: {
    padding: '1rem',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  },
};

export default Settings; 