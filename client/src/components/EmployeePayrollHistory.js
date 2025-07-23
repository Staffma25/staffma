import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function EmployeePayrollHistory({ employeeId }) {
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [businessCurrency, setBusinessCurrency] = useState('KES');

  useEffect(() => {
    fetchPayrollHistory();
    fetchPayrollSettings();
    fetchBusinessCurrency();
  }, [employeeId]);

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

  const fetchPayrollSettings = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/settings`, {
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
      console.log('Fetched payroll settings:', data);
      setPayrollSettings(data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  const fetchEmployeePayrollHistory = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/employee/${employeeId}`, {
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
      console.log('Fetched payroll history:', data);
      setPayrollHistory(data);
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (month, year) => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/generate-pdf-payslip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          month,
          year
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payslip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${employeeId}-${month}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      setError(error.message || 'Failed to download payslip');
    }
  };

  const renderAllowances = (record) => {
    if (!record.allowances?.items || !payrollSettings?.taxRates?.allowances) return null;

    // Get enabled allowances from settings
    const enabledAllowances = payrollSettings.taxRates.allowances
      .filter(a => a.enabled)
      .map(a => a.name);

    // Filter allowances to only show enabled ones
    const filteredItems = record.allowances.items.filter(item => 
      enabledAllowances.some(a => a.toLowerCase() === item.name.toLowerCase())
    );

    if (filteredItems.length === 0) return null;

    return (
      <div style={styles.detailsContainer}>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Total:</span>
          <span style={styles.detailsValue}>
            {formatCurrency(record.allowances.total, businessCurrency)}
          </span>
        </div>
        {filteredItems.map((item, index) => (
          <div key={index} style={styles.detailsRow}>
            <span style={styles.detailsLabel}>{item.name}:</span>
            <span style={styles.detailsValue}>
              {formatCurrency(item.amount, businessCurrency)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderDeductions = (record) => {
    if (!record.deductions?.items) return null;

    // Separate standard deductions from individual custom deductions
    const standardDeductions = [];
    const individualDeductions = [];

    record.deductions.items.forEach(item => {
      // Check if this is an individual deduction (has type property)
      if (item.type) {
        individualDeductions.push(item);
      } else {
        standardDeductions.push(item);
      }
    });

    return (
      <div style={styles.detailsContainer}>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Total:</span>
          <span style={styles.detailsValue}>
            {formatCurrency(record.deductions.total, businessCurrency)}
          </span>
        </div>
        
        {/* Standard Deductions */}
        {standardDeductions.map((item, index) => (
          <div key={`standard-${index}`} style={styles.detailsRow}>
            <span style={styles.detailsLabel}>{item.name}:</span>
            <span style={styles.detailsValue}>
              {formatCurrency(item.amount, businessCurrency)}
            </span>
          </div>
        ))}
        
        {/* Individual Custom Deductions */}
        {individualDeductions.length > 0 && (
          <>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}><strong>Custom Deductions:</strong></span>
              <span style={styles.detailsValue}></span>
            </div>
            {individualDeductions.map((item, index) => (
              <div key={`individual-${index}`} style={styles.detailsRow}>
                <span style={styles.detailsLabel}>
                  {item.name} ({item.type?.replace('_', ' ').toUpperCase()}):
                </span>
                <span style={styles.detailsValue}>
                  {formatCurrency(item.amount, businessCurrency)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>Loading payroll history...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Payroll History
        {payrollHistory[0]?.employeeId?.employeeNumber && (
          <span style={styles.employeeNumber}>
            (Employee ID: {payrollHistory[0].employeeId.employeeNumber})
          </span>
        )}
      </h3>
      
      {payrollHistory.length === 0 ? (
        <p style={styles.noData}>No payroll history available</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Period</th>
                <th style={styles.tableHeader}>Basic Salary</th>
                <th style={styles.tableHeader}>Allowances</th>
                <th style={styles.tableHeader}>Gross Salary</th>
                <th style={styles.tableHeader}>Deductions</th>
                <th style={styles.tableHeader}>Net Salary</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((record) => (
                <tr key={record._id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    {`${new Date(2000, record.month - 1).toLocaleString('default', { month: 'long' })} ${record.year}`}
                  </td>
                  <td style={styles.tableCell}>
                    {formatCurrency(record.basicSalary, businessCurrency)}
                  </td>
                  <td style={styles.tableCell}>
                    {renderAllowances(record)}
                  </td>
                  <td style={styles.tableCell}>
                    {formatCurrency(record.grossSalary, businessCurrency)}
                  </td>
                  <td style={styles.tableCell}>
                    {renderDeductions(record)}
                  </td>
                  <td style={styles.tableCell}>
                    {formatCurrency(record.netSalary, businessCurrency)}
                  </td>
                  <td style={styles.tableCell}>
                    <button 
                      onClick={() => downloadPayslip(record.month, record.year)}
                      style={styles.downloadButton}
                    >
                      Download Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px',
  },
  title: {
    marginBottom: '20px',
    color: '#2c3e50',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    padding: '12px',
    textAlign: 'left',
    fontSize: '0.9rem',
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
    padding: '12px',
    color: '#2c3e50',
    fontSize: '0.9rem',
    verticalAlign: 'top',
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
  },
  detailsLabel: {
    color: '#666',
    fontWeight: '500',
  },
  detailsValue: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  error: {
    color: '#e74c3c',
    padding: '10px',
    backgroundColor: '#fde8e8',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  noData: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  downloadButton: {
    padding: '8px 16px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#27ae60',
    },
  },
  employeeNumber: {
    fontSize: '1rem',
    color: '#666',
    marginLeft: '10px',
    fontWeight: 'normal',
  },
};

export default EmployeePayrollHistory; 