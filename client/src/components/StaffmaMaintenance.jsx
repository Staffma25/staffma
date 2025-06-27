import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../utils/api';

function StaffmaMaintenance() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'maintenance',
    dateRange: '30d'
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real maintenance data from activities API
        const response = await getActivities(filters);
        const maintenanceActivities = response.activities?.filter(activity => 
          activity.category === 'maintenance' || 
          activity.title?.toLowerCase().includes('maintenance') ||
          activity.title?.toLowerCase().includes('update') ||
          activity.title?.toLowerCase().includes('upgrade')
        ) || [];
        
        // Transform activities into maintenance records
        const maintenanceRecords = maintenanceActivities.map((activity, index) => ({
          id: activity._id || index,
          title: activity.title || `Maintenance ${index + 1}`,
          type: activity.category || 'system',
          status: activity.status || 'completed',
          priority: activity.severity || 'medium',
          scheduledDate: activity.timestamp,
          completedDate: activity.timestamp,
          description: activity.description || 'System maintenance task',
          business: activity.businessId?.businessName || 'System'
        }));
        
        setMaintenance(maintenanceRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
        setError('Failed to fetch maintenance data: ' + error.message);
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, [getToken, filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#ff9800';
      case 'scheduled': return '#2196f3';
      case 'failed': return '#f44336';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'system': return '⚙️';
      case 'update': return '🔄';
      case 'upgrade': return '⬆️';
      default: return '🔧';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading maintenance data...</div>
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
        <h1 style={styles.title}>System Maintenance</h1>
        <p style={styles.subtitle}>Maintenance tasks and system updates</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Maintenance Type:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={styles.select}
          >
            <option value="maintenance">All Maintenance</option>
            <option value="system">System</option>
            <option value="update">Updates</option>
            <option value="upgrade">Upgrades</option>
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
        {maintenance.length > 0 ? (
          <div style={styles.maintenanceList}>
            {maintenance.map((task) => (
              <div key={task.id} style={styles.maintenanceCard}>
                <div style={styles.maintenanceHeader}>
                  <div style={styles.maintenanceInfo}>
                    <div style={styles.maintenanceType}>
                      <span style={styles.typeIcon}>{getTypeIcon(task.type)}</span>
                      <span style={styles.typeName}>{task.type}</span>
                    </div>
                    <span 
                      style={styles.statusBadge} 
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                    <span 
                      style={styles.priorityBadge} 
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <h3 style={styles.maintenanceTitle}>{task.title}</h3>
                <p style={styles.maintenanceDescription}>{task.description}</p>
                
                <div style={styles.maintenanceDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{task.business}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Scheduled:</span>
                    <span style={styles.detailValue}>{formatDate(task.scheduledDate)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Completed:</span>
                    <span style={styles.detailValue}>{formatDate(task.completedDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔧</div>
            <h3 style={styles.emptyTitle}>No Maintenance Tasks</h3>
            <p style={styles.emptyText}>
              No maintenance tasks found for the selected filters.
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
  maintenanceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  maintenanceCard: {
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
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  select: {
    padding: '8px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
  },
  maintenanceHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  maintenanceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  maintenanceType: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  typeIcon: {
    fontSize: '1.25rem',
  },
  typeName: {
    fontSize: '0.875rem',
    color: '#2c3e50',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  maintenanceTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  maintenanceDescription: {
    margin: '0 0 15px 0',
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  maintenanceDetails: {
    display: 'flex',
    gap: '10px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  detailLabel: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#2c3e50',
  },
};

export default StaffmaMaintenance; 