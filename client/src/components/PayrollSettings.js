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
      const token = getToken();
      await axios.delete(`${API_BASE_URL}/payroll/settings/deductions/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSettings();
      setSuccess('Custom deduction removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to remove custom deduction');
      setTimeout(() => setError(null), 3000);
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
          ← Back
        </button>
        <h1 style={styles.title}>Payroll Settings</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {settings && (
        <div style={styles.settingsContainer}>
          {/* Tax Rates */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Tax Rates</h2>
            <div style={styles.rateContainer}>
              <div style={styles.rateGroup}>
                <label>PAYE Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRates.paye.rate}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      taxRates: {
                        ...settings.taxRates,
                        paye: { rate: Number(e.target.value) }
                      }
                    });
                  }}
                  style={styles.input}
                  min="0"
                  max="100"
                />
              </div>

              <div style={styles.rateGroup}>
                <label>NHIF Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRates.nhif.rate}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      taxRates: {
                        ...settings.taxRates,
                        nhif: { rate: Number(e.target.value) }
                      }
                    });
                  }}
                  style={styles.input}
                  min="0"
                  max="100"
                />
              </div>

              <div style={styles.rateGroup}>
                <label>NSSF Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRates.nssf.rate}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      taxRates: {
                        ...settings.taxRates,
                        nssf: { rate: Number(e.target.value) }
                      }
                    });
                  }}
                  style={styles.input}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </section>

          {/* Allowances */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Allowances</h2>
            <div style={styles.allowanceContainer}>
              {Object.entries(settings.allowances).map(([type, config]) => (
                <div key={type} style={styles.allowanceGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          allowances: {
                            ...settings.allowances,
                            [type]: {
                              ...config,
                              enabled: e.target.checked
                            }
                          }
                        });
                      }}
                      style={styles.checkbox}
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                  <input
                    type="number"
                    value={config.rate}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        allowances: {
                          ...settings.allowances,
                          [type]: {
                            ...config,
                            rate: Number(e.target.value)
                          }
                        }
                      });
                    }}
                    style={styles.input}
                    placeholder="Rate (%)"
                    disabled={!config.enabled}
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
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
                      <button
                        onClick={() => handleRemoveDeduction(index)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
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
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px'
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '20px'
  },
  title: {
    fontSize: '24px',
    margin: 0
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  allowanceGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '15px',
    minWidth: '120px'
  },
  checkbox: {
    marginRight: '8px'
  },
  deductionForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px'
  },
  rateContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  rateGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  allowanceContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  }
};

export default PayrollSettings; 