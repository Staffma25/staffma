import React from 'react';
import { useNavigate } from 'react-router-dom';

function PayrollCard({ payrollSummary }) {
  const navigate = useNavigate();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Payroll Overview</h3>
      <div style={styles.content}>
        <div style={styles.stat}>
          <span>Total Employees</span>
          <h4>{payrollSummary?.totalEmployees || 0}</h4>
        </div>
        <div style={styles.stat}>
          <span>Total Gross Salary</span>
          <h4>KES {payrollSummary?.totalGrossSalary?.toLocaleString() || 0}</h4>
        </div>
        <div style={styles.stat}>
          <span>Total Net Salary</span>
          <h4>KES {payrollSummary?.totalNetSalary?.toLocaleString() || 0}</h4>
        </div>
      </div>
      <button 
        style={styles.button}
        onClick={() => navigate('/payroll')}
      >
        Process Payroll
      </button>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  stat: {
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

export default PayrollCard; 