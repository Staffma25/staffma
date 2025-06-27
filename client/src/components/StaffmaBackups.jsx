import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function StaffmaBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

        // Simulate API call - replace with actual API
        setTimeout(() => {
          setBackups([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setError('Failed to fetch backups');
        setLoading(false);
      }
    };

    fetchBackups();
  }, [getToken]);

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
        <h1 style={styles.title}>Backups</h1>
        <p style={styles.subtitle}>System backup management</p>
      </div>

      <div style={styles.content}>
        {backups.length > 0 ? (
          <div style={styles.backupsList}>
            {backups.map((backup) => (
              <div key={backup.id} style={styles.backupCard}>
                <h3>{backup.name}</h3>
                <p>{backup.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💾</div>
            <h3 style={styles.emptyTitle}>No Backups Available</h3>
            <p style={styles.emptyText}>
              No system backups have been created yet.
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
};

export default StaffmaBackups; 