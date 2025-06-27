import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivitySummary, getBusinessActivities } from '../utils/api';

function StaffmaInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalActivities: 0,
    activitiesByCategory: {},
    activitiesBySeverity: {},
    uniqueBusinesses: 0,
    uniqueUsers: 0
  });
  const [businessStats, setBusinessStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalActivities: 0,
    totalCriticalActivities: 0
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real data from APIs
        const [summaryResponse, businessResponse] = await Promise.all([
          getActivitySummary(),
          getBusinessActivities()
        ]);

        setSummary(summaryResponse || {
          totalActivities: 0,
          activitiesByCategory: {},
          activitiesBySeverity: {},
          uniqueBusinesses: 0,
          uniqueUsers: 0
        });

        setBusinessStats(businessResponse?.statistics || {
          totalBusinesses: 0,
          activeBusinesses: 0,
          totalActivities: 0,
          totalCriticalActivities: 0
        });

        // Generate insights from the data
        const generatedInsights = [];

        // Activity insights
        if (summaryResponse?.totalActivities > 0) {
          generatedInsights.push({
            id: 1,
            title: 'High Activity Period',
            type: 'activity',
            description: `System has recorded ${summaryResponse.totalActivities} total activities`,
            severity: summaryResponse.totalActivities > 1000 ? 'high' : 'medium',
            data: summaryResponse.totalActivities
          });
        }

        // Business insights
        if (businessResponse?.statistics) {
          const activeRate = businessResponse.statistics.totalBusinesses > 0 
            ? (businessResponse.statistics.activeBusinesses / businessResponse.statistics.totalBusinesses) * 100 
            : 0;
          
          generatedInsights.push({
            id: 2,
            title: 'Business Engagement',
            type: 'business',
            description: `${Math.round(activeRate)}% of businesses are actively using the system`,
            severity: activeRate > 70 ? 'low' : activeRate > 40 ? 'medium' : 'high',
            data: activeRate
          });
        }

        // Critical activities insight
        if (businessResponse?.statistics?.totalCriticalActivities > 0) {
          generatedInsights.push({
            id: 3,
            title: 'Critical Activities Alert',
            type: 'security',
            description: `${businessResponse.statistics.totalCriticalActivities} critical activities detected`,
            severity: 'high',
            data: businessResponse.statistics.totalCriticalActivities
          });
        }

        // Category insights
        if (summaryResponse?.activitiesByCategory) {
          const topCategory = Object.entries(summaryResponse.activitiesByCategory)
            .sort(([,a], [,b]) => b - a)[0];
          
          if (topCategory) {
            generatedInsights.push({
              id: 4,
              title: 'Most Active Category',
              type: 'category',
              description: `${topCategory[0]} is the most active category with ${topCategory[1]} activities`,
              severity: 'medium',
              data: topCategory[1]
            });
          }
        }

        setInsights(generatedInsights);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to fetch insights: ' + error.message);
        setLoading(false);
      }
    };

    fetchInsights();
  }, [getToken]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'activity': return '📊';
      case 'business': return '🏢';
      case 'security': return '🔒';
      case 'category': return '📈';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading insights...</div>
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
        <h1 style={styles.title}>System Insights</h1>
        <p style={styles.subtitle}>AI-powered insights and analytics</p>
      </div>

      <div style={styles.content}>
        {insights.length > 0 ? (
          <div style={styles.insightsGrid}>
            {insights.map((insight) => (
              <div key={insight.id} style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <div style={styles.insightIcon}>{getInsightIcon(insight.type)}</div>
                  <div style={styles.insightTitle}>
                    <h3 style={styles.insightName}>{insight.title}</h3>
                    <span style={styles.insightType}>{insight.type}</span>
                  </div>
                  <span 
                    style={styles.severityBadge} 
                    style={{ backgroundColor: getSeverityColor(insight.severity) }}
                  >
                    {insight.severity.toUpperCase()}
                  </span>
                </div>
                
                <p style={styles.insightDescription}>{insight.description}</p>
                
                <div style={styles.insightData}>
                  <span style={styles.dataValue}>{insight.data}</span>
                  {insight.type === 'business' && <span style={styles.dataUnit}>%</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💡</div>
            <h3 style={styles.emptyTitle}>No Insights Available</h3>
            <p style={styles.emptyText}>
              No insights have been generated yet. Check back later for AI-powered analytics.
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
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  insightCard: {
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
  insightHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  insightIcon: {
    fontSize: '1.5rem',
    marginRight: '10px',
  },
  insightTitle: {
    flex: 1,
  },
  insightName: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  insightType: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  severityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.875rem',
  },
  insightDescription: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: '0 0 10px 0',
  },
  insightData: {
    display: 'flex',
    alignItems: 'center',
  },
  dataValue: {
    fontSize: '1rem',
    color: '#2c3e50',
  },
  dataUnit: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    marginLeft: '5px',
  },
};

export default StaffmaInsights; 