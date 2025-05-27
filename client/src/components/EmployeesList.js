import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    salary: '',
    joiningDate: '',
    startDate: '',
    offerLetter: null
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching employees with token:', token);
      
      const response = await fetch('http://localhost:5001/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }

      const data = await response.json();
      console.log('Received employees data:', data.map(emp => ({
        id: emp._id,
        employeeNumber: emp.employeeNumber,
        name: `${emp.firstName} ${emp.lastName}`
      })));

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
  }, [showAddForm]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const salary = Number(newEmployee.salary);
      if (isNaN(salary) || salary <= 0) {
        alert('Please enter a valid salary amount');
        return;
      }

      const employeeData = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        department: newEmployee.department,
        position: newEmployee.position,
        salary: salary,
        startDate: newEmployee.startDate,
        joiningDate: newEmployee.joiningDate
      };

      console.log('Sending employee data:', employeeData);

      const response = await fetch('http://localhost:5001/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to add employee');
      }

      console.log('Employee created successfully:', data);

      setShowAddForm(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        position: '',
        salary: '',
        joiningDate: '',
        startDate: '',
        offerLetter: null
      });

      alert('Employee added successfully!');
      await fetchEmployees();

    } catch (error) {
      console.error('Error adding employee:', error);
      alert(error.message);
    }
  };

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

  if (!employees || employees.length === 0) {
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
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            style={styles.addButton}
          >
            {showAddForm ? 'Cancel' : 'Add New Employee'}
          </button>
        </div>
        <div style={styles.emptyState}>
          <p>No employees found. Add your first employee to get started!</p>
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)} 
              style={styles.addButton}
            >
              Add New Employee
            </button>
          )}
        </div>
        {showAddForm && (
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
                    min="1"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee, 
                      salary: e.target.value
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
        )}
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
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          style={styles.addButton}
        >
          {showAddForm ? 'Cancel' : 'Add New Employee'}
        </button>
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

      {/* Add Employee Form */}
      {showAddForm && (
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
                  min="1"
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({
                    ...newEmployee, 
                    salary: e.target.value
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
      )}
      
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
  title: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: '600',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#219a52',
    },
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
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  tableCell: {
    padding: '15px',
    color: '#2c3e50',
    fontSize: '0.9rem',
  },
  viewButton: {
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
  error: {
    color: 'red',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
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
  retryButton: {
    padding: '8px 16px',
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
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
  noResults: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginTop: '10px',
  },
};

export default EmployeesList; 