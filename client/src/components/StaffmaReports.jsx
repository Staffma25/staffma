import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActivitySummary, getBusinessActivities } from '../utils/api';

function StaffmaReports() {
  const [reports, setReports] = useState([]);
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
    const fetchReports = async () => {
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

        // Generate reports from the data
        const generatedReports = [
          {
            id: 1,
            title: 'Activity Summary Report',
            type: 'summary',
            data: summaryResponse,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Business Activity Report',
            type: 'business',
            data: businessResponse,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 3,
            title: 'System Health Report',
            type: 'health',
            data: {
              totalBusinesses: businessResponse?.statistics?.totalBusinesses || 0,
              activeBusinesses: businessResponse?.statistics?.activeBusinesses || 0,
              criticalActivities: businessResponse?.statistics?.totalCriticalActivities || 0
            },
            lastUpdated: new Date().toISOString()
          }
        ];

        setReports(generatedReports);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to fetch reports: ' + error.message);
        setLoading(false);
      }
    };

    fetchReports();
  }, [getToken]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const generateReportData = (report) => {
    switch (report.type) {
      case 'summary':
        return (
          <div style={styles.reportData}>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Total Activities:</span>
              <span style={styles.dataValue}>{report.data.totalActivities}</span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Unique Businesses:</span>
              <span style={styles.dataValue}>{report.data.uniqueBusinesses}</span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Unique Users:</span>
              <span style={styles.dataValue}>{report.data.uniqueUsers}</span>
            </div>
          </div>
        );
      case 'business':
        return (
          <div style={styles.reportData}>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Total Businesses:</span>
              <span style={styles.dataValue}>{report.data.statistics?.totalBusinesses}</span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Active Businesses:</span>
              <span style={styles.dataValue}>{report.data.statistics?.activeBusinesses}</span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Total Activities:</span>
              <span style={styles.dataValue}>{report.data.statistics?.totalActivities}</span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Critical Activities:</span>
              <span style={styles.dataValue}>{report.data.statistics?.totalCriticalActivities}</span>
            </div>
          </div>
        );
      case 'health':
        return (
          <div style={styles.reportData}>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>System Status:</span>
              <span style={styles.dataValue}>
                {report.data.criticalActivities > 0 ? '⚠️ Attention Needed' : '✅ Healthy'}
              </span>
            </div>
            <div style={styles.dataItem}>
              <span style={styles.dataLabel}>Active Rate:</span>
              <span style={styles.dataValue}>
                {report.data.totalBusinesses > 0 
                  ? `${Math.round((report.data.activeBusinesses / report.data.totalBusinesses) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        );
      default:
        return <div>No data available</div>;
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading reports...</div>
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
        <h1 style={styles.title}>System Reports</h1>
        <p style={styles.subtitle}>Comprehensive system analytics and reports</p>
      </div>

      <div style={styles.content}>
        {reports.length > 0 ? (
          <div style={styles.reportsGrid}>
            {reports.map((report) => (
              <div key={report.id} style={styles.reportCard}>
                <div style={styles.reportHeader}>
                  <h3 style={styles.reportTitle}>{report.title}</h3>
                  <span style={styles.reportType}>{report.type}</span>
                </div>
                
                {generateReportData(report)}
                
                <div style={styles.reportFooter}>
                  <span style={styles.reportDate}>
                    Last updated: {formatDate(report.lastUpdated)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <h3 style={styles.emptyTitle}>No Reports Available</h3>
            <p style={styles.emptyText}>
              No reports have been generated yet.
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
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  reportCard: {
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
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  reportTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: 0,
  },
  reportType: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    margin: 0,
  },
  reportData: {
    marginBottom: '10px',
  },
  dataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  dataLabel: {
    fontWeight: 'bold',
  },
  dataValue: {
    marginLeft: '10px',
  },
  reportFooter: {
    textAlign: 'right',
  },
  reportDate: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
};

export default StaffmaReports; 