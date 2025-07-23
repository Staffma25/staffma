import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function PaymentProcessing() {
  const { month, year } = useParams();
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [businessCurrency, setBusinessCurrency] = useState('KES');

  useEffect(() => {
    fetchApprovedPayroll();
    fetchBusinessCurrency();
  }, [month, year]);

  const fetchApprovedPayroll = async () => {
    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/approved?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch approved payroll');
      }

      const data = await response.json();
      setPayrollData(data);
    } catch (error) {
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

  const handleProcessPayments = async () => {
    if (selectedPayments.length === 0) {
      setError('Please select payments to process');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/process-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(month),
          year: parseInt(year),
          paymentIds: selectedPayments
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payments');
      }

      setSuccess(`Successfully processed ${data.processedCount} payments`);
      setPaymentStatus(data.paymentStatus || {});
      
      // Refresh data
      await fetchApprovedPayroll();
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethod = (employee) => {
    if (employee.staffpesaWallet?.walletId) {
      return {
        type: 'wallet',
        label: 'Staffpesa Wallet',
        details: `${employee.staffpesaWallet.walletId} (${employee.staffpesaWallet.phoneNumber})`
      };
    } else if (employee.bankAccounts?.length > 0) {
      const primaryAccount = employee.bankAccounts.find(acc => acc.isPrimary) || employee.bankAccounts[0];
      return {
        type: 'bank',
        label: 'Bank Account',
        details: `${primaryAccount.bankName} - ${primaryAccount.accountNumber}`
      };
    }
    return { type: 'none', label: 'No Method', details: 'Employee needs payment setup' };
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { backgroundColor: '#ffc107', color: '#000' },
      processing: { backgroundColor: '#17a2b8', color: '#fff' },
      completed: { backgroundColor: '#28a745', color: '#fff' },
      failed: { backgroundColor: '#dc3545', color: '#fff' }
    };
    
    return {
      ...statusStyles[status] || statusStyles.pending,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600'
    };
  };

  if (loading) return <div style={styles.loading}>Loading payment data...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/payroll')} style={styles.backButton}>
          ← Back to Payroll
        </button>
        <h1>Payment Processing - {month}/{year}</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.summary}>
        <h3>Payment Summary</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.cardLabel}>Total Payments</span>
            <span style={styles.cardValue}>{payrollData.length}</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.cardLabel}>Total Amount</span>
            <span style={styles.cardValue}>
              {formatCurrency(payrollData.reduce((sum, r) => sum + (r.netSalary || 0), 0), businessCurrency)}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.cardLabel}>Bank Transfers</span>
            <span style={styles.cardValue}>
              {payrollData.filter(r => r.employeeId?.bankAccounts?.length > 0).length}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.cardLabel}>Wallet Transfers</span>
            <span style={styles.cardValue}>
              {payrollData.filter(r => r.employeeId?.staffpesaWallet?.walletId).length}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>Payment Details</h3>
          <div style={styles.tableActions}>
            <button
              onClick={() => setSelectedPayments(payrollData.map(r => r._id))}
              style={styles.selectAllButton}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedPayments([])}
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
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((record) => {
              const paymentMethod = getPaymentMethod(record.employeeId);
              const status = paymentStatus[record._id] || 'pending';
              
              return (
                <tr key={record._id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(record._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayments([...selectedPayments, record._id]);
                        } else {
                          setSelectedPayments(selectedPayments.filter(id => id !== record._id));
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
                    {formatCurrency(record.netSalary, businessCurrency)}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.paymentMethod}>
                      <span style={styles.methodLabel}>{paymentMethod.label}</span>
                      <span style={styles.methodDetails}>{paymentMethod.details}</span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={getStatusBadge(status)}>
                      {status.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    {paymentMethod.type === 'none' && (
                      <button
                        onClick={() => navigate(`/employees/${record.employeeId._id}`)}
                        style={styles.setupButton}
                      >
                        Setup Payment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.actions}>
        <div style={styles.actionInfo}>
          <p>Selected: {selectedPayments.length} payments</p>
          <p>
            Total Amount: {formatCurrency(
              payrollData
                .filter(r => selectedPayments.includes(r._id))
                .reduce((sum, r) => sum + (r.netSalary || 0), 0),
              businessCurrency
            )}
          </p>
        </div>
        <button
          onClick={handleProcessPayments}
          disabled={processing || selectedPayments.length === 0}
          style={styles.processButton}
        >
          {processing ? 'Processing Payments...' : 'Process Selected Payments'}
        </button>
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
  summary: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' },
  summaryCard: { backgroundColor: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' },
  cardLabel: { display: 'block', fontSize: '0.875rem', color: '#6c757d', marginBottom: '5px' },
  cardValue: { display: 'block', fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50' },
  tableContainer: { backgroundColor: 'white', borderRadius: '6px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
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
  setupButton: { padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  actionInfo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  processButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }
};

export default PaymentProcessing;
