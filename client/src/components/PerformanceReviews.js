// client/src/components/PerformanceReviews.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewDetailsModal from './ReviewDetailsModal';
import { fetchWithAuth } from '../utils/auth';

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
      const response = await fetchWithAuth(
        `http://localhost:5001/api/performance-reviews/performance-reviews?year=${selectedYear}&quarter=${selectedQuarter}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reviews');
      }
      
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
        <ReviewDetailsModal 
          review={selectedReview} 
          onClose={handleCloseReview} 
        />
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
  padding: '3px 6px',
  borderRadius: '3px',
  fontSize: '0.75rem',
  fontWeight: '500',
  backgroundColor: 
    status === 'draft' ? '#ffd700' :
    status === 'submitted' ? '#90EE90' :
    status === 'acknowledged' ? '#87CEEB' : '#f0f0f0',
  color: '#333'
});

const styles = {
  container: {
    padding: '15px',
    maxWidth: '1400px',
    width: '95%',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '1.5rem',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontWeight: '500',
    color: '#333',
    fontSize: '0.875rem',
  },
  select: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.875rem',
  },
  periodInfo: {
    marginBottom: '15px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    textAlign: 'center',
  },
  periodInfoTitle: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '1rem',
  },
  periodInfoText: {
    margin: 0,
    color: '#666',
    fontSize: '0.875rem',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '10px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#333',
    fontSize: '0.75rem',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #dee2e6',
    color: '#333',
    fontSize: '0.75rem',
  },
  actionButton: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '15px',
    fontSize: '0.875rem',
  },
  noReviews: {
    textAlign: 'center',
    color: '#666',
    padding: '15px',
    fontSize: '0.875rem',
  },
  subtitle: {
    fontSize: '1.125rem',
    marginBottom: '15px',
    color: '#333',
  },
  reviewsContainer: {
    marginTop: '15px',
  },
};

export default PerformanceReviews;