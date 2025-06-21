import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';

function AddEmployee() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    salary: {
      basic: '',
      allowances: {
        housing: 0,
        transport: 0,
        medical: 0,
        other: 0
      },
      deductions: {
        loans: 0,
        other: 0
      }
    },
    joiningDate: '',
    startDate: '',
    offerLetter: null
  });

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      // Validate salary
      const salaryValue = parseFloat(newEmployee.salary.basic);
      if (isNaN(salaryValue) || salaryValue <= 0) {
        setError('Please enter a valid salary amount (must be greater than 0)');
        return;
      }

      const employeeData = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        department: newEmployee.department,
        position: newEmployee.position,
        salary: {
          basic: salaryValue,
          allowances: {
            housing: 0,
            transport: 0,
            medical: 0,
            other: 0
          },
          deductions: {
            loans: 0,
            other: 0
          }
        },
        startDate: newEmployee.startDate,
        joiningDate: newEmployee.joiningDate
      };

      const response = await fetchWithAuth('http://localhost:5001/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'Duplicate entry') {
          throw new Error(data.details || 'An employee with this email already exists');
        } else if (data.error === 'System error') {
          throw new Error(data.details || 'Failed to generate employee number. Please try again.');
        } else {
          throw new Error(data.error || data.details || 'Failed to add employee');
        }
      }

      alert('Employee added successfully!');
      navigate('/employees');

    } catch (error) {
      console.error('Error adding employee:', error);
      setError(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            ← Back to Employees List
          </button>
          <h2 style={styles.title}>Add New Employee</h2>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.formContainer}>
        <form onSubmit={handleAddEmployee} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Position</label>
              <input
                style={styles.input}
                type="text"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Basic Salary</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={newEmployee.salary.basic}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  salary: {
                    ...newEmployee.salary,
                    basic: e.target.value
                  }
                })}
                required
                placeholder="Enter basic salary amount"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                style={styles.input}
                type="date"
                value={newEmployee.startDate}
                onChange={(e) => setNewEmployee({...newEmployee, startDate: e.target.value})}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Joining Date</label>
              <input
                style={styles.input}
                type="date"
                value={newEmployee.joiningDate}
                onChange={(e) => setNewEmployee({...newEmployee, joiningDate: e.target.value})}
                required
              />
            </div>
          </div>
          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitButton}>
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  title: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: '600',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f1f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  form: {
    width: '100%',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '25px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    color: '#2c3e50',
    fontWeight: '500',
    marginBottom: '5px',
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    fontSize: '0.9rem',
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
    gap: '10px',
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  error: {
    color: 'red',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
    marginBottom: '10px',
  },
};

export default AddEmployee; 