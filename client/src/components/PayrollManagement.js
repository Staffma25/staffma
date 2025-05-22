import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PayrollManagement() {
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationDate, setRegistrationDate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchBusinessDetails();
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      setError('Failed to fetch employees');
      console.error(error);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Fetching payroll history with params:', {
        month: selectedMonth,
        year: selectedYear
      });

      const response = await fetch(
        `http://localhost:5001/api/payroll/history?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      console.log('Payroll history response:', {
        ok: response.ok,
        status: response.status,
        data
      });

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch payroll history');
      }

      setPayrollHistory(data);
      await fetchPayrollSummary();
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      setError('Failed to fetch payroll history: ' + error.message);
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5001/api/payroll/summary?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch payroll summary');
      const data = await response.json();
      setPayrollSummary(data);
    } catch (error) {
      setError('Failed to fetch payroll summary');
      console.error(error);
    }
  };

  const processPayroll = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/payroll/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to process payroll');
      }

      alert(data.message);
      await fetchPayrollHistory();
      await fetchPayrollSummary();
    } catch (error) {
      console.error('Payroll processing error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (payrollId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/payroll/download/${payrollId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Payslip download error:', error);
      alert('Failed to download payslip: ' + error.message);
    }
  };

  const fetchBusinessDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/business', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch business details');
      
      const data = await response.json();
      setRegistrationDate(new Date(data.createdAt));
    } catch (error) {
      console.error('Error fetching business details:', error);
    }
  };

  const isValidPayrollPeriod = (month, year) => {
    if (!registrationDate) return true; // Allow if registration date not loaded yet
    
    const periodDate = new Date(year, month - 1);
    const currentDate = new Date();
    
    // Cannot process future months
    if (periodDate > currentDate) return false;
    
    // Cannot process months before registration
    if (periodDate < registrationDate) return false;
    
    return true;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Payroll Management</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.controls}>
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
          onClick={processPayroll} 
          disabled={loading || !isValidPayrollPeriod(selectedMonth, selectedYear)}
          style={{
            ...styles.button,
            ...((!isValidPayrollPeriod(selectedMonth, selectedYear)) && styles.disabledButton)
          }}
        >
          {loading ? 'Processing...' : 'Process Payroll'}
        </button>
      </div>

      {payrollSummary && (
        <div style={styles.summaryContainer}>
          <h3 style={styles.summaryTitle}>Payroll Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>👥</div>
              <span style={styles.cardLabel}>Total Employees</span>
              <span style={styles.cardValue}>{payrollSummary.totalEmployees}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>💰</div>
              <span style={styles.cardLabel}>Total Gross Salary</span>
              <span style={styles.cardValue}>KES {payrollSummary.totalGrossSalary?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>💵</div>
              <span style={styles.cardLabel}>Total Net Salary</span>
              <span style={styles.cardValue}>KES {payrollSummary.totalNetSalary?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>📊</div>
              <span style={styles.cardLabel}>Total PAYE</span>
              <span style={styles.cardValue}>KES {payrollSummary.totalPAYE?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>🏥</div>
              <span style={styles.cardLabel}>Total NHIF</span>
              <span style={styles.cardValue}>KES {payrollSummary.totalNHIF?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>🏦</div>
              <span style={styles.cardLabel}>Total NSSF</span>
              <span style={styles.cardValue}>KES {payrollSummary.totalNSSF?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableContainer}>
        {payrollHistory.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Employee</th>
                <th style={styles.tableHeader}>Position</th>
                <th style={styles.tableHeader}>Department</th>
                <th style={styles.tableHeader}>Basic Salary</th>
                <th style={styles.tableHeader}>Gross Salary</th>
                <th style={styles.tableHeader}>PAYE</th>
                <th style={styles.tableHeader}>NHIF</th>
                <th style={styles.tableHeader}>NSSF</th>
                <th style={styles.tableHeader}>Net Salary</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((record) => (
                <tr key={record._id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    {record.employeeId?.firstName} {record.employeeId?.lastName}
                  </td>
                  <td style={styles.tableCell}>{record.employeeId?.position}</td>
                  <td style={styles.tableCell}>{record.employeeId?.department}</td>
                  <td style={styles.tableCell}>KES {record.basicSalary?.toLocaleString()}</td>
                  <td style={styles.tableCell}>KES {record.grossSalary?.toLocaleString()}</td>
                  <td style={styles.tableCell}>KES {record.deductions?.paye?.toLocaleString()}</td>
                  <td style={styles.tableCell}>KES {record.deductions?.nhif?.toLocaleString()}</td>
                  <td style={styles.tableCell}>KES {record.deductions?.nssf?.toLocaleString()}</td>
                  <td style={styles.tableCell}>KES {record.netSalary?.toLocaleString()}</td>
                  <td style={styles.tableCell}>
                    <button 
                      onClick={() => downloadPayslip(record._id)}
                      style={styles.downloadButton}
                    >
                      Download Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.noData}>
            No payroll records found for {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    marginBottom: '20px',
    color: '#2c3e50',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  summaryTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    padding: '10px',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-5px)',
    },
  },
  cardIcon: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  cardLabel: {
    color: '#6c757d',
    fontSize: '0.9rem',
    marginBottom: '5px',
    textAlign: 'center',
  },
  cardValue: {
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    padding: '15px',
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
    padding: '15px',
    color: '#2c3e50',
    fontSize: '0.9rem',
  },
  error: {
    color: 'red',
    marginBottom: '10px',
  },
  downloadButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6c757d',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  }
};

export default PayrollManagement; 