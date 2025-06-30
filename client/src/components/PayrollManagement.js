import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function PayrollManagement() {
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationDate, setRegistrationDate] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [activeStep, setActiveStep] = useState('process'); // 'process', 'review', 'payments'
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [businessCurrency, setBusinessCurrency] = useState('KES');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchBusinessDetails();
    fetchPayrollSettings();
    fetchBusinessCurrency();
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/employees', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      setLoading(true);
      
      const response = await fetchWithAuth(`http://localhost:5001/api/payroll/history?month=${selectedMonth}&year=${selectedYear}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payroll history');
      }

      const data = await response.json();
      console.log('=== PAYROLL DATA DEBUG ===');
      console.log('Fetched payroll data:', data);
      
      // Debug individual deductions in each record
      data.forEach((record, index) => {
        console.log(`Record ${index + 1} - ${record.employeeId?.firstName} ${record.employeeId?.lastName}:`);
        console.log('  All deductions:', record.deductions?.items || []);
        
        // Show all deduction names
        const deductionNames = (record.deductions?.items || []).map(item => item.name);
        console.log('  Deduction names:', deductionNames);
        
        const individualDeductions = (record.deductions?.items || []).filter(item => 
          item.type && ['salary_advance', 'loan', 'other', 'individual'].includes(item.type)
        );
        console.log('  Individual deductions (by type):', individualDeductions);
        
        // Show any deductions with isIndividual flag
        const flaggedDeductions = (record.deductions?.items || []).filter(item => item.isIndividual === true);
        console.log('  Flagged deductions:', flaggedDeductions);
        
        const total = individualDeductions.reduce((sum, item) => sum + (item.amount || 0), 0);
        console.log('  Individual total:', total);
      });
      console.log('=== END PAYROLL DATA DEBUG ===');

      // Fetch detailed employee information for each payroll record
      const enrichedData = await Promise.all(
        data.map(async (payrollRecord) => {
          try {
            const employeeResponse = await fetchWithAuth(
              `http://localhost:5001/api/employees/${payrollRecord.employeeId._id}`
            );
            
            if (employeeResponse.ok) {
              const employeeData = await employeeResponse.json();
              return {
                ...payrollRecord,
                employeeId: {
                  ...payrollRecord.employeeId,
                  bankAccounts: employeeData.bankAccounts || [],
                  staffpesaWallet: employeeData.staffpesaWallet
                }
              };
            }
            
            return payrollRecord;
          } catch (error) {
            console.error('Error fetching employee details:', error);
            return payrollRecord;
          }
        })
      );

      setPayrollHistory(enrichedData);
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/payroll/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payroll settings');
      }

      const data = await response.json();
      console.log('Payroll settings:', data);
      setPayrollSettings(data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      setError(error.message);
    }
  };

  const fetchBusinessCurrency = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/business', {
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

  const processPayroll = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!payrollSettings) {
        throw new Error('Please configure your payroll settings before processing payroll');
      }

      // Check if payroll has already been processed and paid for this month
      const existingPayroll = payrollHistory.filter(record => record.status === 'paid');
      if (existingPayroll.length > 0) {
        throw new Error(`Payroll for ${new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear} has already been processed and paid. Cannot reprocess.`);
      }
      
      const response = await fetchWithAuth('http://localhost:5001/api/payroll/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          settings: payrollSettings
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Payroll processing failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        if (response.status === 400) {
          if (data.message === 'Payroll settings not found') {
            throw new Error('Please configure your payroll settings before processing payroll');
          } else if (data.message === 'No active employees found') {
            throw new Error('No active employees found. Please add employees before processing payroll');
          } else if (data.errors && data.errors.length > 0) {
            throw new Error(`Payroll processing failed for some employees:\n${data.errors.join('\n')}`);
          }
        }
        
        throw new Error(data.message || data.error || 'Failed to process payroll');
      }

      setSuccess('Payroll processed successfully! You can now review and approve the payroll.');
      await fetchPayrollHistory();
      // Automatically advance to review step after successful processing
      setActiveStep('review');
    } catch (error) {
      console.error('Payroll processing error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async () => {
    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee for payroll approval');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestBody = {
        month: selectedMonth,
        year: selectedYear,
        employeeIds: selectedEmployees
      };

      const response = await fetchWithAuth('http://localhost:5001/api/payroll/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve payroll');
      }

      setSuccess('Payroll approved successfully! You can now process payments.');
      await fetchPayrollHistory();
      setActiveStep('payments');
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const processPayments = async () => {
    if (selectedEmployees.length === 0) {
      setError('Please select payments to process');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await fetchWithAuth('http://localhost:5001/api/payroll/process-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          paymentIds: selectedEmployees
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payments');
      }

      setSuccess(`Payment successfully disbursed! ${data.processedCount} payments processed.`);
      setPaymentStatus(data.paymentStatus || {});
      await fetchPayrollHistory();
      
      // Return to step 1 after successful payment processing
      setTimeout(() => {
        setActiveStep('process');
        setSelectedEmployees([]);
        setSuccess(null);
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadPayslip = async (payrollId) => {
    try {
      const response = await fetchWithAuth(`http://localhost:5001/api/payroll/download/${payrollId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download payslip');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      setError(error.message || 'Failed to download payslip. Please try again.');
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await fetchWithAuth(`http://localhost:5001/api/payroll/download-excel?month=${selectedMonth}&year=${selectedYear}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download Excel file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-${selectedMonth}-${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError(error.message || 'Failed to download Excel file. Please try again.');
    }
  };

  const fetchBusinessDetails = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/business', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch business details');
      }
      
      const data = await response.json();
      setRegistrationDate(new Date(data.createdAt));
    } catch (error) {
      console.error('Error fetching business details:', error);
    }
  };

  const isValidPayrollPeriod = (month, year) => {
    // During development, allow all dates
    return true;

    // Original validation logic (commented out for development)
    /*
    if (!registrationDate) return true; // Allow if registration date not loaded yet
    
    const periodDate = new Date(year, month - 1);
    const currentDate = new Date();
    
    // Cannot process future months
    if (periodDate > currentDate) return false;
    
    // Cannot process months before registration
    if (periodDate < registrationDate) return false;
    
    return true;
    */
  };

  // Filter payroll history based on search term
  const filteredPayrollHistory = payrollHistory.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    const employeeName = `${record.employeeId?.firstName} ${record.employeeId?.lastName}`.toLowerCase();
    const employeeNumber = record.employeeId?.employeeNumber?.toLowerCase() || '';
    const department = record.employeeId?.department?.toLowerCase() || '';
    const position = record.employeeId?.position?.toLowerCase() || '';

    return employeeName.includes(searchLower) ||
           employeeNumber.includes(searchLower) ||
           department.includes(searchLower) ||
           position.includes(searchLower);
  });

  // Get configured deductions from payroll settings
  const getConfiguredDeductions = () => {
    if (!payrollSettings?.taxRates) return [];
    
    const deductions = [];
    if (payrollSettings.taxRates.paye?.enabled) deductions.push('PAYE');
    if (payrollSettings.taxRates.nhif?.enabled) deductions.push('NHIF');
    if (payrollSettings.taxRates.nssf?.enabled) deductions.push('NSSF');
    
    // Add custom deductions
    if (payrollSettings.taxRates.customDeductions) {
      payrollSettings.taxRates.customDeductions
        .filter(d => d.enabled)
        .forEach(d => deductions.push(d.name));
    }
    
    return deductions;
  };

  // Get configured allowances from payroll settings
  const getConfiguredAllowances = () => {
    if (!payrollSettings?.taxRates?.allowances) return [];
    
    return payrollSettings.taxRates.allowances
      .filter(a => a.enabled)
      .map(a => a.name);
  };

  const configuredDeductions = getConfiguredDeductions();
  const configuredAllowances = getConfiguredAllowances();

  const getPaymentMethod = (employee) => {
    // Check for Staffpesa wallet first (takes priority)
    if (employee.staffpesaWallet && employee.staffpesaWallet.walletId) {
      return {
        type: 'wallet',
        label: 'Staffpesa Wallet',
        details: `${employee.staffpesaWallet.walletId} (${employee.staffpesaWallet.phoneNumber})`,
        status: employee.staffpesaWallet.isActive ? 'Active' : 'Inactive',
        fullDetails: {
          walletId: employee.staffpesaWallet.walletId,
          phoneNumber: employee.staffpesaWallet.phoneNumber,
          isActive: employee.staffpesaWallet.isActive,
          status: employee.staffpesaWallet.status
        }
      };
    } 
    
    // Check for bank accounts
    if (employee.bankAccounts && employee.bankAccounts.length > 0) {
      const primaryAccount = employee.bankAccounts.find(acc => acc.isPrimary) || employee.bankAccounts[0];
      return {
        type: 'bank',
        label: 'Bank Account',
        details: `${primaryAccount.bankName} - ${primaryAccount.accountNumber}`,
        status: 'Active',
        fullDetails: {
          bankName: primaryAccount.bankName,
          accountNumber: primaryAccount.accountNumber,
          accountType: primaryAccount.accountType,
          isPrimary: primaryAccount.isPrimary,
          totalAccounts: employee.bankAccounts.length
        }
      };
    }
    
    // No payment method available
    return { 
      type: 'none', 
      label: 'No Payment Method', 
      details: 'Employee needs payment setup',
      status: 'Not Configured',
      fullDetails: null
    };
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      processed: { backgroundColor: '#17a2b8', color: '#fff' },
      approved: { backgroundColor: '#28a745', color: '#fff' },
      paid: { backgroundColor: '#28a745', color: '#fff' },
      failed: { backgroundColor: '#dc3545', color: '#fff' },
      pending: { backgroundColor: '#ffc107', color: '#000' }
    };
    
    return {
      ...statusStyles[status] || statusStyles.pending,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600'
    };
  };

  const getStepStatus = (step) => {
    if (step === 'process') return 'active';
    if (step === 'review' && payrollHistory.length > 0 && !payrollHistory.some(p => p.status === 'paid')) return 'active';
    if (step === 'payments' && payrollHistory.some(p => p.status === 'approved') && !payrollHistory.some(p => p.status === 'paid')) return 'active';
    return 'disabled';
  };

  const canNavigateToStep = (step) => {
    if (step === 'process') return true;
    if (step === 'review' && payrollHistory.length > 0 && !payrollHistory.some(p => p.status === 'paid')) return true;
    if (step === 'payments' && payrollHistory.some(p => p.status === 'approved') && !payrollHistory.some(p => p.status === 'paid')) return true;
    return false;
  };

  const handleStepClick = (step) => {
    if (canNavigateToStep(step)) {
      setActiveStep(step);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          ← Back
        </button>
        <h1 style={styles.title}>Payroll Management</h1>
        <div style={styles.headerActions}>
        </div>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Workflow Steps */}
      <div style={styles.steps}>
        <button
          style={{
            ...styles.step,
            ...(activeStep === 'process' && styles.activeStep),
            ...(getStepStatus('process') === 'disabled' && styles.disabledStep)
          }}
          onClick={() => handleStepClick('process')}
          disabled={!canNavigateToStep('process')}
        >
          <span style={styles.stepNumber}>1</span>
          <span style={styles.stepLabel}>Process Payroll</span>
        </button>
        <button
          style={{
            ...styles.step,
            ...(activeStep === 'review' && styles.activeStep),
            ...(getStepStatus('review') === 'disabled' && styles.disabledStep)
          }}
          onClick={() => handleStepClick('review')}
          disabled={!canNavigateToStep('review')}
        >
          <span style={styles.stepNumber}>2</span>
          <span style={styles.stepLabel}>Review & Approve</span>
        </button>
        <button
          style={{
            ...styles.step,
            ...(activeStep === 'payments' && styles.activeStep),
            ...(getStepStatus('payments') === 'disabled' && styles.disabledStep)
          }}
          onClick={() => handleStepClick('payments')}
          disabled={!canNavigateToStep('payments')}
        >
          <span style={styles.stepNumber}>3</span>
          <span style={styles.stepLabel}>Process Payments</span>
        </button>
      </div>
      
      <div style={styles.controls}>
        <div style={styles.dateControls}>
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          style={styles.select}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const isValid = isValidPayrollPeriod(month, selectedYear);
            return (
              <option 
                key={month} 
                value={month}
                disabled={!isValid}
              >
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                {!isValid ? ' (Not Available)' : ''}
              </option>
            );
          })}
        </select>
        
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={styles.select}
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            const isValid = isValidPayrollPeriod(selectedMonth, year);
            return (
              <option 
                key={year} 
                value={year}
                disabled={!isValid}
              >
                {year}
                {!isValid ? ' (Not Available)' : ''}
              </option>
            );
          })}
        </select>

        <button
          style={styles.processButton}
          onClick={processPayroll}
          disabled={loading || !isValidPayrollPeriod(selectedMonth, selectedYear)}
        >
          {loading ? 'Processing...' : 'Process Payroll'}
        </button>
        
        {filteredPayrollHistory.length > 0 && (
          <button
            style={styles.downloadButton}
            onClick={downloadExcel}
          >
            Download Excel
          </button>
        )}
        </div>
      </div>

      {/* Search Bar - Moved here */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by employee name, number, department, or position..."
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
        {/* Workflow Action Buttons - Top */}
        {activeStep === 'review' && (
          <div style={styles.workflowActions}>
            <div style={styles.actionInfo}>
              <p>Selected: {selectedEmployees.length} employees</p>
              <p>
                Total Amount: {getCurrencySymbol(businessCurrency)} {
                  filteredPayrollHistory
                    .filter(r => selectedEmployees.includes(r._id))
                    .reduce((sum, r) => sum + (r.netSalary || 0), 0)
                    .toLocaleString()
                }
              </p>
            </div>
            <div style={styles.actionButtons}>
              <button
                onClick={() => setSelectedEmployees(filteredPayrollHistory.map(r => r._id))}
                style={styles.selectAllButton}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedEmployees([])}
                style={styles.clearButton}
              >
                Clear All
              </button>
              <button
                onClick={approvePayroll}
                disabled={processing || selectedEmployees.length === 0}
                style={styles.approveButton}
              >
                {processing ? 'Approving...' : 'Approve Selected'}
              </button>
            </div>
          </div>
        )}

        {activeStep === 'payments' && (
          <div style={styles.workflowActions}>
            <div style={styles.actionInfo}>
              <p>Selected: {selectedEmployees.length} payments</p>
              <p>
                Total Amount: {getCurrencySymbol(businessCurrency)} {
                  filteredPayrollHistory
                    .filter(r => selectedEmployees.includes(r._id))
                    .reduce((sum, r) => sum + (r.netSalary || 0), 0)
                    .toLocaleString()
                }
              </p>
            </div>
            <div style={styles.actionButtons}>
              <button
                onClick={() => setSelectedEmployees(filteredPayrollHistory.filter(r => r.status === 'approved').map(r => r._id))}
                style={styles.selectAllButton}
              >
                Select All Approved
              </button>
              <button
                onClick={() => setSelectedEmployees([])}
                style={styles.clearButton}
              >
                Clear All
              </button>
              <button
                onClick={processPayments}
                disabled={processing || selectedEmployees.length === 0}
                style={styles.processButton}
              >
                {processing ? 'Processing Payments...' : 'Process Selected Payments'}
              </button>
            </div>
          </div>
        )}

        {filteredPayrollHistory.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                {(activeStep === 'review' || activeStep === 'payments') && (
                  <th style={styles.tableHeader}>Select</th>
                )}
                <th style={styles.tableHeader}>Employee ID</th>
                <th style={styles.tableHeader}>Employee</th>
                {activeStep === 'process' && (
                  <>
                    <th style={styles.tableHeader}>Position</th>
                    <th style={styles.tableHeader}>Department</th>
                  </>
                )}
                <th style={styles.tableHeader}>Basic Salary</th>
                {configuredAllowances.map(allowance => (
                  <th key={allowance} style={styles.tableHeader}>{allowance}</th>
                ))}
                <th style={styles.tableHeader}>Total Allowances</th>
                <th style={styles.tableHeader}>Gross Salary</th>
                <th style={styles.tableHeader}>SHIF</th>
                <th style={styles.tableHeader}>NSSF</th>
                <th style={styles.tableHeader}>Housing Levy</th>
                <th style={styles.tableHeader}>Taxable Income</th>
                <th style={styles.tableHeader}>PAYE</th>
                {configuredDeductions.map(deduction => (
                  <th key={deduction} style={styles.tableHeader}>{deduction}</th>
                ))}
                <th style={styles.tableHeader}>Individual Deductions</th>
                <th style={styles.tableHeader}>Total Deductions</th>
                <th style={styles.tableHeader}>Net Salary</th>
                {(activeStep === 'review' || activeStep === 'payments') && (
                  <th style={styles.tableHeader}>Payment Method</th>
                )}
                {(activeStep === 'review' || activeStep === 'payments') && (
                  <th style={styles.tableHeader}>Status</th>
                )}
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrollHistory.map((record) => (
                <tr key={record._id}>
                  {(activeStep === 'review' || activeStep === 'payments') && (
                    <td style={styles.tableCell}>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(record._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([...selectedEmployees, record._id]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== record._id));
                          }
                        }}
                      />
                    </td>
                  )}
                  <td style={styles.tableCell}>
                    {record.employeeId?.employeeNumber || 'N/A'}
                  </td>
                  <td style={styles.tableCell}>
                    {`${record.employeeId?.firstName} ${record.employeeId?.lastName}`}
                  </td>
                  {activeStep === 'process' && (
                    <>
                      <td style={styles.tableCell}>
                        {record.employeeId?.position || 'N/A'}
                      </td>
                      <td style={styles.tableCell}>
                        {record.employeeId?.department || 'N/A'}
                      </td>
                    </>
                  )}
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.basicSalary?.toLocaleString()}
                  </td>
                  {configuredAllowances.map(allowance => {
                    const allowanceItem = record.allowances?.items?.find(item => 
                      item.name.toLowerCase() === allowance.toLowerCase()
                    );
                    return (
                      <td key={allowance} style={styles.tableCell}>
                        {getCurrencySymbol(businessCurrency)} {allowanceItem?.amount?.toLocaleString() || '0'}
                      </td>
                    );
                  })}
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.allowances?.total?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.grossSalary?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.deductions?.items?.find(item => item.name === 'SHIF')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.deductions?.items?.find(item => item.name === 'NSSF')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.deductions?.items?.find(item => item.name === 'Housing Levy')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.taxableIncome?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.deductions?.items?.find(item => item.name === 'PAYE')?.amount?.toLocaleString() || '0'}
                  </td>
                  {configuredDeductions.map(deduction => {
                    const deductionItem = record.deductions?.items?.find(item => 
                      item.name.toLowerCase() === deduction.toLowerCase()
                    );
                    return (
                      <td key={deduction} style={styles.tableCell}>
                        {getCurrencySymbol(businessCurrency)} {deductionItem?.amount?.toLocaleString() || '0'}
                      </td>
                    );
                  })}
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {(() => {
                      const allDeductions = record.deductions?.items || [];
                      
                      // Debug: Show all deductions for this employee
                      console.log('=== PAYROLL DEDUCTIONS DEBUG ===');
                      console.log('Employee:', `${record.employeeId?.firstName} ${record.employeeId?.lastName}`);
                      console.log('All deductions:', JSON.stringify(allDeductions, null, 2));
                      
                      // Simple approach: Look for deductions that are NOT standard deductions
                      const standardDeductionNames = [
                        'PAYE', 'NHIF', 'NSSF', 'SHIF', 'Housing Levy', 'housing levy'
                      ];
                      
                      const individualDeductions = allDeductions.filter(item => {
                        // Check if it's NOT a standard deduction
                        const isStandardDeduction = standardDeductionNames.some(name => 
                          item.name.toLowerCase() === name.toLowerCase()
                        );
                        
                        // Check if it has individual deduction indicators
                        const hasType = item.type && ['salary_advance', 'loan', 'other', 'individual'].includes(item.type);
                        const hasIndividualFlag = item.isIndividual === true;
                        const hasIndividualName = item.name && [
                          'salary advance', 'advance', 'loan', 'loan repayment', 
                          'personal loan', 'emergency loan', 'advance payment',
                          'test salary advance'
                        ].some(name => item.name.toLowerCase().includes(name.toLowerCase()));
                        
                        // It's an individual deduction if it's not standard AND has any individual indicator
                        // OR if it's not a standard deduction and we can't identify it otherwise
                        const isIndividual = !isStandardDeduction && (hasType || hasIndividualFlag || hasIndividualName);
                        
                        // Fallback: If it's not a standard deduction and has a significant amount, treat as individual
                        const isSignificantAmount = item.amount > 0;
                        const isIndividualFallback = !isStandardDeduction && isSignificantAmount && !hasType && !hasIndividualFlag && !hasIndividualName;
                        
                        const finalIsIndividual = isIndividual || isIndividualFallback;
                        
                        console.log('Deduction check:', {
                          name: item.name,
                          type: item.type,
                          amount: item.amount,
                          isIndividual: item.isIndividual,
                          isStandardDeduction: isStandardDeduction,
                          hasType: hasType,
                          hasIndividualFlag: hasIndividualFlag,
                          hasIndividualName: hasIndividualName,
                          isIndividual: finalIsIndividual
                        });
                        
                        return finalIsIndividual;
                      });
                      
                      const total = individualDeductions.reduce((sum, item) => sum + (item.amount || 0), 0);
                      
                      console.log('Individual deductions found:', individualDeductions);
                      console.log('Total individual deductions:', total);
                      console.log('=== END PAYROLL DEDUCTIONS DEBUG ===');
                      
                      return total.toLocaleString();
                    })()}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.deductions?.total?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {getCurrencySymbol(businessCurrency)} {record.netSalary?.toLocaleString()}
                  </td>
                  {(activeStep === 'review' || activeStep === 'payments') && (
                    <td style={styles.tableCell}>
                      {getPaymentMethod(record.employeeId).label}
                    </td>
                  )}
                  {(activeStep === 'review' || activeStep === 'payments') && (
                    <td style={styles.tableCell}>
                      <span style={getStatusBadge(record.status)}>
                        {activeStep === 'review' ? 'PROCESSED' : 
                         activeStep === 'payments' && record.status === 'approved' ? 'APPROVED' :
                         activeStep === 'payments' && record.status === 'paid' ? 'PAID' :
                         record.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  )}
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button 
                        onClick={() => downloadPayslip(record._id)}
                        style={styles.downloadButton}
                        title="Download Payslip"
                      >
                        📄 Payslip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.noData}>
            {activeStep === 'process' ? (
              <div>
                <p>No payroll records found for {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '8px' }}>
                  Click the "Process Payroll" button above to generate payroll for this period.
                </p>
              </div>
            ) : searchTerm ? (
              'No payroll records found matching your search criteria.'
            ) : (
              `No payroll records found for ${new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '10px',
    maxWidth: '100%',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#5a6268',
    },
  },
  title: {
    marginBottom: '15px',
    color: '#2c3e50',
    fontSize: '1.5rem',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  dateControls: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.875rem',
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  settingsButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  processButton: {
    padding: '6px 12px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '15px',
  },
  summaryTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  filteredLabel: {
    fontSize: '0.875rem',
    color: '#666',
    fontWeight: 'normal',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    padding: '8px',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  cardIcon: {
    fontSize: '1.5rem',
    marginBottom: '8px',
  },
  cardLabel: {
    color: '#6c757d',
    fontSize: '0.75rem',
    marginBottom: '4px',
    textAlign: 'center',
  },
  cardValue: {
    color: '#2c3e50',
    fontSize: '1rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    margin: '0 10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    padding: '6px 4px',
    textAlign: 'left',
    fontSize: '0.7rem',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  tableCell: {
    padding: '6px 4px',
    color: '#2c3e50',
    fontSize: '0.7rem',
  },
  error: {
    color: 'red',
    marginBottom: '8px',
    fontSize: '0.875rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  downloadButton: {
    padding: '4px 8px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  noData: {
    textAlign: 'center',
    padding: '15px',
    color: '#6c757d',
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontSize: '0.875rem',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  searchContainer: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    marginTop: '15px',
  },
  searchInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
    },
  },
  clearSearchButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  steps: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
  },
  step: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  activeStep: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  disabledStep: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  stepNumber: {
    fontWeight: '600',
  },
  stepLabel: {
    marginLeft: '8px',
  },
  workflowActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '15px',
  },
  actionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectAllButton: {
    padding: '6px 12px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  approveButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};

export default PayrollManagement; 