import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StaffmaLayout = ({ children }) => {
  const [expandedSections, setExpandedSections] = useState({
    monitoring: true,
    administration: true,
    analytics: true,
    system: true
  });

  const navigate = useNavigate();
  const { logout, getCurrentUser } = useAuth();
  const user = getCurrentUser('staffma');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    logout('staffma');
    navigate('/staffma/login');
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>Staffma</h2>
          <p style={styles.userInfo}>
            {user?.firstName} {user?.lastName}
            <br />
            <span style={styles.userRole}>System Administrator</span>
          </p>
        </div>
        
        <nav style={styles.nav}>
          <a href="/staffma/dashboard" style={styles.navItem}>
            <span style={styles.icon}>📊</span>
            Dashboard
          </a>
          
          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('monitoring')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>👁️</span>
              Monitoring
              <span style={{
                ...styles.arrow,
                transform: expandedSections.monitoring ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.monitoring ? 'flex' : 'none'
            }}>
              <a href="/staffma/activities" style={styles.navSubItem}>Activity Logs</a>
              <a href="/staffma/businesses" style={styles.navSubItem}>Business Overview</a>
              <a href="/staffma/alerts" style={styles.navSubItem}>System Alerts</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('administration')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>⚙️</span>
              Administration
              <span style={{
                ...styles.arrow,
                transform: expandedSections.administration ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.administration ? 'flex' : 'none'
            }}>
              <a href="/staffma/users" style={styles.navSubItem}>User Management</a>
              <a href="/staffma/businesses/manage" style={styles.navSubItem}>Business Management</a>
              <a href="/staffma/system-settings" style={styles.navSubItem}>System Settings</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('analytics')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>📈</span>
              Analytics
              <span style={{
                ...styles.arrow,
                transform: expandedSections.analytics ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.analytics ? 'flex' : 'none'
            }}>
              <a href="/staffma/reports" style={styles.navSubItem}>Reports</a>
              <a href="/staffma/insights" style={styles.navSubItem}>Insights</a>
              <a href="/staffma/performance" style={styles.navSubItem}>Performance Metrics</a>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button 
              onClick={() => toggleSection('system')} 
              style={styles.navGroupHeader}
            >
              <span style={styles.icon}>🔧</span>
              System
              <span style={{
                ...styles.arrow,
                transform: expandedSections.system ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>▼</span>
            </button>
            <div style={{
              ...styles.subItems,
              display: expandedSections.system ? 'flex' : 'none'
            }}>
              <a href="/staffma/backups" style={styles.navSubItem}>Backups</a>
              <a href="/staffma/logs" style={styles.navSubItem}>System Logs</a>
              <a href="/staffma/maintenance" style={styles.navSubItem}>Maintenance</a>
            </div>
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.icon}>🚪</span>
            Logout
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#2c3e50',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #34495e',
    textAlign: 'center'
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#ecf0f1'
  },
  userInfo: {
    fontSize: '0.9rem',
    margin: 0,
    color: '#bdc3c7'
  },
  userRole: {
    fontSize: '0.8rem',
    color: '#95a5a6'
  },
  nav: {
    flex: 1,
    padding: '20px 0'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'background-color 0.3s',
    borderLeft: '3px solid transparent'
  },
  navItemHover: {
    backgroundColor: '#34495e',
    borderLeftColor: '#3498db'
  },
  navGroup: {
    marginBottom: '10px'
  },
  navGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ecf0f1',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    borderLeft: '3px solid transparent'
  },
  navGroupHeaderHover: {
    backgroundColor: '#34495e',
    borderLeftColor: '#3498db'
  },
  subItems: {
    flexDirection: 'column',
    backgroundColor: '#34495e'
  },
  navSubItem: {
    display: 'block',
    padding: '8px 20px 8px 50px',
    color: '#bdc3c7',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s'
  },
  navSubItemHover: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1'
  },
  icon: {
    marginRight: '10px',
    fontSize: '1.1rem'
  },
  arrow: {
    fontSize: '0.8rem',
    transition: 'transform 0.3s'
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid #34495e'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  logoutButtonHover: {
    backgroundColor: '#c0392b'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  }
};

export default StaffmaLayout; 