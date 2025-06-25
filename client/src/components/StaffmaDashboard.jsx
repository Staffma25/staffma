import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivities, getActivitySummary, getBusinessActivities, getBusinessDetails } from '../utils/api';

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
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [selectedPayrollData, setSelectedPayrollData] = useState(null);
  const [payrollDetailsLoading, setPayrollDetailsLoading] = useState(false);
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
      const response = await getBusinessDetails(businessId, filters, abortController?.signal);
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

  const handleViewPayrollDetails = async (year, month) => {
    try {
      console.log('=== handleViewPayrollDetails called ===');
      console.log('Parameters:', { year, month, selectedBusiness });
      console.log('Current modal state:', { payrollModalOpen, payrollDetailsLoading, selectedPayrollData });
      
      setPayrollDetailsLoading(true);
      setPayrollModalOpen(true);
      
      console.log('Modal state after setting:', { payrollModalOpen: true, payrollDetailsLoading: true });
      
      const token = getToken('staffma');
      if (!token) {
        console.log('No token found, logging out');
        logout('staffma');
        navigate('/staffma/login');
        return;
      }

      const url = `${API_BASE_URL}/activities/business/${selectedBusiness}/payroll/${year}/${month}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payroll details');
      }

      const data = await response.json();
      console.log('Payroll details data received:', data);
      setSelectedPayrollData(data);
      console.log('Modal state after setting data:', { payrollModalOpen: true, payrollDetailsLoading: false, selectedPayrollData: data });
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      setError(error.message);
    } finally {
      setPayrollDetailsLoading(false);
      console.log('Final modal state:', { payrollModalOpen: true, payrollDetailsLoading: false });
    }
  };

  const closePayrollModal = () => {
    setPayrollModalOpen(false);
    setSelectedPayrollData(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) return <div style={styles.loading}>Loading Staffma Dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  // Loading state for business details
  if (selectedBusiness && !businessDetails) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={handleBackToOverview}>
              ← Back to Dashboard
            </button>
            <h1 style={styles.title}>Loading Business Details...</h1>
            <p style={styles.subtitle}>Please wait while we fetch the business information</p>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div style={styles.loading}>Loading business details...</div>
      </div>
    );
  }

  // Business Details View
  if (selectedBusiness && businessDetails) {
    console.log('Rendering business details view. Modal state:', { payrollModalOpen, payrollDetailsLoading, selectedPayrollData });
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={handleBackToOverview}>
              ← Back to Dashboard
            </button>
            <h1 style={styles.title}>{businessDetails.business?.businessName || 'Business Details'}</h1>
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
                <div style={styles.businessStatIcon}>👥</div>
                <div style={styles.businessStatContent}>
                  <span style={styles.businessStatValue}>{businessDetails.statistics?.employeeCount || 0}</span>
                  <span style={styles.businessStatLabel}>Total Employees</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>👤</div>
                <div style={styles.businessStatContent}>
                  <span style={styles.businessStatValue}>{businessDetails.statistics?.userCount || 0}</span>
                  <span style={styles.businessStatLabel}>Total Users</span>
                </div>
              </div>
              <div style={styles.businessStatCard}>
                <div style={styles.businessStatIcon}>✅</div>
                <div style={styles.businessStatContent}>
                  <span style={styles.businessStatValue}>{businessDetails.statistics?.activeUserCount || 0}</span>
                  <span style={styles.businessStatLabel}>Active Users</span>
                </div>
              </div>
                </div>
              </div>

          {/* Payroll Overview */}
          <div style={styles.payrollOverviewSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>💰</span>
              Payroll Overview
            </h2>
            {(() => {
              // Debug logging
              console.log('Business Details:', businessDetails);
              console.log('Payroll Stats:', businessDetails.statistics?.payrollStats);
              
              const payrollStats = businessDetails.statistics?.payrollStats || {};
              const totalPayrollRecords = payrollStats.totalPayrollRecords || 0;
              const totalNetPaid = payrollStats.totalPaidAmount || 0;
              const totalGrossAmount = payrollStats.totalGrossAmount || 0;
              const totalAllowances = payrollStats.totalAllowances || 0;
              const totalDeductions = payrollStats.totalDeductions || 0;
              
              console.log('Payroll Overview Values:', {
                totalPayrollRecords,
                totalNetPaid,
                totalGrossAmount,
                totalAllowances,
                totalDeductions
              });
              
              // Show fallback if no payroll data
              if (totalPayrollRecords === 0) {
                return (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>💰</div>
                    <h3 style={styles.emptyStateTitle}>No Payroll Data Available</h3>
                    <p style={styles.emptyStateText}>
                      This business hasn't processed any payroll records yet.
                    </p>
                  </div>
                );
              }
              
              return (
                <div style={styles.payrollOverviewGrid}>
                  <div style={styles.payrollOverviewCard}>
                    <div style={styles.payrollOverviewIcon}>📊</div>
                    <div style={styles.payrollOverviewContent}>
                      <span style={styles.payrollOverviewValue}>{totalPayrollRecords}</span>
                      <span style={styles.payrollOverviewLabel}>Payroll Records</span>
                    </div>
                  </div>
                  <div style={styles.payrollOverviewCard}>
                    <div style={styles.payrollOverviewIcon}>💵</div>
                    <div style={styles.payrollOverviewContent}>
                      <span style={styles.payrollOverviewValue}>${totalNetPaid.toLocaleString()}</span>
                      <span style={styles.payrollOverviewLabel}>Net Paid</span>
                    </div>
                  </div>
                  <div style={styles.payrollOverviewCard}>
                    <div style={styles.payrollOverviewIcon}>📈</div>
                    <div style={styles.payrollOverviewContent}>
                      <span style={styles.payrollOverviewValue}>${totalGrossAmount.toLocaleString()}</span>
                      <span style={styles.payrollOverviewLabel}>Gross Amount</span>
                    </div>
                  </div>
                  <div style={styles.payrollOverviewCard}>
                    <div style={styles.payrollOverviewIcon}>➕</div>
                    <div style={styles.payrollOverviewContent}>
                      <span style={styles.payrollOverviewValue}>${totalAllowances.toLocaleString()}</span>
                      <span style={styles.payrollOverviewLabel}>Allowances</span>
                    </div>
                  </div>
                  <div style={styles.payrollOverviewCard}>
                    <div style={styles.payrollOverviewIcon}>➖</div>
                    <div style={styles.payrollOverviewContent}>
                      <span style={styles.payrollOverviewValue}>${totalDeductions.toLocaleString()}</span>
                      <span style={styles.payrollOverviewLabel}>Deductions</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Payroll History Chart */}
          {businessDetails.payrollHistory && businessDetails.payrollHistory.length > 0 && (
            <div style={styles.payrollHistorySection}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.icon}>📊</span>
                Payroll History (Last 12 Months)
              </h2>
              <div style={styles.payrollHistoryTableContainer}>
                <table style={styles.payrollHistoryTable}>
                  <thead>
                    <tr style={styles.payrollHistoryTableHeader}>
                      <th style={styles.payrollHistoryTableHeaderCell}>Period</th>
                      <th style={styles.payrollHistoryTableHeaderCell}>Total Net Salary</th>
                      <th style={styles.payrollHistoryTableHeaderCell}>Total Gross Salary</th>
                      <th style={styles.payrollHistoryTableHeaderCell}>Employees</th>
                      <th style={styles.payrollHistoryTableHeaderCell}>Average Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessDetails.payrollHistory.map((record, index) => (
                      <tr key={index} style={styles.payrollHistoryTableRow}>
                        <td style={styles.payrollHistoryTableCell}>
                          <span style={styles.payrollHistoryPeriod}>
                            {new Date(record._id.year, record._id.month - 1).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </td>
                        <td style={styles.payrollHistoryTableValue}>
                          <span style={styles.payrollHistoryValue}>
                            ${record.totalNetSalary.toLocaleString()}
                          </span>
                        </td>
                        <td style={styles.payrollHistoryTableValue}>
                          <span style={styles.payrollHistoryValue}>
                            ${record.totalGrossSalary.toLocaleString()}
                          </span>
                        </td>
                        <td style={styles.payrollHistoryTableValue}>
                          <span style={styles.payrollHistoryValue}>
                            {record.employeeCount}
                          </span>
                        </td>
                        <td style={styles.payrollHistoryTableValue}>
                          <span style={styles.payrollHistoryValue}>
                            ${record.averageSalary.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Employees */}
          {businessDetails.recentEmployees && businessDetails.recentEmployees.length > 0 && (
            <div style={styles.recentEmployeesSection}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.icon}>👥</span>
                All Employees
              </h2>
              <div style={styles.recentEmployeesTableContainer}>
                <table style={styles.recentEmployeesTable}>
                  <thead>
                    <tr style={styles.recentEmployeesTableHeader}>
                      <th style={styles.recentEmployeesTableHeaderCell}>Employee Name</th>
                      <th style={styles.recentEmployeesTableHeaderCell}>Position</th>
                      <th style={styles.recentEmployeesTableHeaderCell}>Department</th>
                      <th style={styles.recentEmployeesTableHeaderCell}>Employee ID</th>
                      <th style={styles.recentEmployeesTableHeaderCell}>Start Date</th>
                      <th style={styles.recentEmployeesTableHeaderCell}>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessDetails.recentEmployees.map((employee) => (
                      <tr key={employee._id} style={styles.recentEmployeesTableRow}>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeeName}>
                            {employee.firstName} {employee.lastName}
                          </span>
                        </td>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeePosition}>
                            {employee.position}
                          </span>
                        </td>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeeDepartment}>
                            {employee.department}
                          </span>
                        </td>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeeNumber}>
                            #{employee.employeeNumber}
                          </span>
                        </td>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeeStartDate}>
                            {formatDate(employee.startDate)}
                          </span>
                        </td>
                        <td style={styles.recentEmployeesTableCell}>
                          <span style={styles.recentEmployeeAdded}>
                            {formatRelativeTime(employee.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
          )}

          {/* Business Activities */}
          <div style={styles.activitiesSection}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>📋</span>
              Recent Activities
            </h2>
            <div style={styles.activitiesList}>
              {businessDetails.activities && businessDetails.activities.length > 0 ? (
                businessDetails.activities.map((activity) => (
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
          <div style={styles.businessesTableContainer}>
            <table style={styles.businessesTable}>
              <thead>
                <tr style={styles.businessesTableHeader}>
                  <th style={styles.businessesTableHeaderCell}>Business Name</th>
                  <th style={styles.businessesTableHeaderCell}>Email</th>
                  <th style={styles.businessesTableHeaderCell}>Status</th>
                  <th style={styles.businessesTableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
            {dashboardData.businessActivities.businesses.length > 0 ? (
              dashboardData.businessActivities.businesses.map((business) => (
                    <tr key={business._id} style={styles.businessesTableRow}>
                      <td style={styles.businessesTableCell}>
                        <span style={styles.businessName}>{business.businessName}</span>
                      </td>
                      <td style={styles.businessesTableCell}>
                      <span style={styles.businessEmail}>{business.email}</span>
                      </td>
                      <td style={styles.businessesTableCell}>
                      {business.totalActivities > 0 ? (
                        <span style={styles.statusActive}>Active</span>
                      ) : (
                        <span style={styles.statusInactive}>Inactive</span>
                      )}
                      </td>
                      <td style={styles.businessesTableCell}>
                        <button 
                          style={styles.viewDetailsButton}
                          onClick={() => handleBusinessSelect(business._id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
              ))
            ) : (
                  <tr style={styles.businessesTableRow}>
                    <td colSpan="4" style={styles.emptyStateCell}>
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>🏢</div>
                <h3 style={styles.emptyStateTitle}>No Businesses Found</h3>
                <p style={styles.emptyStateText}>
                  There are no registered businesses in the system yet.
                </p>
              </div>
                    </td>
                  </tr>
            )}
              </tbody>
            </table>
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

      {/* Place the modal here so it is always available */}
      {payrollModalOpen && (
        <div style={styles.modalOverlay} onClick={closePayrollModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Monthly Payroll Details
                {selectedPayrollData && (
                  <span style={styles.modalSubtitle}>
                    {businessDetails?.business?.businessName || 'Business'} - {getMonthName(selectedPayrollData.payrollDetails[0]?.month || 1)} {selectedPayrollData.payrollDetails[0]?.year || new Date().getFullYear()}
                  </span>
                )}
              </h2>
              <button style={styles.modalCloseButton} onClick={closePayrollModal}>
                ✕
              </button>
            </div>
            {payrollDetailsLoading ? (
              <div style={styles.modalLoading}>Loading payroll details...</div>
            ) : selectedPayrollData ? (
              <div style={styles.modalBody}>
                {/* Summary Cards */}
                <div style={styles.modalSummaryGrid}>
                  <div style={styles.modalSummaryCard}>
                    <div style={styles.modalSummaryIcon}>👥</div>
                    <div style={styles.modalSummaryContent}>
                      <span style={styles.modalSummaryValue}>{selectedPayrollData.payrollDetails.length}</span>
                      <span style={styles.modalSummaryLabel}>Total Employees</span>
                    </div>
                  </div>
                  <div style={styles.modalSummaryCard}>
                    <div style={styles.modalSummaryIcon}>💰</div>
                    <div style={styles.modalSummaryContent}>
                      <span style={styles.modalSummaryValue}>
                        {formatCurrency(selectedPayrollData.payrollDetails.reduce((sum, record) => sum + (record.grossSalary || 0), 0))}
                      </span>
                      <span style={styles.modalSummaryLabel}>Total Gross Salary</span>
                    </div>
                  </div>
                  <div style={styles.modalSummaryCard}>
                    <div style={styles.modalSummaryIcon}>💵</div>
                    <div style={styles.modalSummaryContent}>
                      <span style={styles.modalSummaryValue}>
                        {formatCurrency(selectedPayrollData.payrollDetails.reduce((sum, record) => sum + (record.netSalary || 0), 0))}
                      </span>
                      <span style={styles.modalSummaryLabel}>Total Net Salary</span>
                    </div>
                  </div>
                  <div style={styles.modalSummaryCard}>
                    <div style={styles.modalSummaryIcon}>➕</div>
                    <div style={styles.modalSummaryContent}>
                      <span style={styles.modalSummaryValue}>
                        {formatCurrency(selectedPayrollData.payrollDetails.reduce((sum, record) => sum + (record.allowances?.total || 0), 0))}
                      </span>
                      <span style={styles.modalSummaryLabel}>Total Allowances</span>
                    </div>
                  </div>
                  <div style={styles.modalSummaryCard}>
                    <div style={styles.modalSummaryIcon}>➖</div>
                    <div style={styles.modalSummaryContent}>
                      <span style={styles.modalSummaryValue}>
                        {formatCurrency(selectedPayrollData.payrollDetails.reduce((sum, record) => sum + (record.deductions?.total || 0), 0))}
                      </span>
                      <span style={styles.modalSummaryLabel}>Total Deductions</span>
                    </div>
                  </div>
                </div>
                {/* Payroll Details Table */}
                <div style={styles.modalTableContainer}>
                  <h3 style={styles.modalTableTitle}>Employee Payroll Details</h3>
                  {selectedPayrollData.payrollDetails.length === 0 ? (
                    <div style={styles.modalEmptyState}>
                      <div style={styles.modalEmptyStateIcon}>📊</div>
                      <h4 style={styles.modalEmptyStateTitle}>No Payroll Data Available</h4>
                      <p style={styles.modalEmptyStateText}>
                        No payroll records found for this month.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.modalTableWrapper}>
                      <table style={styles.modalTable}>
                        <thead>
                          <tr style={styles.modalTableHeader}>
                            <th style={styles.modalTableHeaderCell}>Employee</th>
                            <th style={styles.modalTableHeaderCell}>Employee #</th>
                            <th style={styles.modalTableHeaderCell}>Position</th>
                            <th style={styles.modalTableHeaderCell}>Department</th>
                            <th style={styles.modalTableHeaderCell}>Basic Salary</th>
                            <th style={styles.modalTableHeaderCell}>Allowances</th>
                            <th style={styles.modalTableHeaderCell}>Gross Salary</th>
                            <th style={styles.modalTableHeaderCell}>Deductions</th>
                            <th style={styles.modalTableHeaderCell}>Net Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPayrollData.payrollDetails.map((record) => (
                            <tr key={record._id} style={styles.modalTableRow}>
                              <td style={styles.modalTableCell}>
                                <div style={styles.modalEmployeeInfo}>
                                  <span style={styles.modalEmployeeName}>
                                    {record.employeeId?.firstName} {record.employeeId?.lastName}
                                  </span>
                                </div>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalEmployeeNumber}>
                                  #{record.employeeNumber}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalEmployeePosition}>
                                  {record.employeeId?.position}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalEmployeeDepartment}>
                                  {record.employeeId?.department}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalSalaryValue}>
                                  {formatCurrency(record.basicSalary)}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalSalaryValue}>
                                  {formatCurrency(record.allowances?.total)}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalSalaryValue}>
                                  {formatCurrency(record.grossSalary)}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalSalaryValue}>
                                  {formatCurrency(record.deductions?.total)}
                                </span>
                              </td>
                              <td style={styles.modalTableCell}>
                                <span style={styles.modalNetSalaryValue}>
                                  {formatCurrency(record.netSalary)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.modalError}>Failed to load payroll details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '4px 0 0 0',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px -1px rgba(239, 68, 68, 0.3)',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px -2px rgba(239, 68, 68, 0.4)'
    }
  },
  overviewGrid: {
    display: 'grid',
    gap: '20px'
  },
  quickStats: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f1f5f9'
  },
  icon: {
    fontSize: '1.125rem',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  statCard: {
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px -3px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
      borderRadius: '8px 8px 0 0'
    }
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '10px 0 4px 0',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    display: 'block',
    marginTop: '4px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  businessesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  businessesTableContainer: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white'
  },
  businessesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem'
  },
  businessesTableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  businessesTableHeaderCell: {
    padding: '10px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  businessesTableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f9fafb'
    },
    '&:nth-child(even)': {
      backgroundColor: '#fafbfc'
    }
  },
  businessesTableCell: {
    padding: '10px 8px',
    textAlign: 'left',
    verticalAlign: 'middle'
  },
  businessName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.3'
  },
  businessEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
    fontStyle: 'italic'
  },
  statusActive: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)'
  },
  statusInactive: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    boxShadow: '0 1px 2px rgba(107, 114, 128, 0.3)'
  },
  viewDetailsButton: {
    padding: '6px 12px',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#475569',
      transform: 'translateY(-1px)'
    }
  },
  eyeIconButton: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    minHeight: '28px',
    '&:hover': {
      backgroundColor: '#e2e8f0',
      borderColor: '#3b82f6',
      transform: 'scale(1.05)',
      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
    },
    '&:active': {
      transform: 'scale(0.95)'
    }
  },
  testModalButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    outline: 'inherit',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#1976d2',
    textDecoration: 'underline',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#1565c0'
    }
  },
  testButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '2px 6px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '10px',
    marginLeft: '6px'
  },
  recentActivitiesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  recentActivitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  recentActivityCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(2px)',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
      borderColor: '#3b82f6'
    }
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  activityTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.3'
  },
  severityBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  activityDescription: {
    color: '#475569',
    marginBottom: '10px',
    lineHeight: '1.4',
    fontSize: '0.75rem'
  },
  activityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  activityTime: {
    fontSize: '0.625rem',
    color: '#94a3b8',
    fontWeight: '500'
  },
  activityUser: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
    fontStyle: 'italic'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40vh',
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '500'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '15px',
    borderRadius: '6px',
    margin: '15px 0',
    border: '1px solid #fecaca',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  backButton: {
    padding: '8px 12px',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginRight: '10px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#475569',
      transform: 'translateY(-1px)'
    }
  },
  businessDetailsContainer: {
    padding: '15px'
  },
  businessOverviewSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  businessStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px'
  },
  businessStatCard: {
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px -3px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
      borderRadius: '8px 8px 0 0'
    }
  },
  businessStatIcon: {
    fontSize: '1.75rem',
    marginBottom: '8px',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  },
  businessStatContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  businessStatValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  businessStatLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  activityMetaLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  activityEmployee: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  activitiesSection: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activityCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(2px)',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
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
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  activityDetails: {
    marginTop: '6px'
  },
  detailsElement: {
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '6px',
    backgroundColor: '#fafbfc'
  },
  detailsSummary: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer'
  },
  detailsContent: {
    marginTop: '6px',
    fontSize: '0.75rem',
    color: '#475569'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    borderRadius: '8px',
    border: '1px dashed #e2e8f0',
    backgroundColor: '#fafbfc',
    textAlign: 'center',
    gridColumn: '1 / -1'
  },
  emptyStateIcon: {
    fontSize: '2.5rem',
    color: '#94a3b8',
    marginBottom: '12px',
    opacity: '0.7'
  },
  emptyStateTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px'
  },
  emptyStateText: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: '1.4',
    maxWidth: '300px'
  },
  payrollOverviewSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  payrollOverviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '15px'
  },
  payrollOverviewCard: {
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
      borderRadius: '6px 6px 0 0'
    }
  },
  payrollOverviewIcon: {
    fontSize: '1.125rem',
    marginBottom: '4px',
    filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
  },
  payrollOverviewContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  payrollOverviewValue: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '2px',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
  },
  payrollOverviewLabel: {
    fontSize: '0.625rem',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.2px'
  },
  payrollHistorySection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  payrollHistoryTableContainer: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white'
  },
  payrollHistoryTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem'
  },
  payrollHistoryTableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  payrollHistoryTableHeaderCell: {
    padding: '8px 6px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  payrollHistoryTableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f9fafb'
    },
    '&:nth-child(even)': {
      backgroundColor: '#fafbfc'
    }
  },
  payrollHistoryTableCell: {
    padding: '8px 6px',
    textAlign: 'left',
    verticalAlign: 'middle'
  },
  payrollHistoryLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    outline: 'inherit',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#1976d2',
    textDecoration: 'underline',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#1565c0'
    }
  },
  payrollHistoryValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'monospace'
  },
  recentEmployeesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '20px'
  },
  recentEmployeesTableContainer: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white'
  },
  recentEmployeesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem'
  },
  recentEmployeesTableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  recentEmployeesTableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f9fafb'
    },
    '&:nth-child(even)': {
      backgroundColor: '#fafbfc'
    }
  },
  recentEmployeesTableCell: {
    padding: '8px 6px',
    textAlign: 'left',
    verticalAlign: 'middle'
  },
  recentEmployeeName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.3'
  },
  recentEmployeePosition: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  recentEmployeeDepartment: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  recentEmployeeNumber: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#10b981',
    margin: 0,
    lineHeight: '1.3'
  },
  recentEmployeeStartDate: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  recentEmployeeAdded: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  emptyStateCell: {
    padding: '30px 15px',
    textAlign: 'center'
  },
  payrollHistoryPeriod: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#374151'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '15px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '85vw',
    maxHeight: '85vh',
    width: '1000px',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  modalSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '400'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    }
  },
  modalBody: {
    padding: '20px',
    maxHeight: 'calc(85vh - 80px)',
    overflowY: 'auto'
  },
  modalLoading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '150px',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  modalError: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '150px',
    fontSize: '0.875rem',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },
  modalSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  modalSummaryCard: {
    background: 'white',
    padding: '12px',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #e5e7eb'
  },
  modalSummaryIcon: {
    fontSize: '1.125rem',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    backgroundColor: '#f0f8ff'
  },
  modalSummaryContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  modalSummaryValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '1px'
  },
  modalSummaryLabel: {
    fontSize: '0.625rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  modalTableContainer: {
    background: 'white',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  modalTableTitle: {
    margin: '0',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    borderBottom: '1px solid #e0e0e0'
  },
  modalTableWrapper: {
    overflowX: 'auto'
  },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem'
  },
  modalTableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0'
  },
  modalTableHeaderCell: {
    padding: '8px 6px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  modalTableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  modalTableCell: {
    padding: '8px 6px',
    verticalAlign: 'middle'
  },
  modalEmployeeInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  modalEmployeeName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '1px',
    fontSize: '0.75rem'
  },
  modalEmployeeNumber: {
    fontSize: '0.625rem',
    color: '#666',
    fontFamily: 'monospace'
  },
  modalEmployeePosition: {
    fontSize: '0.75rem',
    color: '#555'
  },
  modalEmployeeDepartment: {
    fontSize: '0.75rem',
    color: '#555'
  },
  modalSalaryValue: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#333',
    fontWeight: '500'
  },
  modalNetSalaryValue: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#1976d2',
    fontWeight: '600'
  },
  modalEmptyState: {
    textAlign: 'center',
    padding: '40px 15px'
  },
  modalEmptyStateIcon: {
    fontSize: '2rem',
    marginBottom: '12px'
  },
  modalEmptyStateTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px'
  },
  modalEmptyStateText: {
    fontSize: '0.75rem',
    color: '#666',
    maxWidth: '300px',
    margin: '0 auto'
  },
  debugInfo: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '8px',
    borderRadius: '4px',
    margin: '8px 0',
    border: '1px solid #fecaca',
    fontSize: '0.75rem',
    fontWeight: '500'
  }
};

export default StaffmaDashboard; 