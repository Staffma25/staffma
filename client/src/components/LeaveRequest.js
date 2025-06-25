import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LeaveRequest() {
  const navigate = useNavigate();
  const { getToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

  const [leaveRequest, setLeaveRequest] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: []
  });

  useEffect(() => {
    // Fetch employees when component mounts
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    
    // Find and set the selected employee's details
    const employee = employees.find(emp => emp._id === employeeId);
    setSelectedEmployeeDetails(employee);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setLeaveRequest(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('type', leaveRequest.type);
      formData.append('startDate', leaveRequest.startDate);
      formData.append('endDate', leaveRequest.endDate);
      formData.append('reason', leaveRequest.reason);
      
      // Calculate duration in days
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end dates

      // Append duration to formData
      formData.append('duration', duration.toString());
      
      // Add employeeId if selected
      if (selectedEmployee) {
        formData.append('employeeId', selectedEmployee);
      }
      
      // Add attachments if any
      if (leaveRequest.attachments.length > 0) {
        leaveRequest.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      console.log('Submitting leave request with data:', {
        type: leaveRequest.type,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        reason: leaveRequest.reason,
        duration,
        employeeId: selectedEmployee || 'current user'
      });

      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves`;
      console.log('Sending request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to submit leave request');
      }

      setSuccess(true);
      setLeaveRequest({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
        attachments: []
      });
      setSelectedEmployee(null);

      // Redirect to leave requests page after 2 seconds
      setTimeout(() => {
        navigate('/leave-requests');
      }, 2000);

    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Request Leave</h1>
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={styles.success}>
          Leave request submitted successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Employee Selection Section */}
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

        {selectedEmployeeDetails && (
          <div style={styles.employeeInfo}>
            <h2 style={styles.employeeName}>
              Leave Request for: {selectedEmployeeDetails.firstName} {selectedEmployeeDetails.lastName}
            </h2>
            <p style={styles.employeeDepartment}>Department: {selectedEmployeeDetails.department}</p>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Leave Type</label>
          <select
            name="type"
            value={leaveRequest.type}
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
            value={leaveRequest.startDate}
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
            value={leaveRequest.endDate}
            onChange={handleInputChange}
            style={styles.input}
            required
            min={leaveRequest.startDate || new Date().toISOString().split('T')[0]}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Duration (Days)</label>
          <input
            type="number"
            value={calculateDuration(leaveRequest.startDate, leaveRequest.endDate)}
            style={styles.input}
            disabled
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Reason</label>
          <textarea
            name="reason"
            value={leaveRequest.reason}
            onChange={handleInputChange}
            style={styles.textarea}
            required
            placeholder="Please provide a detailed reason for your leave request"
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
          <small style={styles.helperText}>
            Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
          </small>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/leave-requests')}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '15px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '0.875rem',
    color: '#2c3e50',
    fontWeight: '500'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '0.875rem',
    width: '100%'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '0.875rem',
    width: '100%',
    backgroundColor: '#ffffff'
  },
  textarea: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '0.875rem',
    width: '100%',
    resize: 'vertical'
  },
  fileInput: {
    padding: '6px',
    border: '1px dashed #dcdde1',
    borderRadius: '4px',
    width: '100%'
  },
  helperText: {
    fontSize: '0.75rem',
    color: '#7f8c8d',
    marginTop: '2px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    flex: 1,
    '&:hover': {
      backgroundColor: '#2980b9'
    },
    '&:disabled': {
      backgroundColor: '#bdc3c7',
      cursor: 'not-allowed'
    }
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    flex: 1,
    '&:hover': {
      backgroundColor: '#c0392b'
    }
  },
  error: {
    padding: '8px',
    backgroundColor: '#fde8e8',
    color: '#c81e1e',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '0.875rem',
  },
  success: {
    padding: '8px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '0.875rem',
  },
  employeeInfo: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    border: '1px solid #e9ecef',
  },
  employeeName: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 4px 0',
    fontWeight: '600',
  },
  employeeDepartment: {
    fontSize: '0.875rem',
    color: '#6c757d',
    margin: 0,
  },
};

export default LeaveRequest; 