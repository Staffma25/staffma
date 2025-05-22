import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      console.log('Fetching details for employee ID:', id); // Debug log
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5001/api/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employee details');
      }

      const data = await response.json();
      console.log('Received employee data:', data); // Debug log
      setEmployee(data);
    } catch (error) {
      console.error('Error in fetchEmployeeDetails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading employee details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            Back to Employees List
          </button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Employee not found</p>
          <button 
            onClick={() => navigate('/employees')} 
            style={styles.backButton}
          >
            Back to Employees List
          </button>
        </div>
      </div>
    );
  }

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
          <h1 style={styles.title}>
            {employee.firstName} {employee.lastName}
          </h1>
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'personal' && styles.activeTab)}}
          onClick={() => setActiveTab('personal')}
        >
          Personal Information
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'performance' && styles.activeTab)}}
          onClick={() => setActiveTab('performance')}
        >
          Performance Reviews
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'payroll' && styles.activeTab)}}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll History
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'personal' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Personal Information</h2>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.label}>Position</span>
                <span style={styles.value}>{employee.position}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Department</span>
                <span style={styles.value}>{employee.department}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Email</span>
                <span style={styles.value}>{employee.email}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Phone</span>
                <span style={styles.value}>{employee.phone}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Start Date</span>
                <span style={styles.value}>
                  {new Date(employee.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Performance Reviews</h2>
            {employee.performanceReviews?.length > 0 ? (
              employee.performanceReviews.map(review => (
                <div key={review._id} style={styles.reviewCard}>
                  <h3>Review Date: {new Date(review.reviewDate).toLocaleDateString()}</h3>
                  <p><strong>Rating:</strong> {review.rating}/5</p>
                  <p><strong>Reviewer:</strong> {review.reviewerName}</p>
                  <p><strong>Comments:</strong> {review.comments}</p>
                </div>
              ))
            ) : (
              <p>No performance reviews available</p>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Payroll History</h2>
            {employee.payrollHistory?.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Basic Salary</th>
                    <th>Gross Pay</th>
                    <th>Net Pay</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.payrollHistory.map(payroll => (
                    <tr key={payroll._id}>
                      <td>{`${payroll.month}/${payroll.year}`}</td>
                      <td>KES {payroll.basicSalary?.toLocaleString()}</td>
                      <td>KES {payroll.grossSalary?.toLocaleString()}</td>
                      <td>KES {payroll.netSalary?.toLocaleString()}</td>
                      <td>
                        <button 
                          onClick={() => window.open(`/api/payroll/download/${payroll._id}`, '_blank')}
                          style={styles.downloadButton}
                        >
                          Download Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No payroll history available</p>
            )}
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
    gap: '20px',
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
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
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f1f1f1',
  },
  activeTab: {
    backgroundColor: '#3498db',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    color: '#666',
    fontSize: '0.9rem',
  },
  value: {
    color: '#2c3e50',
    fontSize: '1.1rem',
    fontWeight: '500',
  },
  reviewCard: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    marginBottom: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  downloadButton: {
    padding: '6px 12px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: '#e74c3c',
    padding: '20px',
    backgroundColor: '#ffd5d5',
    borderRadius: '8px',
    textAlign: 'center',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
};

export default EmployeeDetails; 
