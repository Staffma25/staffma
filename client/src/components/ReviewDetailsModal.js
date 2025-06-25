import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function ReviewDetailsModal({ review, onClose }) {
  const { getToken } = useAuth();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getQuarterDates = (year, quarter) => {
    const startMonths = [0, 3, 6, 9]; // January (0), April (3), July (6), October (9)
    const startDate = new Date(year, startMonths[quarter - 1], 1);
    const endDate = new Date(year, startMonths[quarter - 1] + 3, 0);
    return {
      start: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  };

  const quarterDates = getQuarterDates(review.year, review.quarter);

  return (
    <div style={styles.overlay} onClick={handleClose} className="modal-overlay">
      <div 
        style={{
          ...styles.modal,
          animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>Q{review.quarter} {review.year} Performance Review</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Employee Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.label}>Name:</span>
                <span style={styles.value}>{review.employeeId?.firstName} {review.employeeId?.lastName}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Review Date:</span>
                <span style={styles.value}>{new Date(review.reviewDate).toLocaleDateString()}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Reviewer:</span>
                <span style={styles.value}>{review.reviewerName}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Overall Rating:</span>
                <span style={styles.value}>{review.overallRating}/5</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Status:</span>
                <span style={getStatusStyle(review.status)}>{review.status}</span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Review Period</h3>
            <p style={styles.periodText}>{quarterDates.start} - {quarterDates.end}</p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Performance Metrics</h3>
            <div style={styles.metricsGrid}>
              {review.performanceMetrics?.map((metric, index) => (
                <div key={index} style={styles.metricCard}>
                  <div style={styles.metricHeader}>
                    <h4 style={styles.metricTitle}>{metric.category}</h4>
                    <span style={styles.rating}>{metric.rating}/5</span>
                  </div>
                  {metric.comments && (
                    <p style={styles.metricComments}>{metric.comments}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {review.goals?.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Goals</h3>
              <div style={styles.listContainer}>
                {review.goals.map((goal, index) => (
                  <div key={index} style={styles.listItem}>
                    <span style={styles.bullet}>•</span>
                    <span style={styles.listText}>
                      {typeof goal === 'object' ? goal.description : goal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {review.strengths?.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Strengths</h3>
              <div style={styles.listContainer}>
                {review.strengths.map((strength, index) => (
                  <div key={index} style={styles.listItem}>
                    <span style={styles.bullet}>•</span>
                    <span style={styles.listText}>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {review.areasForImprovement?.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Areas for Improvement</h3>
              <div style={styles.listContainer}>
                {review.areasForImprovement.map((area, index) => (
                  <div key={index} style={styles.listItem}>
                    <span style={styles.bullet}>•</span>
                    <span style={styles.listText}>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {review.trainingRecommendations?.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Training Recommendations</h3>
              <div style={styles.listContainer}>
                {review.trainingRecommendations.map((rec, index) => (
                  <div key={index} style={styles.listItem}>
                    <span style={styles.bullet}>•</span>
                    <span style={styles.listText}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getStatusStyle = (status) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: 
    status === 'draft' ? '#ffd700' :
    status === 'submitted' ? '#90EE90' :
    status === 'acknowledged' ? '#87CEEB' : '#f0f0f0',
  color: '#333'
});

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modal: {
    width: '450px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 10px 0',
    paddingBottom: '6px',
    borderBottom: '2px solid #e0e0e0',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  label: {
    fontWeight: '500',
    color: '#666',
    fontSize: '0.875rem',
  },
  value: {
    color: '#333',
    fontSize: '0.875rem',
  },
  periodText: {
    color: '#666',
    fontSize: '0.875rem',
    margin: 0,
    fontStyle: 'italic',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  metricTitle: {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#333',
  },
  rating: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  metricComments: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#666',
    fontStyle: 'italic',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '3px 0',
  },
  bullet: {
    color: '#007bff',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '1.4',
  },
  listText: {
    fontSize: '0.875rem',
    color: '#333',
    lineHeight: '1.4',
    flex: 1,
  },
};

export default ReviewDetailsModal; 