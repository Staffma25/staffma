import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';

function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('Fetching employees...');
      
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const viewEmployeeDetails = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const employeeNumber = employee.employeeNumber?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || 
           employeeNumber.includes(searchLower) ||
           employee.email.toLowerCase().includes(searchLower) ||
           employee.department.toLowerCase().includes(searchLower) ||
           employee.position.toLowerCase().includes(searchLower);
  });

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={styles.backButton}
            >
              ← Back to Dashboard
            </button>
            <h2 style={styles.title}>Employees Management</h2>
          </div>
        </div>
        <div style={styles.error}>
          <p>Error: {error}</p>
          <button 
            onClick={fetchEmployees} 
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={styles.backButton}
            >
              ← Back to Dashboard
            </button>
            <h2 style={styles.title}>Employees Management</h2>
          </div>
        </div>
        <div style={styles.loading}>
          Loading employees...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>
          <h2 style={styles.title}>Employees Management</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name, employee number, email, department, or position..."
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
      
      {/* Employees Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Employee ID</th>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Position</th>
              <th style={styles.tableHeader}>Department</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee._id} style={styles.tableRow}>
                <td style={styles.tableCell}>{employee.employeeNumber}</td>
                <td style={styles.tableCell}>{`${employee.firstName} ${employee.lastName}`}</td>
                <td style={styles.tableCell}>{employee.position}</td>
                <td style={styles.tableCell}>{employee.department}</td>
                <td style={styles.tableCell}>{employee.email}</td>
                <td style={styles.tableCell}>
                  <button 
                    onClick={() => viewEmployeeDetails(employee._id)}
                    style={styles.viewButton}
                  >
                    👤 View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && (
          <div style={styles.noResults}>
            {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#219a52',
    },
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  form: {
    width: '100%',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.75rem',
    color: '#2c3e50',
    fontWeight: '500',
    marginBottom: '3px',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
    fontSize: '0.875rem',
    width: '100%',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
    },
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  tableCell: {
    padding: '10px 12px',
    color: '#2c3e50',
    fontSize: '0.75rem',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  error: {
    color: 'red',
    padding: '8px',
    backgroundColor: '#fee',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '0.875rem',
  },
  loading: {
    textAlign: 'center',
    padding: '15px',
    color: '#666',
    fontSize: '0.875rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#f1f1f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: '15px',
    color: '#666',
    fontSize: '0.875rem',
  },
  searchContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  searchInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
    },
  },
  clearSearchButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  noResults: {
    textAlign: 'center',
    padding: '15px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginTop: '8px',
    fontSize: '0.875rem',
  },
};

export default EmployeesList; 