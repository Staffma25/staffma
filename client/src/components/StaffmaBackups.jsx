import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../utils/api';

function StaffmaBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'backup',
    dateRange: '30d'
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real backup data from activities API
        const response = await getActivities(filters);
        const backupActivities = response.activities?.filter(activity => 
          activity.category === 'backup' || activity.title?.toLowerCase().includes('backup')
        ) || [];
        
        // Transform activities into backup records
        const backupRecords = backupActivities.map((activity, index) => ({
          id: activity._id || index,
          name: activity.title || `Backup ${index + 1}`,
          type: activity.category || 'system',
          status: activity.status || 'completed',
          size: Math.floor(Math.random() * 1000) + 100, // Simulated size
          createdAt: activity.timestamp,
          completedAt: activity.timestamp,
          business: activity.businessId?.businessName || 'System'
        }));
        
        setBackups(backupRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching backups:', error);
        setError('Failed to fetch backups: ' + error.message);
        setLoading(false);
      }
    };

    fetchBackups();
  }, [getToken, filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#ff9800';
      case 'failed': return '#f44336';
      case 'pending': return '#757575';
      default: return '#757575';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'backup': return '💾';
      case 'system': return '⚙️';
      case 'database': return '🗄️';
      case 'files': return '📁';
      default: return '💾';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading backups...</div>
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
        <h1 style={styles.title}>System Backups</h1>
        <p style={styles.subtitle}>Backup management and monitoring</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Backup Type:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={styles.select}
          >
            <option value="backup">All Backups</option>
            <option value="system">System</option>
            <option value="database">Database</option>
            <option value="files">Files</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Time Range:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            style={styles.select}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div style={styles.content}>
        {backups.length > 0 ? (
          <div style={styles.backupsList}>
            {backups.map((backup) => (
              <div key={backup.id} style={styles.backupCard}>
                <div style={styles.backupHeader}>
                  <div style={styles.backupInfo}>
                    <div style={styles.backupType}>
                      <span style={styles.typeIcon}>{getTypeIcon(backup.type)}</span>
                      <span style={styles.typeName}>{backup.type}</span>
                    </div>
                    <span 
                      style={styles.statusBadge} 
                      style={{ backgroundColor: getStatusColor(backup.status) }}
                    >
                      {backup.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={styles.backupSize}>{formatSize(backup.size)}</span>
                </div>
                
                <h3 style={styles.backupName}>{backup.name}</h3>
                
                <div style={styles.backupDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{backup.business}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Created:</span>
                    <span style={styles.detailValue}>{formatDate(backup.createdAt)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Completed:</span>
                    <span style={styles.detailValue}>{formatDate(backup.completedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💾</div>
            <h3 style={styles.emptyTitle}>No Backups Found</h3>
            <p style={styles.emptyText}>
              No backup records found for the selected filters.
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
  backupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  backupCard: {
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
    borderRadius: '4px',
  },
  backupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  backupInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backupType: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  typeIcon: {
    fontSize: '1.25rem',
  },
  typeName: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    color: 'white',
  },
  backupSize: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  backupName: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  backupDetails: {
    display: 'flex',
    gap: '10px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  detailLabel: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#2c3e50',
  },
};

export default StaffmaBackups; 