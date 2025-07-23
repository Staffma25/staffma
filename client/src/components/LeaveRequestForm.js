import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LeaveRequestForm() {
  const { getToken, user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch employees if user is department head or has viewAllLeaves permission
    if (user.type === 'department_head' || user.permissions?.leaveManagement?.viewAllLeaves) {
      fetchEmployees();
    }

    // Cleanup function
    return () => {
      setMounted(false);
    };
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/users?type=employee`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      // Only update state if component is still mounted
      if (mounted) {
        // Filter employees based on department if user is department head
        const filteredEmployees = user.type === 'department_head' 
          ? data.filter(emp => emp.department === user.department)
          : data;
        setEmployees(filteredEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (mounted) {
        setError('Failed to load employees');
      }
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    
    // Find and set the selected employee's details
    const employee = employees.find(emp => emp._id === employeeId);
    setSelectedEmployeeDetails(employee);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachments: Array.from(e.target.files)
    }));
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mounted) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      const formDataToSend = new FormData();
      
      // Add leave request data
      formDataToSend.append('type', formData.type);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('duration', calculateDuration(formData.startDate, formData.endDate));

      // Add employeeId if selected
      if (selectedEmployee) {
        formDataToSend.append('employeeId', selectedEmployee);
      }

      // Add attachments if any
      formData.attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/leaves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!mounted) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit leave request');
      }

      setSuccess(true);
      setFormData({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
        attachments: []
      });
      setSelectedEmployee(null);
    } catch (error) {
      if (mounted) {
        setError(error.message);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Request Leave</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>Leave request submitted successfully!</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Employee Selection Section */}
        {(user.type === 'department_head' || user.permissions?.leaveManagement?.viewAllLeaves) && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Employee</label>
            <select
              value={selectedEmployee || ''}
              onChange={handleEmployeeChange}
              style={styles.select}
              required
            >
              <option value="">Select an employee</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName} - {employee.department}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Enhanced Employee Selection Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Employee Information</h3>
          
          {(user.type === 'department_head' || user.permissions?.leaveManagement?.viewAllLeaves) ? (
            <>
              {selectedEmployeeDetails && (
                <div style={styles.employeeInfo}>
                  <div style={styles.employeeHeader}>
                    <h4 style={styles.employeeName}>
                      {selectedEmployeeDetails.firstName} {selectedEmployeeDetails.lastName}
                    </h4>
                    <span style={styles.employeeBadge}>{selectedEmployeeDetails.department}</span>
                  </div>
                  <div style={styles.employeeDetails}>
                    <p style={styles.employeeDetail}>
                      <strong>Email:</strong> {selectedEmployeeDetails.email}
                    </p>
                    <p style={styles.employeeDetail}>
                      <strong>Position:</strong> {selectedEmployeeDetails.position || 'Not specified'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.employeeInfo}>
              <div style={styles.employeeHeader}>
                <h4 style={styles.employeeName}>
                  {user.firstName} {user.lastName}
                </h4>
                <span style={styles.employeeBadge}>{user.department}</span>
              </div>
              <div style={styles.employeeDetails}>
                <p style={styles.employeeDetail}>
                  <strong>Email:</strong> {user.email}
                </p>
                <p style={styles.employeeDetail}>
                  <strong>Position:</strong> {user.position || 'Not specified'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Leave Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            style={styles.select}
            required
          >
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            style={styles.input}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            style={styles.input}
            required
            min={formData.startDate || new Date().toISOString().split('T')[0]}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Reason</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            style={styles.textarea}
            required
            placeholder="Please provide a reason for your leave request"
            rows="4"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Attachments (Optional)</label>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <small style={styles.fileHint}>
            Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB each)
          </small>
        </div>

        <button 
          type="submit" 
          style={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    color: '#4a5568',
    fontWeight: '500'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%',
    backgroundColor: 'white'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%',
    resize: 'vertical'
  },
  fileInput: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    width: '100%'
  },
  fileHint: {
    fontSize: '0.8rem',
    color: '#718096',
    marginTop: '0.25rem'
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '1rem',
    '&:hover': {
      backgroundColor: '#3182ce'
    },
    '&:disabled': {
      backgroundColor: '#a0aec0',
      cursor: 'not-allowed'
    }
  },
  error: {
    padding: '0.75rem',
    backgroundColor: '#fed7d7',
    color: '#c53030',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  success: {
    padding: '0.75rem',
    backgroundColor: '#c6f6d5',
    color: '#2f855a',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    fontWeight: '600'
  },
  employeeInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '1.25rem',
    marginTop: '1rem',
    border: '1px solid #e9ecef'
  },
  employeeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  employeeName: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    margin: 0,
    fontWeight: '600'
  },
  employeeBadge: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  employeeDetails: {
    display: 'grid',
    gap: '0.5rem'
  },
  employeeDetail: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#6c757d'
  },
  helperText: {
    fontSize: '0.875rem',
    color: '#6c757d',
    marginTop: '0.25rem'
  },
};

export default LeaveRequestForm; 