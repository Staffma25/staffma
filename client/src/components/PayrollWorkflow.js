import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';

function PayrollWorkflow() {
  const { month, year } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('process');
  const [payrollData, setPayrollData] = useState([]);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayrollData();
    fetchPayrollSettings();
  }, [month, year]);

  const fetchPayrollData = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetchWithAuth(
        `http://localhost:5001/api/payroll/history?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payroll data');
      }

      const data = await response.json();
      
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
      
      setPayrollData(enrichedData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingEmployees(false);
      setLoading(false);
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5001/api/payroll/settings');
      if (response.ok) {
        const data = await response.json();
        setPayrollSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  const processPayroll = async () => {
    try {
      setProcessing(true);
      setError('');

      if (!payrollSettings) {
        throw new Error('Please configure your payroll settings before processing payroll');
      }

      const response = await fetchWithAuth('http://localhost:5001/api/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(month),
          year: parseInt(year),
          settings: payrollSettings
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to process payroll');
      }

      setSuccess('Payroll processed successfully! You can now review and approve the payroll.');
      await fetchPayrollData();
      setActiveStep('review');
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
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
        month: parseInt(month),
        year: parseInt(year),
        employeeIds: selectedEmployees
      };

      console.log('=== PAYROLL APPROVAL REQUEST DEBUG ===');
      console.log('Request body:', requestBody);
      console.log('Selected employees (payroll IDs):', selectedEmployees);
      console.log('Payroll data statuses:', payrollData.map(p => ({
        id: p._id,
        status: p.status,
        employeeName: `${p.employeeId?.firstName} ${p.employeeId?.lastName}`
      })));
      console.log('=== END PAYROLL APPROVAL REQUEST DEBUG ===');

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
      await fetchPayrollData();
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
          month: parseInt(month),
          year: parseInt(year),
          paymentIds: selectedEmployees
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payments');
      }

      setSuccess(`Successfully processed ${data.processedCount} payments!`);
      setPaymentStatus(data.paymentStatus || {});
      await fetchPayrollData();
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

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
    if (step === 'review' && payrollData.length > 0) return 'active';
    if (step === 'payments' && payrollData.some(p => p.status === 'approved')) return 'active';
    return 'disabled';
  };

  const canNavigateToStep = (step) => {
    if (step === 'process') return true;
    if (step === 'review' && payrollData.length > 0) return true;
    if (step === 'payments' && payrollData.some(p => p.status === 'approved')) return true;
    return false;
  };

  const handleStepClick = (step) => {
    if (canNavigateToStep(step)) {
      setActiveStep(step);
    }
  };

  // Auto-advance to next step when appropriate
  useEffect(() => {
    if (payrollData.length > 0 && activeStep === 'process') {
      setActiveStep('review');
      // Show welcome message when redirected from payroll processing
      if (payrollData[0]?.status === 'processed') {
        setSuccess('Welcome to the Payroll Workflow! Your payroll has been processed successfully. Please review and approve the payroll.');
      }
    }
    if (payrollData.some(p => p.status === 'approved') && activeStep === 'review') {
      setActiveStep('payments');
    }
  }, [payrollData, activeStep]);

  const getPaymentMethodStats = () => {
    const stats = {
      total: payrollData.length,
      wallet: 0,
      bank: 0,
      none: 0,
      activeWallet: 0,
      activeBank: 0
    };

    payrollData.forEach(record => {
      const paymentMethod = getPaymentMethod(record.employeeId);
      
      if (paymentMethod.type === 'wallet') {
        stats.wallet++;
        if (paymentMethod.status === 'Active') {
          stats.activeWallet++;
        }
      } else if (paymentMethod.type === 'bank') {
        stats.bank++;
        if (paymentMethod.status === 'Active') {
          stats.activeBank++;
        }
      } else {
        stats.none++;
      }
    });

    return stats;
  };

  const paymentStats = getPaymentMethodStats();

  // Debug function to log payment method information
  const debugPaymentMethods = () => {
    console.log('=== PAYMENT METHODS DEBUG ===');
    payrollData.forEach((record, index) => {
      const paymentMethod = getPaymentMethod(record.employeeId);
      console.log(`Employee ${index + 1}: ${record.employeeId?.firstName} ${record.employeeId?.lastName}`);
      console.log('  Payment Method:', paymentMethod);
      console.log('  Bank Accounts:', record.employeeId?.bankAccounts);
      console.log('  Staffpesa Wallet:', record.employeeId?.staffpesaWallet);
      console.log('---');
    });
    console.log('Payment Stats:', paymentStats);
    console.log('=== END PAYMENT METHODS DEBUG ===');
  };

  // Call debug function when payroll data changes
  useEffect(() => {
    if (payrollData.length > 0) {
      debugPaymentMethods();
    }
  }, [payrollData]);

  if (loading) return <div style={styles.loading}>Loading payroll data...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/payroll')} style={styles.backButton}>
          ← Back to Payroll
        </button>
        <h1>Payroll Workflow - {month}/{year}</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Step Navigation */}
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

      {/* Step Content */}
      <div style={styles.content}>
        {activeStep === 'process' && (
          <div style={styles.stepContent}>
            <h2>Step 1: Process Payroll</h2>
            <p>Generate payroll calculations for all active employees for {month}/{year}.</p>
            
            {payrollData.length > 0 ? (
              <div style={styles.summary}>
                <h3>Payroll Summary</h3>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <span style={styles.cardLabel}>Total Employees</span>
                    <span style={styles.cardValue}>{payrollData.length}</span>
                  </div>
                  <div style={styles.summaryCard}>
                    <span style={styles.cardLabel}>Total Net Salary</span>
                    <span style={styles.cardValue}>
                      KES {payrollData.reduce((sum, r) => sum + (r.netSalary || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.summaryCard}>
                    <span style={styles.cardLabel}>Status</span>
                    <span style={styles.cardValue}>
                      {payrollData[0]?.status || 'Not Processed'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep('review')}
                  style={styles.nextButton}
                >
                  Continue to Review
                </button>
              </div>
            ) : (
              <div style={styles.processSection}>
                <div style={styles.processInfo}>
                  <h3>Ready to Process Payroll</h3>
                  <p>Click the button below to generate payroll calculations for all active employees.</p>
                  <ul style={styles.processSteps}>
                    <li>Calculate basic salary and allowances</li>
                    <li>Apply statutory deductions (PAYE, NHIF, NSSF)</li>
                    <li>Process individual deductions (loans, advances)</li>
                    <li>Generate net salary calculations</li>
                  </ul>
                </div>
                <button
                  onClick={processPayroll}
                  disabled={processing || !payrollSettings}
                  style={styles.processButton}
                >
                  {processing ? 'Processing...' : 'Process Payroll'}
                </button>
                {!payrollSettings && (
                  <p style={styles.warning}>
                    Please configure payroll settings before processing payroll.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeStep === 'review' && (
          <div style={styles.stepContent}>
            <h2>Step 2: Review & Approve Payroll</h2>
            <p>Review the processed payroll and approve for payment processing.</p>

            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by employee name, number, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <h3>Payroll Details</h3>
                <div style={styles.tableActions}>
                  <button
                    onClick={() => fetchPayrollData()}
                    style={styles.refreshButton}
                    title="Refresh payment method data"
                    disabled={loadingEmployees}
                  >
                    {loadingEmployees ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                  <button
                    onClick={() => setSelectedEmployees(payrollData.map(r => r._id))}
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
                </div>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Select</th>
                    <th style={styles.tableHeader}>Employee</th>
                    <th style={styles.tableHeader}>Net Salary</th>
                    <th style={styles.tableHeader}>Payment Method</th>
                    <th style={styles.tableHeader}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData
                    .filter(record => {
                      const searchLower = searchTerm.toLowerCase();
                      const employeeName = `${record.employeeId?.firstName} ${record.employeeId?.lastName}`.toLowerCase();
                      const employeeNumber = record.employeeId?.employeeNumber?.toLowerCase() || '';
                      return employeeName.includes(searchLower) || employeeNumber.includes(searchLower);
                    })
                    .map((record) => {
                      const paymentMethod = getPaymentMethod(record.employeeId);
                      
                      return (
                        <tr key={record._id} style={styles.tableRow}>
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
                              disabled={paymentMethod.type === 'none'}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            {record.employeeId?.firstName} {record.employeeId?.lastName}
                            <br />
                            <small style={styles.employeeNumber}>
                              {record.employeeId?.employeeNumber}
                            </small>
                          </td>
                          <td style={styles.tableCell}>
                            KES {record.netSalary?.toLocaleString()}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.paymentMethod}>
                              <span style={styles.methodLabel}>{paymentMethod.label}</span>
                              <span style={styles.methodDetails}>{paymentMethod.details}</span>
                              <span style={{
                                ...styles.methodStatus,
                                ...(paymentMethod.status === 'Active' && styles.statusActive),
                                ...(paymentMethod.status === 'Inactive' && styles.statusInactive),
                                ...(paymentMethod.status === 'Not Configured' && styles.statusNotConfigured)
                              }}>
                                {paymentMethod.status}
                              </span>
                            </div>
                          </td>
                          <td style={styles.tableCell}>
                            <span style={getStatusBadge(record.status)}>
                              {record.status?.toUpperCase() || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div style={styles.actions}>
              <div style={styles.actionInfo}>
                <p>Selected: {selectedEmployees.length} employees</p>
                <p>
                  Total Amount: KES {
                    payrollData
                      .filter(r => selectedEmployees.includes(r._id))
                      .reduce((sum, r) => sum + (r.netSalary || 0), 0)
                      .toLocaleString()
                  }
                </p>
              </div>
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
          <div style={styles.stepContent}>
            <h2>Step 3: Process Payments</h2>
            <p>Process payments to employee bank accounts and Staffpesa wallets.</p>

            <div style={styles.summary}>
              <h3>Payment Summary</h3>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>Approved Payments</span>
                  <span style={styles.cardValue}>
                    {payrollData.filter(r => r.status === 'approved').length}
                  </span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>Total Amount</span>
                  <span style={styles.cardValue}>
                    KES {payrollData.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.netSalary || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>Active Bank Accounts</span>
                  <span style={styles.cardValue}>
                    {paymentStats.activeBank}
                  </span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>Active Staffpesa Wallets</span>
                  <span style={styles.cardValue}>
                    {paymentStats.activeWallet}
                  </span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.cardLabel}>No Payment Method</span>
                  <span style={styles.cardValue}>
                    {paymentStats.none}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <h3>Payment Details</h3>
                <div style={styles.tableActions}>
                  <button
                    onClick={() => fetchPayrollData()}
                    style={styles.refreshButton}
                    title="Refresh payment method data"
                    disabled={loadingEmployees}
                  >
                    {loadingEmployees ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                  <button
                    onClick={() => setSelectedEmployees(payrollData.filter(r => r.status === 'approved').map(r => r._id))}
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
                </div>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Select</th>
                    <th style={styles.tableHeader}>Employee</th>
                    <th style={styles.tableHeader}>Net Salary</th>
                    <th style={styles.tableHeader}>Payment Method</th>
                    <th style={styles.tableHeader}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData
                    .filter(record => record.status === 'approved')
                    .map((record) => {
                      const paymentMethod = getPaymentMethod(record.employeeId);
                      const status = paymentStatus[record._id] || record.status;
                      
                      return (
                        <tr key={record._id} style={styles.tableRow}>
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
                              disabled={paymentMethod.type === 'none'}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            {record.employeeId?.firstName} {record.employeeId?.lastName}
                            <br />
                            <small style={styles.employeeNumber}>
                              {record.employeeId?.employeeNumber}
                            </small>
                          </td>
                          <td style={styles.tableCell}>
                            KES {record.netSalary?.toLocaleString()}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.paymentMethod}>
                              <span style={styles.methodLabel}>{paymentMethod.label}</span>
                              <span style={styles.methodDetails}>{paymentMethod.details}</span>
                              <span style={{
                                ...styles.methodStatus,
                                ...(paymentMethod.status === 'Active' && styles.statusActive),
                                ...(paymentMethod.status === 'Inactive' && styles.statusInactive),
                                ...(paymentMethod.status === 'Not Configured' && styles.statusNotConfigured)
                              }}>
                                {paymentMethod.status}
                              </span>
                            </div>
                          </td>
                          <td style={styles.tableCell}>
                            <span style={getStatusBadge(status)}>
                              {status?.toUpperCase() || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div style={styles.actions}>
              <div style={styles.actionInfo}>
                <p>Selected: {selectedEmployees.length} payments</p>
                <p>
                  Total Amount: KES {
                    payrollData
                      .filter(r => selectedEmployees.includes(r._id))
                      .reduce((sum, r) => sum + (r.netSalary || 0), 0)
                      .toLocaleString()
                  }
                </p>
              </div>
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
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', fontSize: '18px' },
  error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  success: { backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  steps: { display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  step: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f8f9fa', color: '#6c757d' },
  activeStep: { backgroundColor: '#007bff', color: 'white' },
  disabledStep: { backgroundColor: '#e9ecef', color: '#adb5bd', cursor: 'not-allowed' },
  stepNumber: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' },
  stepLabel: { fontSize: '14px', fontWeight: '500' },
  content: { backgroundColor: 'white', borderRadius: '6px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  stepContent: { display: 'flex', flexDirection: 'column', gap: '20px' },
  summary: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' },
  summaryCard: { backgroundColor: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' },
  cardLabel: { display: 'block', fontSize: '0.875rem', color: '#6c757d', marginBottom: '5px' },
  cardValue: { display: 'block', fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50' },
  processSection: { textAlign: 'center', padding: '40px' },
  processButton: { padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  nextButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  warning: { color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '10px' },
  searchContainer: { marginBottom: '15px' },
  searchInput: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '0.875rem' },
  tableContainer: { overflowX: 'auto' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  tableActions: { display: 'flex', gap: '10px' },
  selectAllButton: { padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  clearButton: { padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableRow: { borderBottom: '1px solid #dee2e6' },
  tableCell: { padding: '10px 8px', fontSize: '0.875rem' },
  employeeNumber: { color: '#6c757d', fontSize: '0.75rem' },
  paymentMethod: { display: 'flex', flexDirection: 'column', gap: '2px' },
  methodLabel: { fontWeight: '600', fontSize: '0.875rem' },
  methodDetails: { fontSize: '0.75rem', color: '#6c757d' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' },
  actionInfo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  approveButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  processInfo: { marginBottom: '20px', textAlign: 'center' },
  processSteps: { listStyle: 'disc', paddingLeft: '20px', textAlign: 'left', display: 'inline-block', margin: '10px 0' },
  methodStatus: { padding: '2px 4px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' },
  statusActive: { backgroundColor: '#28a745', color: '#fff' },
  statusInactive: { backgroundColor: '#dc3545', color: '#fff' },
  statusNotConfigured: { backgroundColor: '#ffc107', color: '#000' },
  refreshButton: { padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }
};

export default PayrollWorkflow; 