import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LeaveDetailsModal from './LeaveDetailsModal';

function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [sortBy, setSortBy] = useState('date'); // date, type, status
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

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
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleViewDetails = (leaveId) => {
    console.log('Opening modal for leave ID:', leaveId);
    setSelectedLeaveId(leaveId);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setSelectedLeaveId(null);
  };

  const handleStatusUpdate = () => {
    // Refresh the leaves list when status is updated
    fetchLeaves();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAndSortedLeaves = leaves
    .filter(leave => filter === 'all' || leave.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Leave Requests</h2>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Filter by Status:</label>
          <select 
            value={filter} 
            onChange={handleFilterChange}
            style={styles.select}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={handleSortChange}
            style={styles.select}
          >
            <option value="date">Date</option>
            <option value="type">Leave Type</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Leave Type</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Duration</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedLeaves.map(leave => (
              <tr key={leave._id} style={styles.tr}>
                <td style={styles.td}>
                  {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                </td>
                <td style={styles.td}>{leave.type}</td>
                <td style={styles.td}>{formatDate(leave.startDate)}</td>
                <td style={styles.td}>{formatDate(leave.endDate)}</td>
                <td style={styles.td}>{leave.duration} days</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.status,
                    backgroundColor: getStatusColor(leave.status)
                  }}>
                    {leave.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleViewDetails(leave._id)}
                    style={styles.viewButton}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedLeaves.length === 0 && (
        <div style={styles.noData}>
          No leave requests found
        </div>
      )}

      {/* Leave Details Modal */}
      {selectedLeaveId && (
        <LeaveDetailsModal
          leaveId={selectedLeaveId}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.875rem',
    color: '#1f2937',
    margin: 0
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    color: '#4b5563',
    fontWeight: '500'
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    backgroundColor: 'white'
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '600',
    borderBottom: '1px solid #e5e7eb'
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
    '&:hover': {
      backgroundColor: '#f9fafb'
    }
  },
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#4b5563'
  },
  status: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize'
  },
  viewButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#e5e7eb'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#ef4444'
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
};

export default LeaveRequests; 