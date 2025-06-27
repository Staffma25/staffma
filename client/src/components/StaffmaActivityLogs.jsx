import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, getActivitySummary } from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function StaffmaActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: '',
    dateRange: '7d',
    businessId: ''
  });
  const [businesses, setBusinesses] = useState([]);
  const { getToken, logout } = useAuth();

  const fetchActivities = useCallback(async (abortController) => {
    try {
      const token = getToken('staffma');
      if (!token) {
        console.error('No Staffma authentication token found');
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await getActivities(filters, abortController?.signal);
      
      if (!abortController?.signal.aborted) {
        setActivities(response.activities || []);
        setLoading(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching activities:', error);
        setError(error.message);
        setLoading(false);
      }
    }
  }, [filters, getToken]);

  const fetchBusinesses = useCallback(async (abortController) => {
    try {
      const token = getToken('staffma');
      const response = await fetch(`${API_BASE_URL}/staffma/businesses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      if (!abortController?.signal.aborted) {
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching businesses:', error);
      }
    }
  }, [getToken]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchActivities(abortController);
    fetchBusinesses(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchActivities, fetchBusinesses]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'info': return '#2196f3';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading activity logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Activity Logs</h1>
        <p style={styles.subtitle}>Monitor system activities across all businesses</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={styles.select}
          >
            <option value="">All Categories</option>
            <option value="login">Login</option>
            <option value="payroll">Payroll</option>
            <option value="employee">Employee</option>
            <option value="system">System</option>
            <option value="security">Security</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Severity:</label>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            style={styles.select}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={styles.select}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Business:</label>
          <select
            value={filters.businessId}
            onChange={(e) => handleFilterChange('businessId', e.target.value)}
            style={styles.select}
          >
            <option value="">All Businesses</option>
            {businesses.map(business => (
              <option key={business._id} value={business._id}>
                {business.businessName}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Date Range:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            style={styles.select}
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div style={styles.content}>
        {activities.length > 0 ? (
          <div style={styles.activitiesList}>
            {activities.map((activity) => (
              <div key={activity._id} style={styles.activityCard}>
                <div style={styles.activityHeader}>
                  <div style={styles.activityInfo}>
                    <h3 style={styles.activityTitle}>{activity.title}</h3>
                    <p style={styles.activityDescription}>{activity.description}</p>
                  </div>
                  <div style={styles.activityMeta}>
                    <span style={{
                      ...styles.severityBadge,
                      backgroundColor: getSeverityColor(activity.severity)
                    }}>
                      {activity.severity}
                    </span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(activity.status)
                    }}>
                      {activity.status}
                    </span>
                  </div>
                </div>
                
                <div style={styles.activityDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{activity.businessName || 'Unknown'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Category:</span>
                    <span style={styles.detailValue}>{activity.category}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>User:</span>
                    <span style={styles.detailValue}>{activity.userName || 'System'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Time:</span>
                    <span style={styles.detailValue}>
                      {formatDate(activity.timestamp)} ({formatRelativeTime(activity.timestamp)})
                    </span>
                  </div>
                </div>

                {activity.details && (
                  <div style={styles.activityDetails}>
                    <pre style={styles.detailsPre}>{JSON.stringify(activity.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h3 style={styles.emptyTitle}>No Activity Logs Found</h3>
            <p style={styles.emptyText}>
              No activity logs match the current filters. Try adjusting your search criteria.
            </p>
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
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.75rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#2c3e50',
  },
  select: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.8rem',
    minWidth: '120px',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  activitiesList: {
    padding: '20px',
  },
  activityCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#fafbfc',
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 4px 0',
  },
  activityDescription: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    margin: 0,
  },
  activityMeta: {
    display: 'flex',
    gap: '8px',
  },
  severityBadge: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '500',
    color: 'white',
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '500',
    color: 'white',
  },
  activityDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '10px',
  },
  detailItem: {
    display: 'flex',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: '0.75rem',
    color: '#2c3e50',
  },
  detailsPre: {
    fontSize: '0.7rem',
    backgroundColor: '#f8f9fa',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    margin: '10px 0 0 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    opacity: '0.5',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    fontSize: '1rem',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#e74c3c',
    fontSize: '1rem',
  },
};

export default StaffmaActivityLogs; 