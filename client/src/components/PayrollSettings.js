import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const PayrollSettings = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newDeduction, setNewDeduction] = useState({
    name: '',
    type: 'percentage',
    value: 0
  });
  const [newAllowance, setNewAllowance] = useState({
    name: '',
    type: 'percentage',
    value: 0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/payroll/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data) {
        throw new Error('No settings data received');
      }

      // Ensure taxRates and allowances exist
      if (!response.data.taxRates) {
        response.data.taxRates = {
          allowances: [],
          customDeductions: []
        };
      } else if (!response.data.taxRates.allowances) {
        response.data.taxRates.allowances = [];
      }

      setSettings(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error.response?.data?.message || 'Failed to fetch payroll settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!settings) {
        throw new Error('No settings to save');
      }

      const response = await axios.put(`${API_BASE_URL}/payroll/settings`, settings, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Settings saved successfully');
      setError(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleAddDeduction = async () => {
    try {
      const token = getToken();
      await axios.post(`${API_BASE_URL}/payroll/settings/deductions`, newDeduction, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewDeduction({ name: '', type: 'percentage', value: 0 });
      fetchSettings();
      setSuccess('Custom deduction added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to add custom deduction');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveDeduction = async (index) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.delete(`${API_BASE_URL}/payroll/settings/deductions/${index}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Deduction removed successfully');
      setError(null);
    } catch (error) {
      console.error('Error removing deduction:', error);
      setError(error.response?.data?.message || 'Failed to remove custom deduction');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleAddAllowance = async () => {
    try {
      const token = getToken();
      await axios.post(`${API_BASE_URL}/payroll/settings/allowances`, newAllowance, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAllowance({ name: '', type: 'percentage', value: 0 });
      fetchSettings();
      setSuccess('Custom allowance added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to add custom allowance');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveAllowance = async (index) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.delete(`${API_BASE_URL}/payroll/settings/allowances/${index}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Allowance removed successfully');
      setError(null);
    } catch (error) {
      console.error('Error removing allowance:', error);
      setError(error.response?.data?.message || 'Failed to remove custom allowance');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all payroll settings? This will remove all custom allowances and deductions.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/payroll/settings`, {
        taxRates: {
          allowances: [],
          customDeductions: []
        }
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('Failed to reset payroll settings');
      }

      setSettings(response.data);
      setSuccess('Payroll settings reset successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset payroll settings');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/payroll')}
        >
          ← Back to Payroll
        </button>
        <h1 style={styles.title}>Payroll Settings</h1>
        <div style={styles.headerActions}>
          <button
            style={styles.resetButton}
            onClick={handleResetSettings}
            disabled={loading}
          >
            Reset Settings
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {settings && (
        <div style={styles.settingsContainer}>
          {/* Allowances */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Allowances</h2>
            <div style={styles.deductionForm}>
              <input
                type="text"
                value={newAllowance.name}
                onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
                placeholder="Allowance Name"
                style={styles.input}
              />
              <select
                value={newAllowance.type}
                onChange={(e) => setNewAllowance({ ...newAllowance, type: e.target.value })}
                style={styles.select}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                value={newAllowance.value}
                onChange={(e) => setNewAllowance({ ...newAllowance, value: Number(e.target.value) })}
                placeholder={newAllowance.type === 'percentage' ? 'Rate (%)' : 'Amount'}
                style={styles.input}
                min="0"
                max={newAllowance.type === 'percentage' ? "100" : undefined}
              />
              <button
                onClick={handleAddAllowance}
                style={styles.addButton}
              >
                Add Allowance
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings?.taxRates?.allowances?.map((allowance, index) => (
                  <tr key={index}>
                    <td>{allowance.name}</td>
                    <td>{allowance.type}</td>
                    <td>
                      {allowance.value}
                      {allowance.type === 'percentage' ? '%' : ' KES'}
                    </td>
                    <td>
                      <span style={{
                        color: allowance.enabled ? '#4caf50' : '#f44336',
                        fontWeight: 'bold'
                      }}>
                        {allowance.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveAllowance(index)}
                        style={styles.removeButton}
                        disabled={loading}
                      >
                        {loading ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!settings?.taxRates?.allowances || settings.taxRates.allowances.length === 0) && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No allowances added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Custom Deductions */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Custom Deductions</h2>
            <div style={styles.deductionForm}>
              <input
                type="text"
                value={newDeduction.name}
                onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                placeholder="Deduction Name"
                style={styles.input}
              />
              <select
                value={newDeduction.type}
                onChange={(e) => setNewDeduction({ ...newDeduction, type: e.target.value })}
                style={styles.select}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                value={newDeduction.value}
                onChange={(e) => setNewDeduction({ ...newDeduction, value: Number(e.target.value) })}
                placeholder={newDeduction.type === 'percentage' ? 'Rate (%)' : 'Amount'}
                style={styles.input}
                min="0"
                max={newDeduction.type === 'percentage' ? "100" : undefined}
              />
              <button
                onClick={handleAddDeduction}
                style={styles.addButton}
              >
                Add Deduction
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.taxRates.customDeductions.map((deduction, index) => (
                  <tr key={index}>
                    <td>{deduction.name}</td>
                    <td>{deduction.type}</td>
                    <td>
                      {deduction.value}
                      {deduction.type === 'percentage' ? '%' : ' KES'}
                    </td>
                    <td>
                      <span style={{
                        color: deduction.enabled ? '#4caf50' : '#f44336',
                        fontWeight: 'bold'
                      }}>
                        {deduction.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveDeduction(index)}
                        style={styles.removeButton}
                        disabled={loading}
                      >
                        {loading ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
                {settings.taxRates.customDeductions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No custom deductions added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <button
            onClick={handleSave}
            style={styles.saveButton}
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '20px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    }
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#2c3e50',
    fontWeight: '600'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '22px',
    marginBottom: '25px',
    color: '#2c3e50',
    fontWeight: '600',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px'
  },
  input: {
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      borderColor: '#2196f3',
      outline: 'none'
    }
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  allowanceContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    padding: '10px'
  },
  allowanceGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e9ecef',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: '10px'
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px'
  },
  deductionForm: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto',
    gap: '15px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  select: {
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '120px',
    '&:focus': {
      borderColor: '#2196f3',
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)'
    }
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#43a047'
    }
  },
  removeButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#e53935'
    }
  },
  saveButton: {
    padding: '14px 28px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '30px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#1976d2'
    }
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    marginBottom: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #e9ecef'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  tableCell: {
    padding: '15px',
    fontSize: '14px',
    color: '#2c3e50',
    borderBottom: '1px solid #e9ecef'
  },
  amountInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  inputLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500'
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#1976d2'
    }
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  previewBox: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    minWidth: '200px'
  },
  previewTitle: {
    fontSize: '14px',
    color: '#2c3e50',
    marginBottom: '10px',
    fontWeight: '600'
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '14px'
  },
  previewLabel: {
    color: '#666',
    fontWeight: '500'
  },
  previewValue: {
    color: '#2c3e50',
    fontWeight: '600'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: '#f0ad4e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#ec971f'
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  success: {
    backgroundColor: '#dff0d8',
    color: '#3c763d',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px'
  }
};

export default PayrollSettings; 