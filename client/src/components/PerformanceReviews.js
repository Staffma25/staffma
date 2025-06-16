// client/src/components/PerformanceReviews.js
// client/src/components/PerformanceReviews.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedReview, setSelectedReview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, [selectedYear, selectedQuarter]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5001/api/performance-reviews/performance-reviews?year=${selectedYear}&quarter=${selectedQuarter}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setReviews(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
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

  const quarterDates = getQuarterDates(selectedYear, selectedQuarter);

  const handleViewReview = (review) => {
    setSelectedReview(review);
  };

  const handleCloseReview = () => {
    setSelectedReview(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Performance Reviews</h1>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.select}
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Quarter:</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(Number(e.target.value))}
            style={styles.select}
          >
            {[1, 2, 3, 4].map(quarter => (
              <option key={quarter} value={quarter}>Q{quarter}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.periodInfo}>
        <h3 style={styles.periodInfoTitle}>Q{selectedQuarter} {selectedYear} Review Period</h3>
        <p style={styles.periodInfoText}>{quarterDates.start} - {quarterDates.end}</p>
      </div>

      {selectedReview && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Q{selectedReview.quarter} {selectedReview.year} Performance Review</h2>
              <button onClick={handleCloseReview} style={styles.closeButton}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.reviewSection}>
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> {selectedReview.employeeId?.firstName} {selectedReview.employeeId?.lastName}</p>
                <p><strong>Review Date:</strong> {new Date(selectedReview.reviewDate).toLocaleDateString()}</p>
                <p><strong>Reviewer:</strong> {selectedReview.reviewerName}</p>
                <p><strong>Overall Rating:</strong> {selectedReview.overallRating}/5</p>
              </div>

              <div style={styles.reviewSection}>
                <h3>Performance Metrics</h3>
                <div style={styles.metricsGrid}>
                  {selectedReview.performanceMetrics?.map((metric, index) => (
                    <div key={index} style={styles.metricItem}>
                      <p><strong>{metric.category}:</strong> {metric.rating}/5</p>
                      {metric.comments && <p><em>{metric.comments}</em></p>}
                    </div>
                  ))}
                </div>
              </div>

              {selectedReview.goals?.length > 0 && (
                <div style={styles.reviewSection}>
                  <h3>Goals</h3>
                  <ul style={styles.list}>
                    {selectedReview.goals.map((goal, index) => (
                      <li key={index} style={styles.listItem}>
                        {typeof goal === 'object' ? goal.description : goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.strengths?.length > 0 && (
                <div style={styles.reviewSection}>
                  <h3>Strengths</h3>
                  <ul style={styles.list}>
                    {selectedReview.strengths.map((strength, index) => (
                      <li key={index} style={styles.listItem}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.areasForImprovement?.length > 0 && (
                <div style={styles.reviewSection}>
                  <h3>Areas for Improvement</h3>
                  <ul style={styles.list}>
                    {selectedReview.areasForImprovement.map((area, index) => (
                      <li key={index} style={styles.listItem}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.trainingRecommendations?.length > 0 && (
                <div style={styles.reviewSection}>
                  <h3>Training Recommendations</h3>
                  <ul style={styles.list}>
                    {selectedReview.trainingRecommendations.map((rec, index) => (
                      <li key={index} style={styles.listItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.reviewsContainer}>
        <h2 style={styles.subtitle}>Q{selectedQuarter} {selectedYear} Review History</h2>
        {loading ? (
          <div style={styles.loading}>Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Review Date</th>
                  <th style={styles.th}>Overall Rating</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review._id}>
                    <td style={styles.td}>
                      {review.employeeId?.firstName} {review.employeeId?.lastName}
                    </td>
                    <td style={styles.td}>
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      {review.overallRating}/5
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(review.status)}>
                        {review.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleViewReview(review)}
                        style={styles.actionButton}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noReviews}>No performance reviews available for Q{selectedQuarter} {selectedYear}</p>
        )}
      </div>
    </div>
  );
}

const getStatusStyle = (status) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  backgroundColor: 
    status === 'draft' ? '#ffd700' :
    status === 'submitted' ? '#90EE90' :
    status === 'acknowledged' ? '#87CEEB' : '#f0f0f0',
  color: '#333'
});

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    width: '95%',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontWeight: '500',
    color: '#333',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  periodInfo: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  periodInfoTitle: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  periodInfoText: {
    margin: 0,
    color: '#666',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#333',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    color: '#333',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
  noReviews: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
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
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '1400px',
    width: '95%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  reviewSection: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  metricItem: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  listItemLast: {
    borderBottom: 'none',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
};

export default PerformanceReviews;