import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PayrollManagement() {
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationDate, setRegistrationDate] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollSettings, setPayrollSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
    fetchBusinessDetails();
    fetchPayrollSettings();
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
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/payroll/history?month=${selectedMonth}&year=${selectedYear}`, {
          headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll history');
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

      setPayrollHistory(data);
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

  const fetchPayrollSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/payroll/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll settings');
      }

      const data = await response.json();
      console.log('Payroll settings:', data);
      setPayrollSettings(data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      setError('Failed to fetch payroll settings');
    }
  };

  const processPayroll = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!payrollSettings) {
        throw new Error('Please configure your payroll settings before processing payroll');
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/payroll/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

      setSuccess(data.message);
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
      const response = await axios.get(`http://localhost:5001/api/payroll/download/${payrollId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError(error.message || 'Failed to download payslip. Please try again.');
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

  // Calculate summary from filtered payroll history
  const calculateSummary = (records) => {
    return {
      totalEmployees: records.length,
      totalGrossSalary: records.reduce((sum, record) => sum + (record.grossSalary || 0), 0),
      totalNetSalary: records.reduce((sum, record) => sum + (record.netSalary || 0), 0),
      totalAllowances: records.reduce((sum, record) => sum + (record.allowances?.total || 0), 0),
      totalDeductions: records.reduce((sum, record) => sum + (record.deductions?.total || 0), 0),
      totalIndividualDeductions: records.reduce((sum, record) => {
        const individualDeductions = record.deductions?.items?.filter(item => item.type) || [];
        return sum + individualDeductions.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
      }, 0),
      // Calculate individual deduction totals based on configured deductions
      deductionTotals: records.reduce((totals, record) => {
        if (record.deductions?.items) {
          record.deductions.items.forEach(item => {
            totals[item.name] = (totals[item.name] || 0) + (item.amount || 0);
          });
        }
        return totals;
      }, {})
    };
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

  // Calculate current summary based on filtered data
  const currentSummary = calculateSummary(filteredPayrollHistory);

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
          <button
            style={styles.processButton}
            onClick={processPayroll}
            disabled={loading || !isValidPayrollPeriod(selectedMonth, selectedYear)}
          >
            {loading ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
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
        </div>
      </div>

      {/* Updated Payroll Summary */}
        <div style={styles.summaryContainer}>
        <h3 style={styles.summaryTitle}>
          Payroll Summary
          {searchTerm && <span style={styles.filteredLabel}> (Filtered Results)</span>}
        </h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>👥</div>
              <span style={styles.cardLabel}>Total Employees</span>
            <span style={styles.cardValue}>{currentSummary.totalEmployees}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>💰</div>
              <span style={styles.cardLabel}>Total Gross Salary</span>
            <span style={styles.cardValue}>KES {currentSummary.totalGrossSalary?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.cardIcon}>💵</div>
              <span style={styles.cardLabel}>Total Net Salary</span>
            <span style={styles.cardValue}>KES {currentSummary.totalNetSalary?.toLocaleString()}</span>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.cardIcon}>➕</div>
            <span style={styles.cardLabel}>Total Allowances</span>
            <span style={styles.cardValue}>KES {currentSummary.totalAllowances?.toLocaleString()}</span>
            </div>
            <div style={styles.summaryCard}>
            <div style={styles.cardIcon}>➖</div>
            <span style={styles.cardLabel}>Total Deductions</span>
            <span style={styles.cardValue}>KES {currentSummary.totalDeductions?.toLocaleString()}</span>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.cardIcon}>💳</div>
            <span style={styles.cardLabel}>Individual Deductions</span>
            <span style={styles.cardValue}>KES {currentSummary.totalIndividualDeductions?.toLocaleString()}</span>
          </div>
          {/* Dynamically render configured deductions */}
          {configuredDeductions.map(deduction => (
            <div key={deduction} style={styles.summaryCard}>
              <div style={styles.cardIcon}>📊</div>
              <span style={styles.cardLabel}>Total {deduction}</span>
              <span style={styles.cardValue}>
                KES {currentSummary.deductionTotals[deduction]?.toLocaleString() || '0'}
              </span>
            </div>
          ))}
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
        {filteredPayrollHistory.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Employee ID</th>
                <th style={styles.tableHeader}>Employee</th>
                <th style={styles.tableHeader}>Position</th>
                <th style={styles.tableHeader}>Department</th>
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
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrollHistory.map((record) => (
                <tr key={record._id}>
                  <td style={styles.tableCell}>
                    {record.employeeId?.employeeNumber || 'N/A'}
                  </td>
                  <td style={styles.tableCell}>
                    {`${record.employeeId?.firstName} ${record.employeeId?.lastName}`}
                  </td>
                  <td style={styles.tableCell}>
                    {record.employeeId?.position || 'N/A'}
                  </td>
                  <td style={styles.tableCell}>
                    {record.employeeId?.department || 'N/A'}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.basicSalary?.toLocaleString()}
                  </td>
                  {configuredAllowances.map(allowance => {
                    const allowanceItem = record.allowances?.items?.find(item => 
                      item.name.toLowerCase() === allowance.toLowerCase()
                    );
                    return (
                      <td key={allowance} style={styles.tableCell}>
                        KES {allowanceItem?.amount?.toLocaleString() || '0'}
                      </td>
                    );
                  })}
                  <td style={styles.tableCell}>
                    KES {record.allowances?.total?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.grossSalary?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.deductions?.items?.find(item => item.name === 'SHIF')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.deductions?.items?.find(item => item.name === 'NSSF')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.deductions?.items?.find(item => item.name === 'Housing Levy')?.amount?.toLocaleString() || '0'}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.taxableIncome?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.deductions?.items?.find(item => item.name === 'PAYE')?.amount?.toLocaleString() || '0'}
                  </td>
                  {configuredDeductions.map(deduction => {
                    const deductionItem = record.deductions?.items?.find(item => 
                      item.name.toLowerCase() === deduction.toLowerCase()
                    );
                    return (
                      <td key={deduction} style={styles.tableCell}>
                        KES {deductionItem?.amount?.toLocaleString() || '0'}
                      </td>
                    );
                  })}
                  <td style={styles.tableCell}>
                    KES {(() => {
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
                    KES {record.deductions?.total?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    KES {record.netSalary?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button 
                        onClick={() => downloadPayslip(record._id)}
                        style={styles.downloadButton}
                      >
                        Download Payslip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.noData}>
            {searchTerm 
              ? 'No payroll records found matching your search criteria.'
              : `No payroll records found for ${new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`
            }
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
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#5a6268',
    },
  },
  title: {
    marginBottom: '20px',
    color: '#2c3e50',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  dateControls: {
    display: 'flex',
    gap: '10px',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  settingsButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  processButton: {
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  filteredLabel: {
    fontSize: '1rem',
    color: '#666',
    fontWeight: 'normal',
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
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
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
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    backgroundColor: '#ffffff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    marginTop: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
    },
  },
  clearSearchButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
};

export default PayrollManagement; 