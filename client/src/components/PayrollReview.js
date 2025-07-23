import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function PayrollReview() {
  const { month, year } = useParams();
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [businessCurrency, setBusinessCurrency] = useState('KES');

  useEffect(() => {
    fetchPayrollData();
    fetchBusinessCurrency();
  }, [month, year]);

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

  const fetchPayrollData = async () => {
    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/history?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payroll data');
      }

      const data = await response.json();
      setPayrollData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payroll/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(month),
          year: parseInt(year),
          employeeIds: selectedEmployees
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve payroll');
      }

      navigate(`/payroll/payments/${month}/${year}`);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/payroll')} style={styles.backButton}>
          ← Back to Payroll
        </button>
        <h1>Payroll Review - {month}/{year}</h1>
      </div>

      <div style={styles.summary}>
        <h3>Summary</h3>
        <p>Total Employees: {payrollData.length}</p>
        <p>Total Net Salary: {formatCurrency(payrollData.reduce((sum, r) => sum + (r.netSalary || 0), 0), businessCurrency)}</p>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Select</th>
              <th>Employee</th>
              <th>Net Salary</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((record) => (
              <tr key={record._id}>
                <td>
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
                <td>{record.employeeId?.firstName} {record.employeeId?.lastName}</td>
                <td>{formatCurrency(record.netSalary, businessCurrency)}</td>
                <td>
                  {record.employeeId?.staffpesaWallet?.walletId ? 'Staffpesa Wallet' :
                   record.employeeId?.bankAccounts?.length > 0 ? 'Bank Account' : 'No Method'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleApprovePayroll}
          disabled={selectedEmployees.length === 0}
          style={styles.approveButton}
        >
          Approve & Proceed to Payments ({selectedEmployees.length} selected)
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  summary: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' },
  tableContainer: { backgroundColor: 'white', borderRadius: '6px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  actions: { marginTop: '20px', textAlign: 'center' },
  approveButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }
};

export default PayrollReview; 