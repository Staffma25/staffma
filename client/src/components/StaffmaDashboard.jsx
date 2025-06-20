import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, getActivitySummary } from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function StaffmaDashboard() {
  const [dashboardData, setDashboardData] = useState({
    activities: [],
    summary: {
      totalActivities: 0,
      activitiesByCategory: {},
      activitiesBySeverity: {},
      recentActivities: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getToken, logout, getCurrentUser } = useAuth();
  const user = getCurrentUser('staffma');
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: '',
    dateRange: '7d'
  });

  const fetchDashboardData = useCallback(async (abortController) => {
    try {
      const token = getToken('staffma');
      if (!token) {
        console.error('No Staffma authentication token found');
        navigate('/staffma/login');
        return;
      }

      // Fetch activities and summary
      const [activitiesResponse, summaryResponse] = await Promise.all([
        getActivities(filters, abortController?.signal),
        getActivitySummary(abortController?.signal)
      ]);
      
      if (!abortController?.signal.aborted) {
        console.log('Staffma dashboard data received:', { activitiesResponse, summaryResponse });
        setDashboardData({
          activities: activitiesResponse.activities || [],
          summary: summaryResponse || {
            totalActivities: 0,
            activitiesByCategory: {},
            activitiesBySeverity: {},
            recentActivities: []
          }
        });
        setLoading(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching Staffma dashboard data:', error);
        setError(error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('No authentication token found')) {
          logout('staffma');
          navigate('/staffma/login');
        }
      }
    }
  }, [navigate, getToken, logout, filters]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout('staffma');
    navigate('/staffma/login');
  };

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

  if (loading) return <div style={styles.loading}>Loading Staffma Dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Staffma Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {user?.firstName || 'Staffma User'}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* Dashboard Overview Grid */}
      <div style={styles.overviewGrid}>
        {/* Quick Stats */}
        <div style={styles.quickStats}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>📊</span>
            System Overview
          </h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Total Activities</h3>
              <p style={styles.statValue}>
                {dashboardData.summary.totalActivities || 0}
                <span style={styles.statLabel}>Tracked</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Critical Issues</h3>
              <p style={styles.statValue}>
                {dashboardData.summary.activitiesBySeverity?.critical || 0}
                <span style={styles.statLabel}>Require Attention</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Active Businesses</h3>
              <p style={styles.statValue}>
                {Object.keys(dashboardData.summary.activitiesByCategory || {}).length}
                <span style={styles.statLabel}>Monitored</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Recent Activities</h3>
              <p style={styles.statValue}>
                {dashboardData.summary.recentActivities?.length || 0}
                <span style={styles.statLabel}>Last 24h</span>
              </p>
            </div>
          </div>
        </div>

        {/* Activity Filters */}
        <div style={styles.filtersSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>🔍</span>
            Activity Filters
          </h2>
          <div style={styles.filtersGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Categories</option>
                <option value="employee_management">Employee Management</option>
                <option value="payroll_management">Payroll Management</option>
                <option value="leave_management">Leave Management</option>
                <option value="performance_management">Performance Management</option>
                <option value="user_management">User Management</option>
                <option value="system_administration">System Administration</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div style={styles.activitiesSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>📋</span>
            Recent Activities
          </h2>
          <div style={styles.activitiesList}>
            {dashboardData.activities.length > 0 ? (
              dashboardData.activities.map((activity) => (
                <div key={activity._id} style={styles.activityCard}>
                  <div style={styles.activityHeader}>
                    <h3 style={styles.activityTitle}>{activity.title}</h3>
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
                  <p style={styles.activityDescription}>{activity.description}</p>
                  <div style={styles.activityDetails}>
                    <span style={styles.activityDetail}>
                      <strong>Category:</strong> {activity.category.replace(/_/g, ' ')}
                    </span>
                    <span style={styles.activityDetail}>
                      <strong>Business:</strong> {activity.businessId}
                    </span>
                    <span style={styles.activityDetail}>
                      <strong>User:</strong> {activity.userId}
                    </span>
                    <span style={styles.activityDetail}>
                      <strong>Time:</strong> {formatDate(activity.timestamp)}
                    </span>
                  </div>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div style={styles.activityDetails}>
                      <details style={styles.details}>
                        <summary style={styles.detailsSummary}>View Details</summary>
                        <pre style={styles.detailsContent}>
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={styles.noActivities}>
                <p>No activities found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary Charts */}
        <div style={styles.chartsSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>📈</span>
            Activity Analytics
          </h2>
          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h3>Activities by Category</h3>
              <div style={styles.chartContent}>
                {Object.entries(dashboardData.summary.activitiesByCategory || {}).map(([category, count]) => (
                  <div key={category} style={styles.chartItem}>
                    <span style={styles.chartLabel}>{category.replace(/_/g, ' ')}</span>
                    <span style={styles.chartValue}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3>Activities by Severity</h3>
              <div style={styles.chartContent}>
                {Object.entries(dashboardData.summary.activitiesBySeverity || {}).map(([severity, count]) => (
                  <div key={severity} style={styles.chartItem}>
                    <span style={{
                      ...styles.severityIndicator,
                      backgroundColor: getSeverityColor(severity)
                    }}></span>
                    <span style={styles.chartLabel}>{severity}</span>
                    <span style={styles.chartValue}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e0e0e0'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
    margin: '5px 0 0 0'
  },
  logoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  overviewGrid: {
    display: 'grid',
    gap: '30px'
  },
  quickStats: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  icon: {
    fontSize: '1.2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e9ecef'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '10px 0 5px 0'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    display: 'block',
    marginTop: '5px'
  },
  filtersSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#333'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1rem'
  },
  activitiesSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  activityCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafafa'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  activityTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  activityMeta: {
    display: 'flex',
    gap: '10px'
  },
  severityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  activityDescription: {
    color: '#666',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  activityDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    fontSize: '0.9rem',
    color: '#555'
  },
  activityDetail: {
    backgroundColor: '#f0f0f0',
    padding: '5px 10px',
    borderRadius: '4px'
  },
  details: {
    marginTop: '10px'
  },
  detailsSummary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#007bff'
  },
  detailsContent: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    overflow: 'auto',
    marginTop: '5px'
  },
  noActivities: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  chartsSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  chartCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px'
  },
  chartContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  chartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  chartLabel: {
    fontSize: '0.9rem',
    color: '#333'
  },
  chartValue: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#007bff'
  },
  severityIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    fontSize: '1.2rem',
    color: '#666'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '5px',
    margin: '20px 0',
    border: '1px solid #ffcdd2'
  }
};

export default StaffmaDashboard; 