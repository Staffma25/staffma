import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDetails from './EmployeeDetails';
import PayrollCard from './PayrollCard';

function Dashboard() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeCount, setEmployeeCount] = useState({ total: 0, remaining: 100 });

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

  const [isEditing, setIsEditing] = useState(false);
  const [editedBusiness, setEditedBusiness] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [reviewStats, setReviewStats] = useState({ pendingReviews: 0, completedReviews: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch business details from the server instead of localStorage
        const businessResponse = await fetch('http://localhost:5001/api/business', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!businessResponse.ok) {
          throw new Error('Failed to fetch business data');
        }
        
        const businessData = await businessResponse.json();
        setBusiness(businessData);
        setEditedBusiness(businessData);

        // Fetch employees
        const response = await fetch('http://localhost:5001/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setEmployees(data);

        // Fetch employee count
        const countResponse = await fetch('http://localhost:5001/api/employees/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const countData = await countResponse.json();
        setEmployeeCount(countData);

        fetchPayrollSummary();

        const reviewStatsResponse = await fetch('http://localhost:5001/api/performance-reviews/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const reviewStatsData = await reviewStatsResponse.json();
        setReviewStats(reviewStatsData);

      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchPayrollSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5001/api/payroll/summary?month=${currentMonth}&year=${currentYear}`,
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
      console.error('Error fetching payroll summary:', error);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const employeeData = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        department: newEmployee.department,
        position: newEmployee.position,
        salary: {
          basic: Number(newEmployee.salary),
          allowances: 0,
          deductions: 0
        },
        joiningDate: newEmployee.joiningDate,
        startDate: newEmployee.startDate
      };

      const response = await fetch('http://localhost:5001/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add employee');
      }

      const addedEmployee = await response.json();
      setEmployees(prevEmployees => [...prevEmployees, addedEmployee]);
      
      // Reset form
      setShowAddEmployee(false);
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

    } catch (error) {
      console.error('Error adding employee:', error);
      alert(error.message || 'Failed to add employee. Please try again.');
    }
  };

  const handleEditBusiness = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/business/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedBusiness)
      });

      if (!response.ok) {
        throw new Error('Failed to update business information');
      }

      const updatedBusiness = await response.json();
      setBusiness(updatedBusiness);
      setIsEditing(false);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedBusiness));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{business?.businessName} Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {business?.applicantName}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* Business Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Business Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
              Edit Info
            </button>
          ) : (
            <div style={styles.editButtons}>
              <button onClick={handleEditBusiness} style={styles.saveBtn}>
                Save
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedBusiness(business);
                }} 
                style={styles.cancelEditBtn}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.label}>Business Type:</span>
            {isEditing ? (
              <select
                style={styles.input}
                value={editedBusiness?.businessType}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  businessType: e.target.value
                })}
              >
                <option value="limited">Limited Company</option>
                <option value="sole">Sole Proprietorship</option>
              </select>
            ) : (
              <span>{business?.businessType === 'limited' ? 'Limited Company' : 'Sole Proprietorship'}</span>
            )}
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Contact Email:</span>
            <span>{business?.email}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Contact Number:</span>
            {isEditing ? (
              <input
                style={styles.input}
                type="tel"
                value={editedBusiness?.contactNumber}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  contactNumber: e.target.value
                })}
              />
            ) : (
              <span>{business?.contactNumber}</span>
            )}
          </div>
          <div style={styles.infoItem}>
            <span style={styles.label}>Address:</span>
            {isEditing ? (
              <input
                style={styles.input}
                type="text"
                value={editedBusiness?.businessAddress}
                onChange={(e) => setEditedBusiness({
                  ...editedBusiness,
                  businessAddress: e.target.value
                })}
              />
            ) : (
              <span>{business?.businessAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* Three Main Cards Section */}
      <div style={styles.cardsContainer}>
        {/* Employees Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Employees</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Total Employees</span>
                <h3>{employeeCount.total}</h3>
              </div>
              <div style={styles.stat}>
                <span>Remaining Slots</span>
                <h3>{employeeCount.remaining}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/employees')} 
                style={styles.actionButton}
              >
                View Employee List
              </button>
          
            </div>
          </div>
        </div>

        {/* Payroll Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Payroll Management</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Total Gross Salary</span>
                <h3>KES {payrollSummary?.totalGrossSalary?.toLocaleString() || 0}</h3>
              </div>
              <div style={styles.stat}>
                <span>Total Net Salary</span>
                <h3>KES {payrollSummary?.totalNetSalary?.toLocaleString() || 0}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/payroll')} 
                style={styles.actionButton}
              >
                Manage Payroll
              </button>
            </div>
          </div>
        </div>

        {/* Performance Reviews Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Performance Reviews</h2>
          <div style={styles.cardContent}>
            <div style={styles.cardStats}>
              <div style={styles.stat}>
                <span>Pending Reviews</span>
                <h3>{reviewStats.pendingReviews}</h3>
              </div>
              <div style={styles.stat}>
                <span>Completed Reviews</span>
                <h3>{reviewStats.completedReviews}</h3>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button 
                onClick={() => navigate('/performance-reviews')} 
                style={styles.actionButton}
              >
                View Reviews
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
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
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Offer Letter</label>
              <input
                style={styles.input}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNewEmployee({
                  ...newEmployee, 
                  offerLetter: e.target.files[0]
                })}
              />
            </div>
          </div>
          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitBtn}>
              Add Employee
            </button>
            <button 
              type="button" 
              style={styles.cancelBtn}
              onClick={() => {
                setShowAddEmployee(false);
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
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    padding: '1rem 0',
    borderBottom: '2px solid #e9ecef',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '1.1rem',
  },
  logoutBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    fontWeight: '600',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '0.75rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
    margin: '2rem 0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cardStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  stat: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e9ecef',
    },
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionButton: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#e74c3c',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  
  editBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  editButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  
  saveBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  cancelEditBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '0.9rem',
    width: '100%',
  },
  viewBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    color: '#2c3e50',
  },
  input: {
    padding: '0.8rem',
    fontSize: '1rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    width: '100%',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
    },
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    padding: '0.8rem 2rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    '&:hover': {
      backgroundColor: '#219a52',
    },
  },
  cancelBtn: {
    padding: '0.8rem 2rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
};

export default Dashboard; 