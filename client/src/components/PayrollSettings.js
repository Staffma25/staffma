import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Add predefined regions and business types
const REGIONS = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Other'
];

const BUSINESS_TYPES = [
  'Small Business',
  'Corporation',
  'Non-Profit',
  'Government',
  'Startup',
  'Other'
];

const PayrollSettings = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // Initialize all state with default values
  const [settings, setSettings] = useState({
    taxRates: {
      allowances: [],
      customDeductions: [],
      taxBrackets: {
        region: '',
        businessType: '',
        source: 'upload',
        brackets: []
      }
    }
  });
  
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
  
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [taxBracketInfo, setTaxBracketInfo] = useState({
    region: '',
    businessType: '',
    source: 'upload'
  });
  
  const [newTaxBracket, setNewTaxBracket] = useState({
    lowerBound: 0,
    upperBound: 0,
    rate: 0
  });

  // Add a ref for the file input
  const fileInputRef = useRef(null);

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

      // Ensure all required fields exist with default values
      const settingsData = {
        taxRates: {
          allowances: Array.isArray(response.data.taxRates?.allowances) 
            ? response.data.taxRates.allowances 
            : [],
          customDeductions: Array.isArray(response.data.taxRates?.customDeductions)
            ? response.data.taxRates.customDeductions
            : [],
          taxBrackets: response.data.taxRates?.taxBrackets || {
            region: '',
            businessType: '',
            source: 'upload',
            brackets: []
          }
        }
      };

      setSettings(settingsData);
      // Update taxBracketInfo with values from server
      setTaxBracketInfo({
        region: response.data.taxRates?.taxBrackets?.region || '',
        businessType: response.data.taxRates?.taxBrackets?.businessType || '',
        source: response.data.taxRates?.taxBrackets?.source || 'upload'
      });
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
      // Validate input
      if (!newAllowance.name.trim()) {
        setError('Allowance name is required');
        return;
      }

      if (newAllowance.value <= 0) {
        setError('Allowance value must be greater than 0');
        return;
      }

      if (newAllowance.type === 'percentage' && newAllowance.value > 100) {
        setError('Percentage cannot exceed 100%');
        return;
      }

      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/payroll/settings/allowances`,
        newAllowance,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setNewAllowance({ name: '', type: 'percentage', value: 0 });
      setSuccess('Custom allowance added successfully');
      setError(null);
    } catch (error) {
      console.error('Error adding allowance:', error);
      setError(error.response?.data?.message || 'Failed to add custom allowance');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
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
          customDeductions: [],
          taxBrackets: []
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

  // Update file input handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    // Validate region and business type
    if (!taxBracketInfo.region || !taxBracketInfo.businessType) {
      setError('Please select both region and business type before uploading');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('region', taxBracketInfo.region);
    formData.append('businessType', taxBracketInfo.businessType);

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/payroll/settings/tax-brackets/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSettings(response.data);
      setSuccess('Tax brackets uploaded successfully');
      setError(null);
    } catch (error) {
      console.error('Error uploading tax brackets:', error);
      setError(error.response?.data?.details || 'Failed to upload tax brackets');
    } finally {
      setLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Add a function to clear the file input
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
  };

  const handleLoadTemplate = async () => {
    try {
      if (!taxBracketInfo.region || !taxBracketInfo.businessType) {
        setError('Please select both region and business type before loading template');
        return;
      }

      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Loading template for:', {
        region: taxBracketInfo.region,
        businessType: taxBracketInfo.businessType
      });

      const response = await axios.get(
        `${API_BASE_URL}/payroll/settings/tax-brackets/template`,
        {
          params: {
            region: taxBracketInfo.region,
            businessType: taxBracketInfo.businessType
          },
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess(`Tax bracket template loaded successfully for ${taxBracketInfo.region} (${taxBracketInfo.businessType})`);
      setError(null);
    } catch (error) {
      console.error('Error loading template:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to load tax bracket template');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const handleAddTaxBracket = async () => {
    try {
      // Validate input
      if (newTaxBracket.lowerBound < 0) {
        setError('Lower bound must be greater than or equal to 0');
        return;
      }

      if (newTaxBracket.upperBound <= newTaxBracket.lowerBound) {
        setError('Upper bound must be greater than lower bound');
        return;
      }

      if (newTaxBracket.rate < 0 || newTaxBracket.rate > 100) {
        setError('Tax rate must be between 0 and 100');
        return;
      }

      // Validate region and business type
      if (!taxBracketInfo.region || !taxBracketInfo.businessType) {
        setError('Please select both region and business type');
        return;
      }

      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_BASE_URL}/payroll/settings/tax-brackets`,
        {
          ...newTaxBracket,
          region: taxBracketInfo.region,
          businessType: taxBracketInfo.businessType
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setNewTaxBracket({ lowerBound: 0, upperBound: 0, rate: 0 });
      setSuccess('Tax bracket added successfully');
      setError(null);
    } catch (error) {
      console.error('Error adding tax bracket:', error);
      setError(error.response?.data?.message || 'Failed to add tax bracket');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleRemoveTaxBracket = async (index) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.delete(`${API_BASE_URL}/payroll/settings/tax-brackets/${index}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Tax bracket removed successfully');
      setError(null);
    } catch (error) {
      console.error('Error removing tax bracket:', error);
      setError(error.response?.data?.message || 'Failed to remove tax bracket');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleResetTaxBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Resetting tax brackets');

      const response = await axios.post(
        `${API_BASE_URL}/payroll/settings/tax-brackets/reset`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Tax brackets reset successfully');
      setError(null);
    } catch (error) {
      console.error('Error resetting tax brackets:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to reset tax brackets');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const handleSetDefaultTaxBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Setting default tax brackets (Kenya template)');

      const response = await axios.post(
        `${API_BASE_URL}/payroll/settings/tax-brackets/default`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      setSettings(response.data);
      setSuccess('Default Kenya tax brackets set successfully');
      setError(null);
    } catch (error) {
      console.error('Error setting default tax brackets:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to set default tax brackets');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 5000);
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
                value={newAllowance.name || ''}
                onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
                placeholder="Allowance Name"
                style={styles.input}
              />
              <select
                value={newAllowance.type || 'percentage'}
                onChange={(e) => setNewAllowance({ ...newAllowance, type: e.target.value })}
                style={styles.select}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                value={newAllowance.value || 0}
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
                {(settings.taxRates?.allowances || []).map((allowance, index) => (
                  <tr key={index}>
                    <td>{allowance.name || ''}</td>
                    <td>{allowance.type || 'percentage'}</td>
                    <td>
                      {allowance.value || 0}
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
                {(!settings.taxRates?.allowances || settings.taxRates.allowances.length === 0) && (
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
                value={newDeduction.name || ''}
                onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                placeholder="Deduction Name"
                style={styles.input}
              />
              <select
                value={newDeduction.type || 'percentage'}
                onChange={(e) => setNewDeduction({ ...newDeduction, type: e.target.value })}
                style={styles.select}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                value={newDeduction.value || 0}
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
                {(settings.taxRates?.customDeductions || []).map((deduction, index) => (
                  <tr key={index}>
                    <td>{deduction.name || ''}</td>
                    <td>{deduction.type || 'percentage'}</td>
                    <td>
                      {deduction.value || 0}
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
                {(!settings.taxRates?.customDeductions || settings.taxRates.customDeductions.length === 0) && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No custom deductions added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Tax Brackets */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Tax Brackets</h2>
            <div style={styles.taxBracketConfig}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Region</label>
                <select
                  value={taxBracketInfo.region || ''}
                  onChange={(e) => setTaxBracketInfo({ ...taxBracketInfo, region: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select Region</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Business Type</label>
                <select
                  value={taxBracketInfo.businessType || ''}
                  onChange={(e) => setTaxBracketInfo({ ...taxBracketInfo, businessType: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select Business Type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Source</label>
                <select
                  value={taxBracketInfo.source || 'upload'}
                  onChange={(e) => setTaxBracketInfo({ ...taxBracketInfo, source: e.target.value })}
                  style={styles.select}
                >
                  <option value="upload">Upload File</option>
                  <option value="template">Use Template</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>

              <button
                onClick={handleSetDefaultTaxBrackets}
                style={styles.resetButton}
                disabled={loading}
              >
                Set Default Tax Brackets
              </button>
            </div>

            {taxBracketInfo.source === 'upload' ? (
              <div style={styles.uploadSection}>
                <div style={styles.fileUpload}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Tax Brackets (CSV/Excel)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a CSV or Excel file with columns: Lower Bound, Upper Bound, Rate
                  </p>
                </div>
              </div>
            ) : taxBracketInfo.source === 'template' ? (
              <div style={styles.templateSection}>
                <div style={styles.templateInfo}>
                  <p style={styles.templateDescription}>
                    Load pre-configured tax brackets for {taxBracketInfo.region || 'your region'} 
                    {taxBracketInfo.businessType && ` (${taxBracketInfo.businessType})`}
                  </p>
                  <button
                    onClick={handleLoadTemplate}
                    style={styles.templateButton}
                    disabled={loading || !taxBracketInfo.region || !taxBracketInfo.businessType}
                  >
                    {loading ? 'Loading...' : 'Load Template'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.manualEntrySection}>
                <div style={styles.deductionForm}>
                  <input
                    type="number"
                    value={newTaxBracket.lowerBound || 0}
                    onChange={(e) => setNewTaxBracket({ ...newTaxBracket, lowerBound: Number(e.target.value) })}
                    placeholder="Lower Bound (KES)"
                    style={styles.input}
                    min="0"
                  />
                  <input
                    type="number"
                    value={newTaxBracket.upperBound || 0}
                    onChange={(e) => setNewTaxBracket({ ...newTaxBracket, upperBound: Number(e.target.value) })}
                    placeholder="Upper Bound (KES)"
                    style={styles.input}
                    min="0"
                  />
                  <input
                    type="number"
                    value={newTaxBracket.rate || 0}
                    onChange={(e) => setNewTaxBracket({ ...newTaxBracket, rate: Number(e.target.value) })}
                    placeholder="Tax Rate (%)"
                    style={styles.input}
                    min="0"
                    max="100"
                  />
                  <button
                    onClick={handleAddTaxBracket}
                    style={styles.addButton}
                    disabled={!taxBracketInfo.region || !taxBracketInfo.businessType}
                  >
                    Add Tax Bracket
                  </button>
                </div>
              </div>
            )}

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Lower Bound (KES)</th>
                  <th>Upper Bound (KES)</th>
                  <th>PAYE %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(settings.taxRates?.taxBrackets?.brackets || []).map((bracket, index) => (
                  <tr key={index}>
                    <td>{(bracket.lowerBound || 0).toLocaleString()}</td>
                    <td>{(bracket.upperBound || 0).toLocaleString()}</td>
                    <td>{(bracket.rate || 0)}%</td>
                    <td>
                      <span style={{
                        color: bracket.enabled ? '#4caf50' : '#f44336',
                        fontWeight: 'bold'
                      }}>
                        {bracket.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveTaxBracket(index)}
                        style={styles.removeButton}
                        disabled={loading}
                      >
                        {loading ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!settings.taxRates?.taxBrackets?.brackets || settings.taxRates.taxBrackets.brackets.length === 0) && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No tax brackets configured yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {settings.taxRates?.taxBrackets?.region && (
              <div style={styles.currentConfig}>
                <h4 style={styles.configTitle}>Current Configuration:</h4>
                <div style={styles.configDetails}>
                  <p><strong>Region:</strong> {settings.taxRates.taxBrackets.region}</p>
                  <p><strong>Business Type:</strong> {settings.taxRates.taxBrackets.businessType}</p>
                  <p><strong>Source:</strong> {settings.taxRates.taxBrackets.source}</p>
                  <p><strong>Brackets:</strong> {settings.taxRates.taxBrackets.brackets.length} configured</p>
                  <p><strong>Last Updated:</strong> {new Date(settings.taxRates.taxBrackets.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            )}
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
  },
  taxBracketConfig: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50'
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  fileUpload: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  fileInput: {
    padding: '10px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  uploadInfo: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  },
  uploadButton: {
    padding: '12px 24px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    alignSelf: 'flex-start',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  templateButton: {
    padding: '12px 24px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  currentConfig: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2c3e50'
  },
  manualEntrySection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  uploadActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  clearButton: {
    padding: '12px 24px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  templateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  templateInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  templateDescription: {
    fontSize: '14px',
    color: '#2c3e50',
    fontWeight: '500'
  },
  uploadActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  clearButton: {
    padding: '12px 24px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  configTitle: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#2c3e50',
    fontWeight: '600'
  },
  configDetails: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500'
  }
};

export default PayrollSettings; 