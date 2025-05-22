// client/src/components/PerformanceReviews.js
// client/src/components/PerformanceReviews.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewForm from './ReviewForm';

function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/performance-reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReviews(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Performance Reviews</h1>
        <button onClick={() => setShowReviewForm(true)} style={styles.addButton}>
          Add New Review
        </button>
      </div>

      {showReviewForm && (
        <ReviewForm
          onSubmitSuccess={(newReview) => {
            setReviews([...reviews, newReview]);
            setShowReviewForm(false);
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      <div style={styles.reviewsContainer}>
        <h2 style={styles.subtitle}>Review History</h2>
        {loading ? (
          <div style={styles.loading}>Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div style={styles.reviewsGrid}>
            {reviews.map(review => (
              <div key={review._id} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <h3 style={styles.employeeName}>
                    {review.employeeId?.firstName} {review.employeeId?.lastName}
                  </h3>
                  <span style={styles.reviewDate}>
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.reviewContent}>
                  <p><strong>Rating:</strong> {review.rating}/5</p>
                  <p><strong>Reviewer:</strong> {review.reviewerName}</p>
                  <p><strong>Comments:</strong> {review.comments}</p>
                  
                  {review.goals?.length > 0 && (
                    <div style={styles.section}>
                      <strong>Goals:</strong>
                      <ul>
                        {review.goals.map((goal, index) => (
                          <li key={index}>
                            {goal.description} - {goal.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.strengths?.length > 0 && (
                    <div style={styles.section}>
                      <strong>Strengths:</strong>
                      <ul>
                        {review.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.areasForImprovement?.length > 0 && (
                    <div style={styles.section}>
                      <strong>Areas for Improvement:</strong>
                      <ul>
                        {review.areasForImprovement.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.trainingRecommendations?.length > 0 && (
                    <div style={styles.section}>
                      <strong>Training Recommendations:</strong>
                      <ul>
                        {review.trainingRecommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noReviews}>No performance reviews available</p>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  reviewsContainer: {
    marginTop: '30px',
  },
  subtitle: {
    marginBottom: '20px',
    color: '#333',
  },
  reviewsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  employeeName: {
    margin: 0,
    color: '#333',
    fontSize: '18px',
  },
  reviewDate: {
    color: '#666',
    fontSize: '14px',
  },
  reviewContent: {
    '& p': {
      margin: '8px 0',
    },
  },
  section: {
    marginTop: '15px',
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
};

export default PerformanceReviews;