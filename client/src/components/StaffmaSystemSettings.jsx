import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../utils/api';

function StaffmaSystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'settings',
    dateRange: '30d'
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real system settings data from activities API
        const response = await getActivities(filters);
        const settingsActivities = response.activities?.filter(activity => 
          activity.category === 'settings' || 
          activity.title?.toLowerCase().includes('setting') ||
          activity.title?.toLowerCase().includes('config') ||
          activity.title?.toLowerCase().includes('preference')
        ) || [];
        
        // Transform activities into settings records
        const settingsRecords = settingsActivities.map((activity, index) => ({
          id: activity._id || index,
          name: activity.title || `Setting ${index + 1}`,
          category: activity.category || 'general',
          value: activity.description || 'System setting',
          lastModified: activity.timestamp,
          modifiedBy: activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'System',
          business: activity.businessId?.businessName || 'System'
        }));
        
        setSettings(settingsRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching system settings:', error);
        setError('Failed to fetch system settings: ' + error.message);
        setLoading(false);
      }
    };

    fetchSettings();
  }, [getToken, filters]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'settings': return '⚙️';
      case 'security': return '🔒';
      case 'notification': return '🔔';
      case 'appearance': return '🎨';
      case 'general': return '📋';
      default: return '⚙️';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'security': return '#f44336';
      case 'notification': return '#ff9800';
      case 'appearance': return '#9c27b0';
      case 'general': return '#2196f3';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading system settings...</div>
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
        <h1 style={styles.title}>System Settings</h1>
        <p style={styles.subtitle}>System configuration and preferences</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Setting Category:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={styles.select}
          >
            <option value="settings">All Settings</option>
            <option value="security">Security</option>
            <option value="notification">Notifications</option>
            <option value="appearance">Appearance</option>
            <option value="general">General</option>
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
        {settings.length > 0 ? (
          <div style={styles.settingsList}>
            {settings.map((setting) => (
              <div key={setting.id} style={styles.settingCard}>
                <div style={styles.settingHeader}>
                  <div style={styles.settingInfo}>
                    <div style={styles.settingCategory}>
                      <span style={styles.categoryIcon}>{getCategoryIcon(setting.category)}</span>
                      <span 
                        style={styles.categoryName}
                        style={{ color: getCategoryColor(setting.category) }}
                      >
                        {setting.category}
                      </span>
                    </div>
                  </div>
                  <span style={styles.settingDate}>{formatDate(setting.lastModified)}</span>
                </div>
                
                <h3 style={styles.settingName}>{setting.name}</h3>
                <p style={styles.settingValue}>{setting.value}</p>
                
                <div style={styles.settingDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Business:</span>
                    <span style={styles.detailValue}>{setting.business}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Modified By:</span>
                    <span style={styles.detailValue}>{setting.modifiedBy}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Last Modified:</span>
                    <span style={styles.detailValue}>{formatDate(setting.lastModified)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚙️</div>
            <h3 style={styles.emptyTitle}>No Settings Found</h3>
            <p style={styles.emptyText}>
              No system settings found for the selected filters.
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
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  settingCard: {
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
  settingHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  settingInfo: {
    flex: 1,
  },
  settingCategory: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
  },
  categoryIcon: {
    marginRight: '8px',
  },
  categoryName: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  settingDate: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  settingName: {
    fontSize: '1rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  settingValue: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  settingDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    marginRight: '8px',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
};

export default StaffmaSystemSettings; 