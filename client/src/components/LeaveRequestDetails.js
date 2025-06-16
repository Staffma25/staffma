import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LeaveRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, user } = useAuth();
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveRequest();
  }, [id]);

  const fetchLeaveRequest = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave request details');
      }

      const data = await response.json();
      setLeaveRequest(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve leave request');
      }

      const updatedLeave = await response.json();
      setLeaveRequest(updatedLeave.leave);
      setSuccess('Leave request has been approved successfully');
      
      // Refresh the leave request details after a short delay
      setTimeout(() => {
        fetchLeaveRequest();
      }, 1000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/leaves/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject leave request');
      }

      const updatedLeave = await response.json();
      setLeaveRequest(updatedLeave.leave);
      setSuccess('Leave request has been rejected');
      setShowRejectionModal(false);
      setRejectionReason('');

      // Refresh the leave request details after a short delay
      setTimeout(() => {
        fetchLeaveRequest();
      }, 1000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!leaveRequest) return <div style={styles.error}>Leave request not found</div>;

  const canApprove = user.type === 'hr_manager' || 
                    user.type === 'business' ||
                    (user.type === 'department_head' && user.department === leaveRequest.department) ||
                    user.permissions?.leaveManagement?.approveLeave;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Leave Request Details</h1>
        <button 
          onClick={() => navigate('/leave-requests')}
          style={styles.backButton}
        >
          Back to List
        </button>
      </div>

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Employee Information</h2>
          <div style={styles.employeeInfo}>
            <p><strong>Name:</strong> {leaveRequest.employeeId.firstName} {leaveRequest.employeeId.lastName}</p>
            <p><strong>Department:</strong> {leaveRequest.department}</p>
            <p><strong>Email:</strong> {leaveRequest.employeeId.email}</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Leave Details</h2>
          <div style={styles.leaveInfo}>
            <p><strong>Type:</strong> {leaveRequest.type}</p>
            <p><strong>Start Date:</strong> {new Date(leaveRequest.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(leaveRequest.endDate).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> {leaveRequest.duration} days</p>
            <p><strong>Status:</strong> 
              <span style={{
                ...styles.status,
                backgroundColor: leaveRequest.status === 'approved' ? '#4caf50' : 
                               leaveRequest.status === 'rejected' ? '#f44336' : '#ff9800'
              }}>
                {leaveRequest.status}
              </span>
            </p>
            <p><strong>Reason:</strong> {leaveRequest.reason}</p>
          </div>
        </div>

        {leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Attachments</h2>
            <div style={styles.attachments}>
              {leaveRequest.attachments.map((attachment, index) => (
                <a 
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.attachmentLink}
                >
                  {attachment.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {leaveRequest.status === 'pending' && canApprove && (
          <div style={styles.actions}>
            <button
              onClick={handleApprove}
              style={styles.approveButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => setShowRejectionModal(true)}
              style={styles.rejectButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Reject'}
            </button>
          </div>
        )}

        {!canApprove && leaveRequest.status === 'pending' && (
          <div style={styles.notice}>
            <p>You don't have permission to approve or reject this leave request.</p>
            {user.type === 'department_head' && (
              <p>Note: Department heads can only approve/reject leave requests from their own department.</p>
            )}
          </div>
        )}

        {leaveRequest.status === 'rejected' && leaveRequest.rejectionReason && (
          <div style={styles.rejectionReason}>
            <h3 style={styles.rejectionTitle}>Rejection Reason</h3>
            <p>{leaveRequest.rejectionReason}</p>
          </div>
        )}
      </div>

      {showRejectionModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Reject Leave Request</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection"
              style={styles.rejectionTextarea}
              rows="4"
              disabled={isSubmitting}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={styles.confirmRejectButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.875rem',
    color: '#1f2937',
    margin: 0,
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#1f2937',
    marginBottom: '1rem',
  },
  employeeInfo: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.375rem',
  },
  leaveInfo: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.375rem',
  },
  status: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    marginLeft: '0.5rem',
    textTransform: 'capitalize',
  },
  attachments: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  attachmentLink: {
    color: '#2563eb',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  approveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#43a047',
    },
    '&:disabled': {
      backgroundColor: '#a5d6a7',
      cursor: 'not-allowed',
    },
  },
  rejectButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e53935',
    },
    '&:disabled': {
      backgroundColor: '#ef9a9a',
      cursor: 'not-allowed',
    },
  },
  notice: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
    color: '#6c757d',
    textAlign: 'center',
  },
  rejectionReason: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#fde8e8',
    borderRadius: '0.375rem',
  },
  rejectionTitle: {
    fontSize: '1rem',
    color: '#c81e1e',
    marginBottom: '0.5rem',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    color: '#1f2937',
    marginBottom: '1rem',
  },
  rejectionTextarea: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  confirmRejectButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e53935',
    },
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#ef4444',
    backgroundColor: '#fde8e8',
    borderRadius: '0.375rem',
  },
  success: {
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};

export default LeaveRequestDetails; 