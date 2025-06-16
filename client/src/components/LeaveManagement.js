import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaves');
      }

      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId, status, rejectionReason = '') => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (!response.ok) {
        throw new Error('Failed to update leave status');
      }

      // Refresh the leaves list
      fetchLeaves();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Leave Management</h1>
      
      <div style={styles.leavesList}>
        {leaves.map(leave => (
          <div key={leave._id} style={styles.leaveCard}>
            <div style={styles.leaveHeader}>
              <h3 style={styles.employeeName}>
                {leave.employeeId.firstName} {leave.employeeId.lastName}
              </h3>
              <span style={{
                ...styles.status,
                backgroundColor: leave.status === 'approved' ? '#4caf50' : 
                               leave.status === 'rejected' ? '#f44336' : '#ff9800'
              }}>
                {leave.status}
              </span>
            </div>

            <div style={styles.leaveDetails}>
              <p><strong>Type:</strong> {leave.type}</p>
              <p><strong>Start Date:</strong> {new Date(leave.startDate).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(leave.endDate).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> {leave.duration} days</p>
              <p><strong>Reason:</strong> {leave.reason}</p>
            </div>

            {leave.status === 'pending' && (
              <div style={styles.actions}>
                <button
                  onClick={() => handleStatusUpdate(leave._id, 'approved')}
                  style={styles.approveButton}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Please enter rejection reason:');
                    if (reason) {
                      handleStatusUpdate(leave._id, 'rejected', reason);
                    }
                  }}
                  style={styles.rejectButton}
                >
                  Reject
                </button>
              </div>
            )}

            {leave.status === 'rejected' && leave.rejectionReason && (
              <div style={styles.rejectionReason}>
                <strong>Rejection Reason:</strong> {leave.rejectionReason}
              </div>
            )}

            {leave.attachments && leave.attachments.length > 0 && (
              <div style={styles.attachments}>
                <strong>Attachments:</strong>
                <ul style={styles.attachmentList}>
                  {leave.attachments.map((attachment, index) => (
                    <li key={index}>
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        {attachment.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#e74c3c',
    backgroundColor: '#fde8e8',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  leavesList: {
    display: 'grid',
    gap: '1.5rem',
  },
  leaveCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  leaveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  employeeName: {
    fontSize: '1.2rem',
    color: '#2c3e50',
    margin: 0,
  },
  status: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.9rem',
    textTransform: 'capitalize',
  },
  leaveDetails: {
    marginBottom: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  approveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#43a047',
    },
  },
  rejectButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e53935',
    },
  },
  rejectionReason: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fde8e8',
    borderRadius: '4px',
    color: '#c81e1e',
  },
  attachments: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  attachmentList: {
    listStyle: 'none',
    padding: 0,
    margin: '0.5rem 0 0 0',
  },
};

export default LeaveManagement; 