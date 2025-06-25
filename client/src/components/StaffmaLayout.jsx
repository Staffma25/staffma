import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StaffmaLayout = ({ children }) => {
  const [expandedSections, setExpandedSections] = useState({
    monitoring: true,
    administration: true,
    analytics: true,
    system: true
  });

  const navigate = useNavigate();
  const location = useLocation();
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

  const getUserRoleDisplay = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'admin': return 'Administrator';
      case 'support': return 'Support Staff';
      default: return 'Staff Member';
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>Staffma</h2>
          <p style={styles.userInfo}>
            {user?.firstName} {user?.lastName}
            <br />
            <span style={styles.userRole}>{getUserRoleDisplay(user?.role)}</span>
          </p>
        </div>
        
        <nav style={styles.nav}>
          <Link 
            to="/staffma/dashboard" 
            style={{
              ...styles.navItem,
              ...(location.pathname === '/staffma/dashboard' ? styles.navItemActive : {})
            }}
          >
            <span style={styles.icon}>📊</span>
            Dashboard
          </Link>
          
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
              <Link 
                to="/staffma/activities" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/activities' ? styles.navSubItemActive : {})
                }}
              >
                Activity Logs
              </Link>
              <Link 
                to="/staffma/businesses" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/businesses' ? styles.navSubItemActive : {})
                }}
              >
                Business Overview
              </Link>
              <Link 
                to="/staffma/alerts" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/alerts' ? styles.navSubItemActive : {})
                }}
              >
                System Alerts
              </Link>
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
              <Link 
                to="/staffma/users" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/users' ? styles.navSubItemActive : {})
                }}
              >
                User Management
              </Link>
              <Link 
                to="/staffma/businesses/manage" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/businesses/manage' ? styles.navSubItemActive : {})
                }}
              >
                Business Management
              </Link>
              <Link 
                to="/staffma/system-settings" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/system-settings' ? styles.navSubItemActive : {})
                }}
              >
                System Settings
              </Link>
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
              <Link 
                to="/staffma/reports" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/reports' ? styles.navSubItemActive : {})
                }}
              >
                Reports
              </Link>
              <Link 
                to="/staffma/insights" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/insights' ? styles.navSubItemActive : {})
                }}
              >
                Insights
              </Link>
              <Link 
                to="/staffma/performance" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/performance' ? styles.navSubItemActive : {})
                }}
              >
                Performance Metrics
              </Link>
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
              <Link 
                to="/staffma/backups" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/backups' ? styles.navSubItemActive : {})
                }}
              >
                Backups
              </Link>
              <Link 
                to="/staffma/logs" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/logs' ? styles.navSubItemActive : {})
                }}
              >
                System Logs
              </Link>
              <Link 
                to="/staffma/maintenance" 
                style={{
                  ...styles.navSubItem,
                  ...(location.pathname === '/staffma/maintenance' ? styles.navSubItemActive : {})
                }}
              >
                Maintenance
              </Link>
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
    width: '220px',
    backgroundColor: '#2c3e50',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '1px 0 3px rgba(0,0,0,0.1)'
  },
  sidebarHeader: {
    padding: '12px 15px',
    borderBottom: '1px solid #34495e',
    textAlign: 'center'
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    margin: '0 0 6px 0',
    color: '#ecf0f1'
  },
  userInfo: {
    fontSize: '0.75rem',
    margin: 0,
    color: '#bdc3c7'
  },
  userRole: {
    fontSize: '0.625rem',
    color: '#95a5a6'
  },
  nav: {
    flex: 1,
    padding: '12px 0'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 15px',
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'background-color 0.3s',
    borderLeft: '2px solid transparent'
  },
  navItemActive: {
    backgroundColor: '#34495e',
    borderLeftColor: '#3498db',
    color: '#3498db'
  },
  navItemHover: {
    backgroundColor: '#34495e',
    borderLeftColor: '#3498db'
  },
  navGroup: {
    marginBottom: '6px'
  },
  navGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 15px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ecf0f1',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    borderLeft: '2px solid transparent'
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
    padding: '6px 15px 6px 35px',
    color: '#bdc3c7',
    textDecoration: 'none',
    fontSize: '0.75rem',
    transition: 'background-color 0.3s'
  },
  navSubItemActive: {
    backgroundColor: '#2c3e50',
    color: '#3498db',
    borderLeft: '2px solid #3498db'
  },
  navSubItemHover: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1'
  },
  icon: {
    marginRight: '8px',
    fontSize: '0.875rem'
  },
  arrow: {
    fontSize: '0.625rem',
    transition: 'transform 0.3s'
  },
  sidebarFooter: {
    padding: '12px 15px',
    borderTop: '1px solid #34495e'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  logoutButtonHover: {
    backgroundColor: '#c0392b'
  },
  content: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto'
  }
};

export default StaffmaLayout; 