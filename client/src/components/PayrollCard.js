import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

function PayrollCard({ payrollSummary }) {
  const navigate = useNavigate();
  const [businessCurrency, setBusinessCurrency] = useState('KES');

  useEffect(() => {
    fetchBusinessCurrency();
  }, []);

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
          <h4>{formatCurrency(payrollSummary?.totalGrossSalary || 0, businessCurrency)}</h4>
        </div>
        <div style={styles.stat}>
          <span>Total Net Salary</span>
          <h4>{formatCurrency(payrollSummary?.totalNetSalary || 0, businessCurrency)}</h4>
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
    borderRadius: '6px',
    padding: '15px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '15px',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1rem',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  stat: {
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }
};

export default PayrollCard; 