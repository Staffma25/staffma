import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PayrollWorkflowSelector() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleStartWorkflow = () => {
    navigate(`/payroll/workflow/${selectedMonth}/${selectedYear}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1>Payroll Workflow</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2>Select Payroll Period</h2>
          <p>Choose the month and year for payroll processing:</p>
          
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Month:</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={styles.select}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={styles.select}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              onClick={handleStartWorkflow}
              style={styles.startButton}
            >
              Start Payroll Workflow for {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
            </button>
          </div>
        </div>

        <div style={styles.info}>
          <h3>Payroll Workflow Steps:</h3>
          <ol style={styles.stepsList}>
            <li><strong>Process Payroll:</strong> Generate payroll calculations for all active employees</li>
            <li><strong>Review & Approve:</strong> Review the processed payroll and approve for payment</li>
            <li><strong>Process Payments:</strong> Send payments to employee bank accounts and Staffpesa wallets</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '6px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  form: { display: 'flex', gap: '20px', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#2c3e50' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '14px' },
  actions: { textAlign: 'center' },
  startButton: { padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  info: { backgroundColor: '#f8f9fa', borderRadius: '6px', padding: '20px' },
  stepsList: { margin: '10px 0', paddingLeft: '20px' },
};

export default PayrollWorkflowSelector; 