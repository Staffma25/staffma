import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../utils/api';

function StaffmaLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'system',
    severity: '',
    dateRange: '7d'
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real system logs from activities API
        const response = await getActivities(filters);
        const systemLogs = response.activities?.filter(activity => 
          activity.category === 'system' || activity.category === 'security'
        ) || [];
        
        setLogs(systemLogs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching system logs:', error);
        setError('Failed to fetch system logs: ' + error.message);
        setLoading(false);
      }
    };

    fetchLogs();
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'database': return '🗄️';
      case 'network': return '🌐';
      default: return '📝';
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
        <div style={styles.loading}>Loading system logs...</div>
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
        <h1 style={styles.title}>System Logs</h1>
        <p style={styles.subtitle}>System and security event logs</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={styles.select}
          >
            <option value="system">System</option>
            <option value="security">Security</option>
            <option value="database">Database</option>
            <option value="network">Network</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Severity:</label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
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
        {logs.length > 0 ? (
          <div style={styles.logsList}>
            {logs.map((log) => (
              <div key={log._id} style={styles.logCard}>
                <div style={styles.logHeader}>
                  <div style={styles.logInfo}>
                    <div style={styles.logCategory}>
                      <span style={styles.categoryIcon}>{getCategoryIcon(log.category)}</span>
                      <span style={styles.categoryName}>{log.category}</span>
                    </div>
                    <span 
                      style={styles.severityBadge} 
                      style={{ backgroundColor: getSeverityColor(log.severity) }}
                    >
                      {log.severity.toUpperCase()}
                    </span>
                  </div>
                  <span style={styles.logTime}>{formatRelativeTime(log.timestamp)}</span>
                </div>
                
                <h3 style={styles.logTitle}>{log.title}</h3>
                <p style={styles.logDescription}>{log.description}</p>
                
                <div style={styles.logDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{log.businessId?.businessName || 'System'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>User:</span>
                    <span style={styles.detailValue}>
                      {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Time:</span>
                    <span style={styles.detailValue}>{formatDate(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h3 style={styles.emptyTitle}>No System Logs</h3>
            <p style={styles.emptyText}>
              No system logs found for the selected filters.
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
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  logCard: {
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
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
  },
  filterGroup: {
    flex: 1,
  },
  label: {
    display: 'block',
    marginBottom: '5px',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
  },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  logInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logCategory: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  categoryIcon: {
    fontSize: '1.25rem',
  },
  categoryName: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  severityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  logTime: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  logTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  logDescription: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: 0,
  },
  logDetails: {
    display: 'flex',
    gap: '10px',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    display: 'block',
    marginBottom: '5px',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
};

export default StaffmaLogs; 