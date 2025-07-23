import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LeaveDetailsModal({ leaveId, onClose, onStatusUpdate }) {
  const { getToken, businessUser, staffmaUser } = useAuth();
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Get the current user (either business or staffma)
  const user = businessUser || staffmaUser;

  useEffect(() => {
    if (leaveId) {
      fetchLeaveRequest();
    }
  }, [leaveId]);

  const fetchLeaveRequest = async () => {
    try {
      setLoading(true);
      const token = getToken(businessUser ? 'business' : 'staffma');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/leaves/${leaveId}`, {
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
      const token = getToken(businessUser ? 'business' : 'staffma');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/leaves/${leaveId}/status`, {
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
      
      // Call the parent callback to refresh the list
      if (onStatusUpdate) {
        onStatusUpdate();
      }
      
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
      const token = getToken(businessUser ? 'business' : 'staffma');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/leaves/${leaveId}/status`, {
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

      // Call the parent callback to refresh the list
      if (onStatusUpdate) {
        onStatusUpdate();
      }

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

  const canApprove = user && (user.type === 'hr_manager' || 
                    user.type === 'business' ||
                    (user.type === 'department_head' && user.department === leaveRequest?.department) ||
                    user.permissions?.leaveManagement?.approveLeave);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  if (!leaveId) return null;

  console.log('LeaveDetailsModal rendering with leaveId:', leaveId, 'isClosing:', isClosing);

  return (
    <>
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutToRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          .modal-overlay {
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={styles.overlay} onClick={handleClose} className="modal-overlay">
        <div 
          style={{
            ...styles.modal,
            animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out'
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>Leave Request Details</h2>
            <button onClick={handleClose} style={styles.closeButton}>
              ×
            </button>
          </div>

          <div style={styles.content}>
            {loading && <div style={styles.loading}>Loading...</div>}
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}
            
            {leaveRequest && (
              <>
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Employee Information</h3>
                  <div style={styles.infoBox}>
                    <p><strong>Name:</strong> {leaveRequest.employeeId.firstName} {leaveRequest.employeeId.lastName}</p>
                    <p><strong>Department:</strong> {leaveRequest.department}</p>
                    <p><strong>Email:</strong> {leaveRequest.employeeId.email}</p>
                  </div>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Leave Details</h3>
                  <div style={styles.infoBox}>
                    <p><strong>Type:</strong> {leaveRequest.type}</p>
                    <p><strong>Start Date:</strong> {new Date(leaveRequest.startDate).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(leaveRequest.endDate).toLocaleDateString()}</p>
                    <p><strong>Duration:</strong> {leaveRequest.duration} days</p>
                    <p><strong>Status:</strong> 
                      <span style={{
                        ...styles.status,
                        backgroundColor: leaveRequest.status === 'approved' ? '#10b981' : 
                                       leaveRequest.status === 'rejected' ? '#ef4444' : '#f59e0b'
                      }}>
                        {leaveRequest.status}
                      </span>
                    </p>
                    <p><strong>Reason:</strong> {leaveRequest.reason}</p>
                  </div>
                </div>

                {leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Attachments</h3>
                    <div style={styles.attachments}>
                      {leaveRequest.attachments.map((attachment, index) => (
                        <a 
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.attachmentLink}
                        >
                          📎 {attachment.name}
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
                  </div>
                )}

                {leaveRequest.status === 'rejected' && leaveRequest.rejectionReason && (
                  <div style={styles.rejectionReason}>
                    <h4 style={styles.rejectionTitle}>Rejection Reason</h4>
                    <p>{leaveRequest.rejectionReason}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {showRejectionModal && (
            <div style={styles.rejectionModal}>
              <div style={styles.rejectionModalContent}>
                <h4 style={styles.rejectionModalTitle}>Reject Leave Request</h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection"
                  style={styles.rejectionTextarea}
                  rows="3"
                  disabled={isSubmitting}
                />
                <div style={styles.rejectionModalActions}>
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
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch'
  },
  modal: {
    width: '450px',
    backgroundColor: 'white',
    boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    transform: 'translateX(0)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f8fafc',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.375rem',
    color: '#1f2937',
    margin: 0,
    fontWeight: '700'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.75rem',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    '&:hover': {
      backgroundColor: '#e5e7eb',
      color: '#374151'
    }
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    backgroundColor: '#ffffff'
  },
  section: {
    marginBottom: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #f1f5f9'
  },
  sectionTitle: {
    fontSize: '1.125rem',
    color: '#1f2937',
    marginBottom: '1rem',
    fontWeight: '600',
    padding: '0 0 0.5rem 0',
    borderBottom: '2px solid #f1f5f9'
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: '1.25rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    border: '1px solid #e2e8f0'
  },
  status: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    borderRadius: '16px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
    marginLeft: '0.75rem',
    textTransform: 'capitalize',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  attachments: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  attachmentLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    padding: '0.75rem',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    border: '1px solid #dbeafe',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '&:hover': {
      backgroundColor: '#dbeafe',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  approveButton: {
    flex: 1,
    padding: '0.75rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: '#059669',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)'
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    }
  },
  rejectButton: {
    flex: 1,
    padding: '0.75rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)'
    },
    '&:disabled': {
      backgroundColor: '#fca5a5',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    }
  },
  notice: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #fde68a',
    color: '#92400e',
    fontSize: '0.875rem',
    textAlign: 'center',
    fontWeight: '500'
  },
  rejectionReason: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  rejectionTitle: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginBottom: '0.75rem',
    fontWeight: '600'
  },
  rejectionModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    backdropFilter: 'blur(4px)'
  },
  rejectionModalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb'
  },
  rejectionModalTitle: {
    fontSize: '1.125rem',
    color: '#1f2937',
    marginBottom: '1.5rem',
    fontWeight: '600'
  },
  rejectionTextarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    resize: 'vertical',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  rejectionModalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e5e7eb'
    }
  },
  confirmRejectButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#6b7280',
    fontSize: '1rem'
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
  success: {
    padding: '1rem',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    border: '1px solid #bbf7d0',
    fontWeight: '500'
  }
};

export default LeaveDetailsModal; 