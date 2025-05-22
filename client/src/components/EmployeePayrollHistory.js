import React, { useState, useEffect } from 'react';

function EmployeePayrollHistory({ employeeId }) {
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployeePayrollHistory();
  }, [employeeId]);

  const fetchEmployeePayrollHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/payroll/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payroll history');
      
      const data = await response.json();
      setPayrollHistory(data);
    } catch (error) {
      setError('Failed to fetch payroll history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (month, year) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/payroll/generate-pdf-payslip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          month,
          year
        })
      });

      if (!response.ok) throw new Error('Failed to generate payslip');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${employeeId}-${month}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download payslip');
      console.error(error);
    }
  };

  if (loading) return <div>Loading payroll history...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Payroll History</h3>
      
      {payrollHistory.length === 0 ? (
        <p>No payroll history available</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Gross Salary</th>
                <th>PAYE</th>
                <th>NHIF</th>
                <th>NSSF</th>
                <th>Net Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((record) => (
                <tr key={record._id}>
                  <td>{`${new Date(2000, record.month - 1).toLocaleString('default', { month: 'long' })} ${record.year}`}</td>
                  <td>KES {record.basicSalary.toLocaleString()}</td>
                  <td>KES {record.allowances.toLocaleString()}</td>
                  <td>KES {record.grossSalary.toLocaleString()}</td>
                  <td>KES {record.deductions.paye.toLocaleString()}</td>
                  <td>KES {record.deductions.nhif.toLocaleString()}</td>
                  <td>KES {record.deductions.nssf.toLocaleString()}</td>
                  <td>KES {record.netSalary.toLocaleString()}</td>
                  <td>
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
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  error: {
    color: 'red',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  downloadButton: {
    padding: '6px 12px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default EmployeePayrollHistory; 