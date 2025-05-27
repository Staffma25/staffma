import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentUpload from './DocumentUpload';
import InsuranceDocumentUpload from './InsuranceDocumentUpload';

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }
    fetchEmployeeDetails();
  }, [id]);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:5001/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      return data.token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
      throw error;
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      });

      // If token expired, try to refresh
      if (response.status === 401) {
        const newToken = await refreshToken();
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      }

      return response;
    } catch (error) {
      console.error('Error in fetchWithAuth:', error);
      throw error;
        }
  };

  const fetchEmployeeDetails = async () => {
    try {
      console.log('Fetching details for employee ID:', id);
      const response = await fetchWithAuth(`http://localhost:5001/api/employees/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employee details');
      }

      const data = await response.json();
      console.log('Received employee data:', data);
      setEmployee(data);
    } catch (error) {
      console.error('Error in fetchEmployeeDetails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentType, file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetchWithAuth(
        `http://localhost:5001/api/employees/${id}/documents/${documentType}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      await fetchEmployeeDetails();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInsuranceUpdate = async (insuranceType, field, value) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:5001/api/employees/${id}/insurance/${insuranceType}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [field]: value
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update insurance information');
      }

      await fetchEmployeeDetails();
    } catch (error) {
      console.error('Error updating insurance:', error);
      alert('Failed to update insurance information: ' + error.message);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      setActionLoading(true);
      const response = await fetchWithAuth(`http://localhost:5001/api/employees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      alert('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee: ' + error.message);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleEmployeeStatus = async () => {
    try {
      setActionLoading(true);
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetchWithAuth(`http://localhost:5001/api/employees/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update employee status');
      }

      await fetchEmployeeDetails();
      alert(`Employee ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`);
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Failed to update employee status: ' + error.message);
    } finally {
      setActionLoading(false);
      setShowBlockModal(false);
    }
  };

  const handleDocumentUpdate = (documentType, fileUrl) => {
    setEmployee(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: fileUrl ? {
          url: fileUrl,
          uploadedAt: new Date()
        } : null
      }
    }));
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
        <div style={styles.actionButtons}>
          <button
            onClick={() => setShowBlockModal(true)}
            style={{
              ...styles.actionButton,
              backgroundColor: employee.status === 'active' ? '#e74c3c' : '#2ecc71'
            }}
            disabled={actionLoading}
          >
            {employee.status === 'active' ? 'Block Employee' : 'Activate Employee'}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              ...styles.actionButton,
              backgroundColor: '#e74c3c'
            }}
            disabled={actionLoading}
          >
            Delete Employee
          </button>
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
          style={{...styles.tab, ...(activeTab === 'documents' && styles.activeTab)}}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'insurance' && styles.activeTab)}}
          onClick={() => setActiveTab('insurance')}
        >
          Insurance
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

        {activeTab === 'documents' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Employee Documents</h2>
            
            <div className="documents-section">
              <h3>Documents</h3>
              <div className="documents-grid">
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="idCard"
                  currentDocument={employee.documents?.idCard}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="passport"
                  currentDocument={employee.documents?.passport}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="resume"
                  currentDocument={employee.documents?.resume}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="contract"
                  currentDocument={employee.documents?.contract}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="certificates"
                  currentDocument={employee.documents?.certificates}
                  onDocumentUpdate={handleDocumentUpdate}
                />
                <DocumentUpload
                  employeeId={employee._id}
                  documentType="other"
                  currentDocument={employee.documents?.other}
                  onDocumentUpdate={handleDocumentUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Insurance Documents</h2>
            
            <div className="insurance-section">
              {/* NHIF Section */}
              <div style={styles.insuranceSection}>
                <h3 style={styles.insuranceTitle}>NHIF</h3>
                <div style={styles.uploadSection}>
                  <input
                    type="text"
                    placeholder="NHIF Number"
                    value={employee.insurance?.nhif?.number || ''}
                    onChange={(e) => handleInsuranceUpdate('nhif', 'number', e.target.value)}
                    style={styles.input}
                  />
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="nhif"
                    currentDocument={employee.insurance?.nhif}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                  />
                </div>
              </div>

              {/* Medical Insurance Section */}
              <div style={styles.insuranceSection}>
                <h3 style={styles.insuranceTitle}>Medical Insurance</h3>
                <div style={styles.uploadSection}>
                  <input
                    type="text"
                    placeholder="Provider"
                    value={employee.insurance?.medical?.provider || ''}
                    onChange={(e) => handleInsuranceUpdate('medical', 'provider', e.target.value)}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Policy Number"
                    value={employee.insurance?.medical?.policyNumber || ''}
                    onChange={(e) => handleInsuranceUpdate('medical', 'policyNumber', e.target.value)}
                    style={styles.input}
                  />
                  <select
                    value={employee.insurance?.medical?.coverage || 'basic'}
                    onChange={(e) => handleInsuranceUpdate('medical', 'coverage', e.target.value)}
                    style={styles.select}
                  >
                    <option value="basic">Basic Coverage</option>
                    <option value="standard">Standard Coverage</option>
                    <option value="premium">Premium Coverage</option>
                  </select>
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="medical"
                    currentDocument={employee.insurance?.medical}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                  />
                </div>
              </div>

              {/* Life Insurance Section */}
              <div style={styles.insuranceSection}>
                <h3 style={styles.insuranceTitle}>Life Insurance</h3>
                <div style={styles.uploadSection}>
                  <input
                    type="text"
                    placeholder="Provider"
                    value={employee.insurance?.life?.provider || ''}
                    onChange={(e) => handleInsuranceUpdate('life', 'provider', e.target.value)}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Policy Number"
                    value={employee.insurance?.life?.policyNumber || ''}
                    onChange={(e) => handleInsuranceUpdate('life', 'policyNumber', e.target.value)}
                    style={styles.input}
                  />
                  <select
                    value={employee.insurance?.life?.coverage || 'basic'}
                    onChange={(e) => handleInsuranceUpdate('life', 'coverage', e.target.value)}
                    style={styles.select}
                  >
                    <option value="basic">Basic Coverage</option>
                    <option value="standard">Standard Coverage</option>
                    <option value="premium">Premium Coverage</option>
                  </select>
                  <InsuranceDocumentUpload
                    employeeId={employee._id}
                    insuranceType="life"
                    currentDocument={employee.insurance?.life}
                    onDocumentUpdate={(type, data) => {
                      const updatedEmployee = { ...employee };
                      updatedEmployee.insurance[type] = data;
                      setEmployee(updatedEmployee);
                    }}
                  />
                </div>
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

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Employee</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this employee? This action will:
            </p>
            <ul style={styles.modalList}>
              <li>Delete all employee records</li>
              <li>Remove payroll history</li>
              <li>Delete performance reviews</li>
              <li>Remove all uploaded documents</li>
            </ul>
            <p style={styles.modalWarning}>This action cannot be undone.</p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={styles.modalButton}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                style={{...styles.modalButton, ...styles.deleteButton}}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {employee.status === 'active' ? 'Block Employee' : 'Activate Employee'}
            </h3>
            <p style={styles.modalText}>
              {employee.status === 'active'
                ? 'Are you sure you want to block this employee? They will not be able to access the system.'
                : 'Are you sure you want to activate this employee? They will regain access to the system.'}
            </p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowBlockModal(false)}
                style={styles.modalButton}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleEmployeeStatus}
                style={{
                  ...styles.modalButton,
                  backgroundColor: employee.status === 'active' ? '#e74c3c' : '#2ecc71'
                }}
                disabled={actionLoading}
              >
                {actionLoading
                  ? (employee.status === 'active' ? 'Blocking...' : 'Activating...')
                  : (employee.status === 'active' ? 'Block Employee' : 'Activate Employee')}
              </button>
            </div>
          </div>
        </div>
      )}
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
  documentSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  documentTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
  },
  documentInfo: {
    marginBottom: '15px',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    marginTop: '10px',
  },
  fileInput: {
    marginTop: '10px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
  },
  insuranceSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  insuranceTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
  },
  insuranceInfo: {
    marginBottom: '15px',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
    backgroundColor: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginLeft: 'auto',
  },
  actionButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    color: '#2c3e50',
  },
  modalText: {
    margin: '0 0 16px 0',
    color: '#666',
  },
  modalList: {
    margin: '0 0 16px 0',
    paddingLeft: '20px',
    color: '#666',
  },
  modalWarning: {
    color: '#e74c3c',
    fontWeight: '500',
    margin: '0 0 16px 0',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  documentsSection: {
    marginTop: '2rem',
    padding: '1rem',
    background: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  documentsSectionH3: {
    marginBottom: '1.5rem',
    color: '#2d3748',
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
};

export default EmployeeDetails; 
