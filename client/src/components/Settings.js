import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES } from '../utils/currency';

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
    website: '',
    currency: 'KES'
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
      setBusinessInfo({
        ...data,
        currency: data.currency || 'KES'
      });
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
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/business`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(businessInfo)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update business information');
      }

      setSuccess('Business information updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating business info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchBusinessInfo(); // Reset to original values
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading business information...</div>
      </div>
    );
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Currency</label>
            <select
              name="currency"
              value={businessInfo.currency}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={styles.select}
              required
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {code} - {info.name}
                </option>
              ))}
            </select>
            {!isEditing && (
              <p style={styles.helpText}>
                Current currency: {businessInfo.currency} ({CURRENCIES[businessInfo.currency]?.name})
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div style={styles.buttonGroup}>
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.saveButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.5rem',
    color: '#1f2937',
    margin: 0,
  },
  form: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.75rem',
    color: '#4b5563',
    fontWeight: '500',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
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
    gap: '10px',
    marginTop: '20px',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:disabled': {
      backgroundColor: '#d1d5db',
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:disabled': {
      backgroundColor: '#d1d5db',
      cursor: 'not-allowed',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '0.875rem',
  },
  success: {
    padding: '12px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '0.875rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '0.875rem',
    width: '100%',
    backgroundColor: 'white',
    '&:disabled': {
      backgroundColor: '#f3f4f6',
      cursor: 'not-allowed',
    },
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#4b5563',
    marginTop: '4px',
  },
};

export default Settings; 