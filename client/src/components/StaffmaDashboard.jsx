import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, getActivitySummary, getBusinessActivities, getBusinessActivityDetails } from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function StaffmaDashboard() {
  const [dashboardData, setDashboardData] = useState({
    activities: [],
    summary: {
      totalActivities: 0,
      activitiesByCategory: {},
      activitiesBySeverity: {},
      recentActivities: []
    },
    businessActivities: {
      businesses: [],
      statistics: {
        totalBusinesses: 0,
        activeBusinesses: 0,
        totalActivities: 0,
        totalCriticalActivities: 0,
        recentActivities: []
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
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

      // Fetch activities, summary, and business activities
      const [activitiesResponse, summaryResponse, businessActivitiesResponse] = await Promise.all([
        getActivities(filters, abortController?.signal),
        getActivitySummary(abortController?.signal),
        getBusinessActivities(abortController?.signal)
      ]);
      
      if (!abortController?.signal.aborted) {
        console.log('Staffma dashboard data received:', { 
          activitiesResponse, 
          summaryResponse, 
          businessActivitiesResponse 
        });
        setDashboardData({
          activities: activitiesResponse.activities || [],
          summary: summaryResponse || {
            totalActivities: 0,
            activitiesByCategory: {},
            activitiesBySeverity: {},
            recentActivities: []
          },
          businessActivities: businessActivitiesResponse || {
            businesses: [],
            statistics: {
              totalBusinesses: 0,
              activeBusinesses: 0,
              totalActivities: 0,
              totalCriticalActivities: 0,
              recentActivities: []
            }
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

  const fetchBusinessDetails = useCallback(async (businessId, abortController) => {
    try {
      const response = await getBusinessActivityDetails(businessId, filters, abortController?.signal);
      if (!abortController?.signal.aborted) {
        setBusinessDetails(response);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !abortController?.signal.aborted) {
        console.error('Error fetching business details:', error);
        setError(error.message);
      }
    }
  }, [filters]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedBusiness) {
      const abortController = new AbortController();
      fetchBusinessDetails(selectedBusiness, abortController);
      return () => {
        abortController.abort();
      };
    }
  }, [selectedBusiness, fetchBusinessDetails]);

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

  const handleBusinessSelect = (businessId) => {
    setSelectedBusiness(businessId);
  };

  const handleBackToOverview = () => {
    setSelectedBusiness(null);
    setBusinessDetails(null);
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

  if (loading) return <div style={styles.loading}>Loading Staffma Dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  // Business Details View
  if (selectedBusiness) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={() => setSelectedBusiness(null)}>
              ← Back to Dashboard
            </button>
            <h1 style={styles.title}>{selectedBusiness.business.businessName}</h1>
            <p style={styles.subtitle}>Business Activity Details</p>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={styles.businessDetailsContainer}>
          {/* Business Overview Stats */}
          <div style={styles.businessOverviewSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>📊</span>
              Business Overview
            </h2>
            <div style={styles.businessStatsGrid}>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>📈</div>
                <div style={styles.businessStatContent}>
                  <span style={styles.businessStatValue}>{selectedBusiness.statistics.totalActivities}</span>
                  <span style={styles.businessStatLabel}>Total Activities</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>🚨</div>
                <div style={styles.businessStatContent}>
                  <span style={{ ...styles.businessStatValue, color: '#ef4444' }}>
                    {selectedBusiness.statistics.criticalActivities}
                  </span>
                  <span style={styles.businessStatLabel}>Critical</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>⚠️</div>
                <div style={styles.businessStatContent}>
                  <span style={{ ...styles.businessStatValue, color: '#f59e0b' }}>
                    {selectedBusiness.statistics.highActivities}
                  </span>
                  <span style={styles.businessStatLabel}>High Priority</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>ℹ️</div>
                <div style={styles.businessStatContent}>
                  <span style={{ ...styles.businessStatValue, color: '#3b82f6' }}>
                    {selectedBusiness.statistics.mediumActivities}
                  </span>
                  <span style={styles.businessStatLabel}>Medium</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>✅</div>
                <div style={styles.businessStatContent}>
                  <span style={{ ...styles.businessStatValue, color: '#10b981' }}>
                    {selectedBusiness.statistics.lowActivities}
                  </span>
                  <span style={styles.businessStatLabel}>Low</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Activities */}
          <div style={styles.activitiesSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>📋</span>
              Recent Activities
            </h2>
            <div style={styles.activitiesList}>
              {selectedBusiness.activities.length > 0 ? (
                selectedBusiness.activities.map((activity) => (
                  <div key={activity._id} style={styles.activityCard}>
                    <div style={styles.activityHeader}>
                      <div style={styles.activityTitleSection}>
                        <h4 style={styles.activityTitle}>{activity.title}</h4>
                        <span style={styles.activityCategory}>{activity.category}</span>
                      </div>
                      <span style={{
                        ...styles.severityBadge,
                        backgroundColor: getSeverityColor(activity.severity)
                      }}>
                        {activity.severity}
                      </span>
                    </div>
                    <p style={styles.activityDescription}>{activity.description}</p>
                    <div style={styles.activityMeta}>
                      <div style={styles.activityMetaLeft}>
                        {activity.userId && (
                          <span style={styles.activityUser}>
                            👤 {activity.userId.firstName} {activity.userId.lastName}
                          </span>
                        )}
                        {activity.employeeId && (
                          <span style={styles.activityEmployee}>
                            👨‍💼 Employee: {activity.employeeId.firstName} {activity.employeeId.lastName}
                          </span>
                        )}
                      </div>
                      <span style={styles.activityTime}>
                        🕒 {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div style={styles.activityDetails}>
                        <details style={styles.detailsElement}>
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
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>📭</div>
                  <h3 style={styles.emptyStateTitle}>No Activities Found</h3>
                  <p style={styles.emptyStateText}>
                    This business hasn't recorded any activities yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard overview
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
              <h3>Total Businesses</h3>
              <p style={styles.statValue}>
                {dashboardData.businessActivities.statistics.totalBusinesses || 0}
                <span style={styles.statLabel}>Registered</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Active Businesses</h3>
              <p style={styles.statValue}>
                {dashboardData.businessActivities.statistics.activeBusinesses || 0}
                <span style={styles.statLabel}>With Activities</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Total Activities</h3>
              <p style={styles.statValue}>
                {dashboardData.businessActivities.statistics.totalActivities || 0}
                <span style={styles.statLabel}>Tracked</span>
              </p>
            </div>
            <div style={styles.statCard}>
              <h3>Critical Issues</h3>
              <p style={styles.statValue}>
                {dashboardData.businessActivities.statistics.totalCriticalActivities || 0}
                <span style={styles.statLabel}>Require Attention</span>
              </p>
            </div>
          </div>
        </div>

        {/* Business Activities Overview */}
        <div style={styles.businessesSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>🏢</span>
            Business Activities Overview
          </h2>
          <div style={styles.businessesGrid}>
            {dashboardData.businessActivities.businesses.length > 0 ? (
              dashboardData.businessActivities.businesses.map((business) => (
                <div 
                  key={business._id} 
                  style={styles.businessCard}
                  onClick={() => handleBusinessSelect(business._id)}
                >
                  <div style={styles.businessHeader}>
                    <div>
                      <h3 style={styles.businessName}>{business.businessName}</h3>
                      <span style={styles.businessEmail}>{business.email}</span>
                    </div>
                    <div style={styles.businessStatus}>
                      {business.totalActivities > 0 ? (
                        <span style={styles.statusActive}>Active</span>
                      ) : (
                        <span style={styles.statusInactive}>Inactive</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.businessStats}>
                    <div style={styles.businessStat}>
                      <span style={styles.statNumber}>{business.totalActivities}</span>
                      <span style={styles.statLabel}>Total Activities</span>
                    </div>
                    <div style={styles.businessStat}>
                      <span style={styles.statNumber}>{business.recentActivitiesCount}</span>
                      <span style={styles.statLabel}>Recent (24h)</span>
                    </div>
                    <div style={styles.businessStat}>
                      <span style={{ ...styles.statNumber, color: business.criticalActivitiesCount > 0 ? '#ef4444' : '#10b981' }}>
                        {business.criticalActivitiesCount}
                      </span>
                      <span style={styles.statLabel}>Critical</span>
                    </div>
                  </div>
                  {business.lastActivity && (
                    <div style={styles.lastActivity}>
                      <span style={styles.lastActivityIcon}>🕒</span>
                      Last Activity: {formatRelativeTime(business.lastActivity)}
                    </div>
                  )}
                  {business.totalActivities === 0 && (
                    <div style={styles.noActivity}>
                      <span style={styles.noActivityIcon}>📭</span>
                      No activities recorded yet
                    </div>
                  )}
                  <div style={styles.viewDetails}>
                    <span style={styles.viewDetailsText}>Click to view details</span>
                    <span style={styles.viewDetailsArrow}>→</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>🏢</div>
                <h3 style={styles.emptyStateTitle}>No Businesses Found</h3>
                <p style={styles.emptyStateText}>
                  There are no registered businesses in the system yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities Across All Businesses */}
        <div style={styles.recentActivitiesSection}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>🕒</span>
            Recent Activities (All Businesses)
          </h2>
          <div style={styles.recentActivitiesList}>
            {dashboardData.businessActivities.statistics.recentActivities.length > 0 ? (
              dashboardData.businessActivities.statistics.recentActivities.map((activity) => (
                <div key={activity._id} style={styles.recentActivityCard}>
                  <div style={styles.activityHeader}>
                    <h4 style={styles.activityTitle}>{activity.title}</h4>
                    <span style={{
                      ...styles.severityBadge,
                      backgroundColor: getSeverityColor(activity.severity)
                    }}>
                      {activity.severity}
                    </span>
                  </div>
                  <p style={styles.activityDescription}>{activity.description}</p>
                  <div style={styles.activityMeta}>
                    <span style={styles.businessName}>
                      🏢 {activity.businessId?.businessName || 'Unknown Business'}
                    </span>
                    <span style={styles.activityTime}>
                      🕒 {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  {activity.userId && (
                    <p style={styles.activityUser}>
                      👤 By: {activity.userId.firstName} {activity.userId.lastName}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📋</div>
                <h3 style={styles.emptyStateTitle}>No Recent Activities</h3>
                <p style={styles.emptyStateText}>
                  No activities have been recorded in the last 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '25px 30px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    margin: '8px 0 0 0',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '12px 24px',
    backgroundColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 15px -3px rgba(239, 68, 68, 0.4)'
    }
  },
  overviewGrid: {
    display: 'grid',
    gap: '30px'
  },
  quickStats: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f1f5f9'
  },
  icon: {
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px'
  },
  statCard: {
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
      borderRadius: '12px 12px 0 0'
    }
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '15px 0 8px 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
    display: 'block',
    marginTop: '8px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  businessesSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  businessesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '25px'
  },
  businessCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '25px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeInUp 0.6s ease-out',
    '&:hover': {
      transform: 'translateY(-6px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      borderColor: '#3b82f6'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
      borderRadius: '16px 16px 0 0'
    }
  },
  '@keyframes fadeInUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)'
    }
  },
  businessHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #f1f5f9'
  },
  businessName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.3'
  },
  businessEmail: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    fontStyle: 'italic'
  },
  businessStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px'
  },
  businessStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  lastActivity: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0 0 15px 0',
    padding: '8px 12px',
    backgroundColor: '#fef3c7',
    borderRadius: '6px',
    border: '1px solid #fde68a',
    textAlign: 'center'
  },
  viewDetails: {
    fontSize: '0.9rem',
    color: '#3b82f6',
    marginTop: '15px',
    textAlign: 'center',
    fontWeight: '600',
    padding: '10px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #dbeafe',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: '#dbeafe',
      transform: 'scale(1.02)',
      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
    }
  },
  recentActivitiesSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  recentActivitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  recentActivityCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderColor: '#3b82f6'
    }
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  activityTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.4'
  },
  severityBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  activityDescription: {
    color: '#475569',
    marginBottom: '15px',
    lineHeight: '1.6',
    fontSize: '0.9rem'
  },
  activityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  businessName: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
    padding: '4px 8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px'
  },
  activityTime: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: '500'
  },
  activityUser: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
    fontStyle: 'italic'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    fontSize: '1.2rem',
    color: '#64748b',
    fontWeight: '500'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '20px',
    borderRadius: '12px',
    margin: '20px 0',
    border: '1px solid #fecaca',
    fontSize: '1rem',
    fontWeight: '500'
  },
  backButton: {
    padding: '12px 20px',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginRight: '15px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#475569',
      transform: 'translateY(-2px)'
    }
  },
  businessDetailsContainer: {
    padding: '20px'
  },
  businessOverviewSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '30px'
  },
  businessStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  businessStatCard: {
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
      borderRadius: '12px 12px 0 0'
    }
  },
  businessStatIcon: {
    fontSize: '2.5rem',
    marginBottom: '15px',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
  },
  businessStatContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  businessStatValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '8px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  businessStatLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  activityMetaLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  activityEmployee: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  businessStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  statusActive: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
  },
  statusInactive: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(107, 114, 128, 0.3)'
  },
  activitiesSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  activityCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderColor: '#3b82f6'
    }
  },
  activityTitleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  activityCategory: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  activityDetails: {
    marginTop: '10px'
  },
  detailsElement: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#fafbfc'
  },
  detailsSummary: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer'
  },
  detailsContent: {
    marginTop: '10px',
    fontSize: '0.875rem',
    color: '#475569'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    borderRadius: '16px',
    border: '2px dashed #e2e8f0',
    backgroundColor: '#fafbfc',
    textAlign: 'center',
    gridColumn: '1 / -1'
  },
  emptyStateIcon: {
    fontSize: '4rem',
    color: '#94a3b8',
    marginBottom: '20px',
    opacity: '0.7'
  },
  emptyStateTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '10px'
  },
  emptyStateText: {
    fontSize: '1rem',
    color: '#64748b',
    lineHeight: '1.6',
    maxWidth: '400px'
  },
  viewDetailsText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#3b82f6'
  },
  viewDetailsArrow: {
    fontSize: '1rem',
    marginLeft: '8px',
    color: '#3b82f6',
    transition: 'transform 0.2s ease'
  },
  lastActivityIcon: {
    fontSize: '1rem',
    marginRight: '8px',
    opacity: '0.8'
  },
  noActivity: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0 0 15px 0',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  noActivityIcon: {
    fontSize: '1rem',
    marginRight: '8px',
    opacity: '0.7'
  }
};

export default StaffmaDashboard; 