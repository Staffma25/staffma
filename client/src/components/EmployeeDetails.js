import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentUpload from './DocumentUpload';
import InsuranceDocumentUpload from './InsuranceDocumentUpload';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [customDeductions, setCustomDeductions] = useState([]);
  const [newDeduction, setNewDeduction] = useState({
    description: '',
    amount: '',
    type: 'salary_advance', // salary_advance, loan, other
    startDate: '',
    endDate: '',
    monthlyAmount: '',
    remainingAmount: '',
    status: 'active' // active, completed, cancelled
  });
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    isPrimary: false
  });
  const [walletForm, setWalletForm] = useState({
    walletId: '',
    phoneNumber: '',
    isActive: false
  });
  const [activePaymentMethod, setActivePaymentMethod] = useState('bank'); // 'bank' or 'wallet'
  const [businessCurrency, setBusinessCurrency] = useState('KES');

  useEffect(() => {
    if (!id) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }
    fetchEmployeeDetails();
    fetchBusinessCurrency();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      console.log('Fetching details for employee ID:', id);
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employee details');
      }

      const data = await response.json();
      console.log('Received employee data:', data);
      setEmployee(data);
      
      // Set active payment method based on existing data
      if (data.staffpesaWallet && data.staffpesaWallet.walletId) {
        setActivePaymentMethod('wallet');
      } else if (data.bankAccounts && data.bankAccounts.length > 0) {
        setActivePaymentMethod('bank');
      } else {
        setActivePaymentMethod('bank'); // Default to bank
      }
    } catch (error) {
      console.error('Error in fetchEmployeeDetails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessCurrency = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/business`, {
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

  const handleDocumentUpload = async (documentType, file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/documents/${documentType}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      await fetchEmployeeDetails();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInsuranceUpdate = async (insuranceType, field, value) => {
    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/insurance/${insuranceType}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [field]: value
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update insurance information');
      }

      await fetchEmployeeDetails();
    } catch (error) {
      console.error('Error updating insurance:', error);
      alert('Failed to update insurance information: ' + error.message);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      setActionLoading(true);
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      alert('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee: ' + error.message);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleDocumentUpdate = (documentType, fileUrl) => {
    setEmployee(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: fileUrl ? {
          url: fileUrl,
          uploadedAt: new Date()
        } : null
      }
    }));
  };

  const handleAddCustomDeduction = async (e) => {
    e.preventDefault();
    
    console.log('Submitting deduction:', newDeduction);
    
    if (!newDeduction.description || !newDeduction.amount || !newDeduction.monthlyAmount || !newDeduction.startDate) {
      alert('Please fill in all required fields: Description, Total Amount, Monthly Amount, and Start Date');
      return;
    }

    // Validate amounts
    const amount = parseFloat(newDeduction.amount);
    const monthlyAmount = parseFloat(newDeduction.monthlyAmount);
    
    if (amount <= 0 || monthlyAmount <= 0) {
      alert('Amount and monthly amount must be greater than 0');
      return;
    }

    if (monthlyAmount > amount) {
      alert('Monthly deduction amount cannot exceed total amount');
      return;
    }

    try {
      console.log('Sending request to:', `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/custom-deductions`);
      console.log('Request body:', newDeduction);
      
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/custom-deductions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newDeduction)
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to add custom deduction');
      }

      const result = await response.json();
      console.log('Success response:', result);

      await fetchEmployeeDetails();
      setNewDeduction({
        description: '',
        amount: '',
        type: 'salary_advance',
        startDate: '',
        endDate: '',
        monthlyAmount: '',
        remainingAmount: '',
        status: 'active'
      });
      alert('Custom deduction added successfully');
    } catch (error) {
      console.error('Error adding custom deduction:', error);
      alert('Failed to add custom deduction: ' + error.message);
    }
  };

  const handleUpdateDeductionStatus = async (deductionId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/custom-deductions/${deductionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update deduction status');
      }

      await fetchEmployeeDetails();
      alert('Deduction status updated successfully');
    } catch (error) {
      console.error('Error updating deduction status:', error);
      alert('Failed to update deduction status: ' + error.message);
    }
  };

  const handleDeleteDeduction = async (deductionId) => {
    if (!window.confirm('Are you sure you want to delete this deduction?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${id}/custom-deductions/${deductionId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete deduction');
      }

      await fetchEmployeeDetails();
      alert('Deduction deleted successfully');
    } catch (error) {
      console.error('Error deleting deduction:', error);
      alert('Failed to delete deduction: ' + error.message);
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    try {
      // Remove Staffpesa wallet if exists
      const updatedEmployee = { ...employee, bankAccounts: [{ ...bankForm }], staffpesaWallet: null };
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/bank-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bankForm, isPrimary: true })
      });
      if (!response.ok) throw new Error('Failed to add bank account');
      // Remove wallet
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/staffpesa-wallet`, { method: 'DELETE' });
      await fetchEmployeeDetails();
      setBankForm({ bankName: '', accountNumber: '', accountType: '', isPrimary: false });
    } catch (error) {
      alert('Failed to add bank account: ' + error.message);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    try {
      // Remove all bank accounts if exist
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/bank-accounts`, { method: 'DELETE' });
      // Add/update wallet
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/staffpesa-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletForm)
      });
      if (!response.ok) throw new Error('Failed to add/update Staffpesa wallet');
      await fetchEmployeeDetails();
      setWalletForm({ walletId: '', phoneNumber: '', isActive: false });
    } catch (error) {
      alert('Failed to add/update Staffpesa wallet: ' + error.message);
    }
  };

  const handlePaymentMethodChange = async (method) => {
    if (method === activePaymentMethod) return;
    
    try {
      if (method === 'bank') {
        // Switch to bank account - remove wallet if exists
        if (employee.staffpesaWallet && employee.staffpesaWallet.walletId) {
          await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/staffpesa-wallet`, { 
            method: 'DELETE' 
          });
          // Update employee state directly
          setEmployee(prev => ({
            ...prev,
            staffpesaWallet: null
          }));
        }
      } else if (method === 'wallet') {
        // Switch to wallet - remove bank accounts if exist
        if (employee.bankAccounts && employee.bankAccounts.length > 0) {
          await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/bank-accounts`, { 
            method: 'DELETE' 
          });
          // Update employee state directly
          setEmployee(prev => ({
            ...prev,
            bankAccounts: []
          }));
        }
      }
      
      setActivePaymentMethod(method);
    } catch (error) {
      console.error('Error switching payment method:', error);
      alert('Failed to switch payment method: ' + error.message);
    }
  };

  const handleRemoveBankAccounts = async () => {
    if (!window.confirm('Are you sure you want to remove all bank accounts?')) {
      return;
    }

    try {
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/bank-accounts`, { method: 'DELETE' });
      await fetchEmployeeDetails();
      alert('All bank accounts removed successfully');
    } catch (error) {
      console.error('Error removing bank accounts:', error);
      alert('Failed to remove bank accounts: ' + error.message);
    }
  };

  const handleRemoveWallet = async () => {
    if (!window.confirm('Are you sure you want to remove the Staffpesa wallet?')) {
      return;
    }

    try {
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/staffpesa-wallet`, { method: 'DELETE' });
      await fetchEmployeeDetails();
      alert('Staffpesa wallet removed successfully');
    } catch (error) {
      console.error('Error removing Staffpesa wallet:', error);
      alert('Failed to remove Staffpesa wallet: ' + error.message);
    }
  };

  const handleQuickSwitchToWallet = async () => {
    if (!window.confirm('This will remove all bank accounts and switch to Staffpesa Wallet. Continue?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      // Remove bank accounts
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/bank-accounts`, { method: 'DELETE' });
      // Switch to wallet
      setActivePaymentMethod('wallet');
      // Update employee state
      setEmployee(prev => ({
        ...prev,
        bankAccounts: [],
        paymentMethodType: null
      }));
      alert('Successfully switched to Staffpesa Wallet. Please add your wallet details below.');
    } catch (error) {
      console.error('Error switching to wallet:', error);
      alert('Failed to switch payment method: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickSwitchToBank = async () => {
    if (!window.confirm('This will remove the Staffpesa wallet and switch to Bank Account. Continue?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      // Remove wallet
      await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees/${employee._id}/staffpesa-wallet`, { method: 'DELETE' });
      // Switch to bank
      setActivePaymentMethod('bank');
      // Update employee state
      setEmployee(prev => ({
        ...prev,
        staffpesaWallet: null,
        paymentMethodType: null
      }));
      alert('Successfully switched to Bank Account. Please add your bank details below.');
    } catch (error) {
      console.error('Error switching to bank:', error);
      alert('Failed to switch payment method: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading employee details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            Back to Employees List
          </button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Employee not found</p>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            Back to Employees List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            ← Back to Employees List
          </button>
          <h1 style={styles.title}>
            {employee.firstName} {employee.lastName}
          </h1>
        </div>
        <div style={styles.actionButtons}>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              ...styles.actionButton,
              backgroundColor: '#e74c3c'
            }}
            disabled={actionLoading}
          >
            Delete Employee
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'personal' && styles.activeTab)}}
          onClick={() => setActiveTab('personal')}
        >
          Personal Information
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'documents' && styles.activeTab)}}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'insurance' && styles.activeTab)}}
          onClick={() => setActiveTab('insurance')}
        >
          Insurance
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'performance' && styles.activeTab)}}
          onClick={() => setActiveTab('performance')}
        >
          Performance Reviews
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'payroll' && styles.activeTab)}}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll History
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'deductions' && styles.activeTab)}}
          onClick={() => setActiveTab('deductions')}
        >
          Custom Deductions
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'paymentMethods' && styles.activeTab)}}
          onClick={() => setActiveTab('paymentMethods')}
        >
          Payment Methods
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'personal' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Personal Information</h2>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.label}>Position</span>
                <span style={styles.value}>{employee.position}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Department</span>
                <span style={styles.value}>{employee.department}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Email</span>
                <span style={styles.value}>{employee.email}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Phone</span>
                <span style={styles.value}>{employee.phone}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Start Date</span>
                <span style={styles.value}>
                  {new Date(employee.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Employee Documents</h2>
            
            <div className="documents-section">
              <h3>Documents</h3>
              <div className="documents-grid">
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="idCard"
                  currentDocument={employee.documents?.idCard}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="passport"
                  currentDocument={employee.documents?.passport}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="resume"
                  currentDocument={employee.documents?.resume}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="contract"
                  currentDocument={employee.documents?.contract}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="certificates"
                  currentDocument={employee.documents?.certificates}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="other"
                  currentDocument={employee.documents?.other}
                  onDocumentUpdate={handleDocumentUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Insurance Documents</h2>
            
            <div className="insurance-section">
            {/* NHIF Section */}
            <div style={styles.insuranceSection}>
              <h3 style={styles.insuranceTitle}>NHIF</h3>
              <div style={styles.uploadSection}>
                <input
                  type="text"
                  placeholder="NHIF Number"
                  value={employee.insurance?.nhif?.number || ''}
                  onChange={(e) => handleInsuranceUpdate('nhif', 'number', e.target.value)}
                  style={styles.input}
                />
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="nhif"
                    currentDocument={employee.insurance?.nhif}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                />
              </div>
            </div>

            {/* Medical Insurance Section */}
            <div style={styles.insuranceSection}>
              <h3 style={styles.insuranceTitle}>Medical Insurance</h3>
              <div style={styles.uploadSection}>
                <input
                  type="text"
                  placeholder="Provider"
                  value={employee.insurance?.medical?.provider || ''}
                  onChange={(e) => handleInsuranceUpdate('medical', 'provider', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Policy Number"
                  value={employee.insurance?.medical?.policyNumber || ''}
                  onChange={(e) => handleInsuranceUpdate('medical', 'policyNumber', e.target.value)}
                  style={styles.input}
                />
                <select
                  value={employee.insurance?.medical?.coverage || 'basic'}
                  onChange={(e) => handleInsuranceUpdate('medical', 'coverage', e.target.value)}
                  style={styles.select}
                >
                  <option value="basic">Basic Coverage</option>
                  <option value="standard">Standard Coverage</option>
                  <option value="premium">Premium Coverage</option>
                </select>
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="medical"
                    currentDocument={employee.insurance?.medical}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                />
              </div>
            </div>

            {/* Life Insurance Section */}
            <div style={styles.insuranceSection}>
              <h3 style={styles.insuranceTitle}>Life Insurance</h3>
              <div style={styles.uploadSection}>
                <input
                  type="text"
                  placeholder="Provider"
                  value={employee.insurance?.life?.provider || ''}
                  onChange={(e) => handleInsuranceUpdate('life', 'provider', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Policy Number"
                  value={employee.insurance?.life?.policyNumber || ''}
                  onChange={(e) => handleInsuranceUpdate('life', 'policyNumber', e.target.value)}
                  style={styles.input}
                />
                <select
                  value={employee.insurance?.life?.coverage || 'basic'}
                  onChange={(e) => handleInsuranceUpdate('life', 'coverage', e.target.value)}
                  style={styles.select}
                >
                  <option value="basic">Basic Coverage</option>
                  <option value="standard">Standard Coverage</option>
                  <option value="premium">Premium Coverage</option>
                </select>
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="life"
                    currentDocument={employee.insurance?.life}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Performance Reviews</h2>
            {employee.performanceReviews?.length > 0 ? (
              employee.performanceReviews.map(review => (
                <div key={review._id} style={styles.reviewCard}>
                  <h3>Review Date: {new Date(review.reviewDate).toLocaleDateString()}</h3>
                  <p><strong>Rating:</strong> {review.rating}/5</p>
                  <p><strong>Reviewer:</strong> {review.reviewerName}</p>
                  <p><strong>Comments:</strong> {review.comments}</p>
                </div>
              ))
            ) : (
              <p>No performance reviews available</p>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Payroll History</h2>
            {employee.payrollHistory?.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Period</th>
                    <th style={styles.tableHeader}>Basic Salary</th>
                    <th style={styles.tableHeader}>Gross Pay</th>
                    <th style={styles.tableHeader}>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.payrollHistory.map(payroll => (
                    <tr key={payroll._id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{`${payroll.month}/${payroll.year}`}</td>
                      <td style={styles.tableCell}>{formatCurrency(payroll.basicSalary, businessCurrency)}</td>
                      <td style={styles.tableCell}>{formatCurrency(payroll.grossSalary, businessCurrency)}</td>
                      <td style={styles.tableCell}>{formatCurrency(payroll.netSalary, businessCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No payroll history available</p>
            )}
          </div>
        )}

        {activeTab === 'deductions' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Custom Deductions</h2>
            
            {/* Add New Deduction Form */}
            <div style={styles.deductionForm}>
              <h3 style={styles.formTitle}>Add New Deduction</h3>
              <form onSubmit={handleAddCustomDeduction} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Description *</label>
                    <input
                      type="text"
                      value={newDeduction.description}
                      onChange={(e) => setNewDeduction({...newDeduction, description: e.target.value})}
                      style={styles.formInput}
                      placeholder="e.g., Salary Advance, Loan Repayment"
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Type *</label>
                    <select
                      value={newDeduction.type}
                      onChange={(e) => setNewDeduction({...newDeduction, type: e.target.value})}
                      style={styles.formSelect}
                      required
                    >
                      <option value="salary_advance">Salary Advance</option>
                      <option value="loan">Loan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Total Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newDeduction.amount}
                      onChange={(e) => setNewDeduction({...newDeduction, amount: e.target.value})}
                      style={styles.formInput}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Monthly Deduction Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newDeduction.monthlyAmount}
                      onChange={(e) => setNewDeduction({...newDeduction, monthlyAmount: e.target.value})}
                      style={styles.formInput}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Start Date *</label>
                    <input
                      type="date"
                      value={newDeduction.startDate}
                      onChange={(e) => setNewDeduction({...newDeduction, startDate: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>End Date</label>
                    <input
                      type="date"
                      value={newDeduction.endDate}
                      onChange={(e) => setNewDeduction({...newDeduction, endDate: e.target.value})}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                
                <div style={styles.formButtons}>
                  <button type="submit" style={styles.addButton}>
                    Add Deduction
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Deductions List */}
            <div style={styles.deductionsList}>
              <h3 style={styles.listTitle}>Current Deductions</h3>
              {employee.customDeductions && employee.customDeductions.length > 0 ? (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Description</th>
                        <th style={styles.tableHeader}>Type</th>
                        <th style={styles.tableHeader}>Total Amount</th>
                        <th style={styles.tableHeader}>Monthly Amount</th>
                        <th style={styles.tableHeader}>Remaining</th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.customDeductions.map((deduction) => (
                        <tr key={deduction._id} style={styles.tableRow}>
                          <td style={styles.tableCell}>{deduction.description}</td>
                          <td style={styles.tableCell}>
                            <span style={getDeductionTypeStyle(deduction.type)}>
                              {deduction.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.tableCell}>{formatCurrency(deduction.amount, businessCurrency)}</td>
                          <td style={styles.tableCell}>{formatCurrency(deduction.monthlyAmount, businessCurrency)}</td>
                          <td style={styles.tableCell}>{formatCurrency(deduction.remainingAmount || deduction.amount, businessCurrency)}</td>
                          <td style={styles.tableCell}>
                            <span style={getStatusStyle(deduction.status)}>
                              {deduction.status}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.deductionActions}>
                              {deduction.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateDeductionStatus(deduction._id, 'completed')}
                                  style={styles.actionBtn}
                                >
                                  Complete
                                </button>
                              )}
                              {deduction.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateDeductionStatus(deduction._id, 'cancelled')}
                                  style={styles.actionBtn}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDeduction(deduction._id)}
                                style={styles.deleteBtn}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={styles.noData}>No custom deductions found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'paymentMethods' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Payment Methods</h2>
            
            {/* Current Payment Method Status */}
            <div style={styles.paymentStatus}>
              <h3 style={styles.statusTitle}>Current Payment Method</h3>
              {employee.paymentMethodType ? (
                <div style={styles.statusInfo}>
                  <span style={styles.statusBadge}>
                    {employee.paymentMethodType === 'bank' ? '🏦 Bank Account' : '📱 Staffpesa Wallet'}
                  </span>
                  <p style={styles.statusText}>
                    {employee.paymentMethodType === 'bank' 
                      ? 'Employee receives salary via bank transfer'
                      : 'Employee receives salary via Staffpesa wallet'
                    }
                  </p>
                  {employee.paymentMethodUpdatedAt && (
                    <small style={styles.statusDate}>
                      Last updated: {new Date(employee.paymentMethodUpdatedAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
              ) : (
                <div style={styles.statusInfo}>
                  <span style={styles.statusBadge}>❌ No Payment Method</span>
                  <p style={styles.statusText}>Please select a payment method below</p>
                </div>
              )}
            </div>
            
            {/* Payment Method Selection */}
            <div style={styles.paymentMethodSelector}>
              <h3 style={styles.selectorTitle}>Select Payment Method</h3>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={activePaymentMethod === 'bank'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    style={styles.radioInput}
                    disabled={employee.paymentMethodType === 'wallet'}
                  />
                  <span style={styles.radioText}>🏦 Bank Account</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={activePaymentMethod === 'wallet'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    style={styles.radioInput}
                    disabled={employee.paymentMethodType === 'bank'}
                  />
                  <span style={styles.radioText}>📱 Staffpesa Wallet</span>
                </label>
              </div>
              
              {/* Clear guidance for switching */}
              {employee.paymentMethodType === 'bank' && (
                <div style={styles.switchGuidance}>
                  <p style={styles.guidanceText}>
                    💡 <strong>Want to switch to Staffpesa Wallet?</strong>
                  </p>
                  <p style={styles.guidanceText}>
                    Click "Remove Bank Accounts" above, then select "Staffpesa Wallet" and add your wallet details.
                  </p>
                </div>
              )}
              
              {employee.paymentMethodType === 'wallet' && (
                <div style={styles.switchGuidance}>
                  <p style={styles.guidanceText}>
                    💡 <strong>Want to switch to Bank Account?</strong>
                  </p>
                  <p style={styles.guidanceText}>
                    Click "Remove Staffpesa Wallet" above, then select "Bank Account" and add your bank details.
                  </p>
                </div>
              )}
              
              {!employee.paymentMethodType && (
                <div style={styles.switchGuidance}>
                  <p style={styles.guidanceText}>
                    💡 <strong>No payment method configured</strong>
                  </p>
                  <p style={styles.guidanceText}>
                    Select a payment method above and add the required details to enable salary payments.
                  </p>
                </div>
              )}
            </div>

            {/* Bank Accounts Section */}
            {activePaymentMethod === 'bank' && (
              <div style={{ marginBottom: '24px' }}>
                <h3>Bank Accounts</h3>
                {employee.bankAccounts && employee.bankAccounts.length > 0 ? (
                  <div>
                    <ul>
                      {employee.bankAccounts.map((acc, idx) => (
                        <li key={acc._id || idx} style={{ marginBottom: 8 }}>
                          <strong>{acc.bankName}</strong> - {acc.accountNumber} ({acc.accountType})
                          {acc.isPrimary && <span style={{ color: '#27ae60', marginLeft: 8 }}>(Primary)</span>}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={handleRemoveBankAccounts}
                      style={styles.removeButton}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Removing...' : 'Remove Bank Accounts'}
                    </button>
                  </div>
                ) : (
                  <p>No bank accounts added.</p>
                )}
                <form onSubmit={handleAddBankAccount} style={{ marginTop: 12 }}>
                  <input type="text" placeholder="Bank Name" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} style={styles.formInput} required disabled={employee.paymentMethodType === 'wallet'} />
                  <input type="text" placeholder="Account Number" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} style={styles.formInput} required disabled={employee.paymentMethodType === 'wallet'} />
                  <input type="text" placeholder="Account Type" value={bankForm.accountType} onChange={e => setBankForm({ ...bankForm, accountType: e.target.value })} style={styles.formInput} required disabled={employee.paymentMethodType === 'wallet'} />
                  <label style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    <input type="checkbox" checked={bankForm.isPrimary} onChange={e => setBankForm({ ...bankForm, isPrimary: e.target.checked })} disabled={employee.paymentMethodType === 'wallet'} /> Primary
                  </label>
                  <button type="submit" style={styles.addButton} disabled={employee.paymentMethodType === 'wallet'}>Add Bank Account</button>
                </form>
                {employee.paymentMethodType === 'wallet' && (
                  <p style={{ color: '#e67e22', marginTop: 8 }}>Staffpesa wallet is active. Remove it to add a bank account.</p>
                )}
              </div>
            )}

            {/* Staffpesa Wallet Section */}
            {activePaymentMethod === 'wallet' && (
              <div>
                <h3>Staffpesa Wallet</h3>
                {employee.staffpesaWallet && employee.staffpesaWallet.walletId ? (
                  <div>
                    <p><strong>Wallet ID:</strong> {employee.staffpesaWallet.walletId}</p>
                    <p><strong>Phone Number:</strong> {employee.staffpesaWallet.phoneNumber}</p>
                    <p><strong>Status:</strong> {employee.staffpesaWallet.isActive ? 'Active' : 'Inactive'}</p>
                    <button 
                      onClick={handleRemoveWallet}
                      style={styles.removeButton}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Removing...' : 'Remove Staffpesa Wallet'}
                    </button>
                  </div>
                ) : (
                  <p>No Staffpesa wallet added.</p>
                )}
                <form onSubmit={handleAddWallet} style={{ marginTop: 12 }}>
                  <input type="text" placeholder="Wallet ID" value={walletForm.walletId} onChange={e => setWalletForm({ ...walletForm, walletId: e.target.value })} style={styles.formInput} required disabled={employee.paymentMethodType === 'bank'} />
                  <input type="text" placeholder="Phone Number (07XXXXXXXX)" value={walletForm.phoneNumber} onChange={e => setWalletForm({ ...walletForm, phoneNumber: e.target.value })} style={styles.formInput} required disabled={employee.paymentMethodType === 'bank'} />
                  <small style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'block' }}>
                    Accepted formats: 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXXX, or 254XXXXXXXXX
                  </small>
                  <label style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    <input type="checkbox" checked={walletForm.isActive} onChange={e => setWalletForm({ ...walletForm, isActive: e.target.checked })} disabled={employee.paymentMethodType === 'bank'} /> Active
                  </label>
                  <button type="submit" style={styles.addButton} disabled={employee.paymentMethodType === 'bank'}>Add/Update Wallet</button>
                </form>
                {employee.paymentMethodType === 'bank' && (
                  <p style={{ color: '#e67e22', marginTop: 8 }}>Bank account is active. Remove it to add a Staffpesa wallet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Employee</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this employee? This action will:
            </p>
            <ul style={styles.modalList}>
              <li>Delete all employee records</li>
              <li>Remove payroll history</li>
              <li>Delete performance reviews</li>
              <li>Remove all uploaded documents</li>
            </ul>
            <p style={styles.modalWarning}>This action cannot be undone.</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={styles.cancelButton}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                style={{...styles.confirmButton, ...styles.deleteButton}}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getDeductionTypeStyle = (type) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: 
    type === 'salary_advance' ? '#ffd700' :
    type === 'loan' ? '#87CEEB' :
    '#f0f0f0',
  color: '#333'
});

const getStatusStyle = (status) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: 
    status === 'active' ? '#2ecc71' :
    status === 'completed' ? '#ffd700' :
    '#e74c3c',
  color: 'white'
});

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.5rem',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#f1f1f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f1f1f1',
    fontSize: '0.875rem',
  },
  activeTab: {
    backgroundColor: '#3498db',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  label: {
    color: '#666',
    fontSize: '0.75rem',
  },
  value: {
    color: '#2c3e50',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  reviewCard: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    marginBottom: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
    backgroundColor: 'white',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '1px solid #e9ecef',
    fontSize: '0.75rem',
  },
  tableCell: {
    padding: '8px 12px',
    borderBottom: '1px solid #e9ecef',
    color: '#2c3e50',
    fontSize: '0.75rem',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  downloadButton: {
    padding: '4px 8px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  error: {
    color: '#e74c3c',
    padding: '15px',
    backgroundColor: '#ffd5d5',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '15px',
    color: '#666',
    fontSize: '0.875rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  documentSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  documentTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1rem',
  },
  documentInfo: {
    marginBottom: '10px',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '3px',
    marginTop: '8px',
    fontSize: '0.75rem',
  },
  fileInput: {
    marginTop: '8px',
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    width: '100%',
    fontSize: '0.75rem',
  },
  insuranceSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  insuranceTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1rem',
  },
  insuranceInfo: {
    marginBottom: '10px',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  input: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '0.75rem',
    width: '100%',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '0.75rem',
    backgroundColor: 'white',
    width: '100%',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
  },
  actionButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '3px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.75rem',
    backgroundColor: '#3498db',
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '6px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 12px 0',
    color: '#2c3e50',
    fontSize: '1.125rem',
  },
  modalText: {
    margin: '0 0 12px 0',
    color: '#666',
    fontSize: '0.875rem',
  },
  modalList: {
    margin: '0 0 12px 0',
    fontSize: '0.875rem',
  },
  modalButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    },
  confirmButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    color: 'white',
  },
  deductionForm: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginBottom: '10px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  formInput: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '0.75rem',
  },
  formSelect: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '0.75rem',
    backgroundColor: 'white',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  deductionsList: {
    marginTop: '20px',
  },
  listTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
    fontSize: '16px',
    fontWeight: '600',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  noData: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  subtitle: {
    margin: '0 0 20px 0',
    color: '#2c3e50',
    fontSize: '18px',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  modalWarning: {
    color: '#e74c3c',
    fontWeight: '500',
    margin: '0 0 16px 0',
  },
  paymentMethodSelector: {
    marginBottom: '20px',
  },
  selectorTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '8px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  radioInput: {
    marginRight: '8px',
  },
  radioText: {
    fontSize: '0.875rem',
  },
  paymentStatus: {
    marginBottom: '20px',
  },
  statusTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1rem',
  },
  statusInfo: {
    marginBottom: '10px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#e8f5e8',
    color: '#27ae60',
    display: 'inline-block',
    marginBottom: '8px',
  },
  statusText: {
    margin: '4px 0',
    color: '#666',
    fontSize: '0.875rem',
  },
  statusDate: {
    color: '#999',
    fontSize: '0.75rem',
  },
  warningText: {
    color: '#e67e22',
    fontSize: '0.875rem',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffeaa7',
  },
  removeButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  quickSwitchButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginTop: '8px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  switchGuidance: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
  },
  guidanceText: {
    margin: '4px 0',
    color: '#666',
    fontSize: '0.875rem',
  },
};

export default EmployeeDetails; 
