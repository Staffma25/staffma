import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../utils/api';

function StaffmaAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    severity: 'critical',
    status: 'active',
    dateRange: '7d'
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real alerts from activities API
        const response = await getActivities(filters);
        const criticalActivities = response.activities?.filter(activity => 
          activity.severity === 'critical' || activity.severity === 'high'
        ) || [];
        
        setAlerts(criticalActivities);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setError('Failed to fetch alerts: ' + error.message);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [getToken, filters]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
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
        <div style={styles.loading}>Loading alerts...</div>
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
        <h1 style={styles.title}>System Alerts</h1>
        <p style={styles.subtitle}>Critical and high-priority system alerts</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Severity:</label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            style={styles.select}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Time Range:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            style={styles.select}
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div style={styles.content}>
        {alerts.length > 0 ? (
          <div style={styles.alertsList}>
            {alerts.map((alert) => (
              <div key={alert._id} style={styles.alertCard}>
                <div style={styles.alertHeader}>
                  <div style={styles.alertTitle}>
                    <span style={styles.severityBadge} style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <h3 style={styles.alertName}>{alert.title}</h3>
                  </div>
                  <span style={styles.alertTime}>{formatRelativeTime(alert.timestamp)}</span>
                </div>
                
                <p style={styles.alertDescription}>{alert.description}</p>
                
                <div style={styles.alertDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Category:</span>
                    <span style={styles.detailValue}>{alert.category}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{alert.businessId?.businessName || 'N/A'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>User:</span>
                    <span style={styles.detailValue}>
                      {alert.userId ? `${alert.userId.firstName} ${alert.userId.lastName}` : 'System'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Time:</span>
                    <span style={styles.detailValue}>{formatDate(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✅</div>
            <h3 style={styles.emptyTitle}>No Alerts Found</h3>
            <p style={styles.emptyText}>
              No critical or high-priority alerts in the selected time range.
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
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  alertCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '15px',
    backgroundColor: '#fafbfc',
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
  filters: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    marginBottom: '8px',
  },
  select: {
    padding: '8px',
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  alertTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  severityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  alertName: {
    margin: 0,
  },
  alertTime: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  alertDescription: {
    margin: '10px 0',
  },
  alertDetails: {
    display: 'flex',
    gap: '10px',
  },
  detailItem: {
    display: 'flex',
    gap: '5px',
  },
  detailLabel: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: '0.875rem',
  },
};

export default StaffmaAlerts; 