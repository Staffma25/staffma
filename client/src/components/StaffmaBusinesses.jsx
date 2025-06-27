import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBusinessActivities } from '../utils/api';

function StaffmaBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalActivities: 0,
    totalCriticalActivities: 0
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real business data from the API
        const response = await getBusinessActivities();
        setBusinesses(response.businesses || []);
        setStatistics(response.statistics || {
          totalBusinesses: 0,
          activeBusinesses: 0,
          totalActivities: 0,
          totalCriticalActivities: 0
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setError('Failed to fetch businesses: ' + error.message);
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [getToken]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading businesses...</div>
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
        <h1 style={styles.title}>Business Overview</h1>
        <p style={styles.subtitle}>Monitor all registered businesses</p>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{statistics.totalBusinesses}</div>
          <div style={styles.statLabel}>Total Businesses</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{statistics.activeBusinesses}</div>
          <div style={styles.statLabel}>Active Businesses</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{statistics.totalActivities}</div>
          <div style={styles.statLabel}>Total Activities</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{statistics.totalCriticalActivities}</div>
          <div style={styles.statLabel}>Critical Activities</div>
        </div>
      </div>

      <div style={styles.content}>
        {businesses.length > 0 ? (
          <div style={styles.businessesGrid}>
            {businesses.map((business) => (
              <div key={business._id} style={styles.businessCard}>
                <div style={styles.businessHeader}>
                  <h3 style={styles.businessName}>{business.businessName}</h3>
                  <span style={business.totalActivities > 0 ? styles.statusActive : styles.statusInactive}>
                    {business.totalActivities > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p style={styles.businessEmail}>{business.email}</p>
                <div style={styles.businessStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Activities:</span>
                    <span style={styles.statValue}>{business.totalActivities}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Recent (24h):</span>
                    <span style={styles.statValue}>{business.recentActivitiesCount}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Critical:</span>
                    <span style={styles.statValue}>{business.criticalActivitiesCount}</span>
                  </div>
                  {business.lastActivity && (
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Last Activity:</span>
                      <span style={styles.statValue}>{formatDate(business.lastActivity)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏢</div>
            <h3 style={styles.emptyTitle}>No Businesses Found</h3>
            <p style={styles.emptyText}>
              No businesses have been registered yet.
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
  businessesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  businessCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '20px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  statCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '20px',
    backgroundColor: '#fafbfc',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  statLabel: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  businessHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  businessName: {
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  businessEmail: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  businessStats: {
    marginTop: '10px',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  statLabel: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statusActive: {
    backgroundColor: '#dff0d8',
    color: '#468847',
    padding: '2px 5px',
    borderRadius: '4px',
  },
  statusInactive: {
    backgroundColor: '#f2dede',
    color: '#b94a48',
    padding: '2px 5px',
    borderRadius: '4px',
  },
};

export default StaffmaBusinesses; 