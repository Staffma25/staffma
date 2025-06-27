import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function StaffmaLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

        // Simulate API call - replace with actual API
        setTimeout(() => {
          setLogs([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setError('Failed to fetch system logs');
        setLoading(false);
      }
    };

    fetchLogs();
  }, [getToken]);

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
        <p style={styles.subtitle}>System and application logs</p>
      </div>

      <div style={styles.content}>
        {logs.length > 0 ? (
          <div style={styles.logsList}>
            {logs.map((log) => (
              <div key={log.id} style={styles.logCard}>
                <h3>{log.title}</h3>
                <p>{log.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h3 style={styles.emptyTitle}>No System Logs</h3>
            <p style={styles.emptyText}>
              No system logs are available yet.
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
};

export default StaffmaLogs; 