import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PERFORMANCE_CATEGORIES = [
  'Quality of Work',
  'Productivity',
  'Communication',
  'Teamwork',
  'Initiative',
  'Problem Solving'
];

const ReviewForm = ({ onSubmitSuccess, onCancel, year, quarter }) => {
  const [employees, setEmployees] = useState([]);
  const [review, setReview] = useState({
    employeeId: '',
    reviewerName: '',
    year: year,
    quarter: quarter,
    overallRating: '',
    performanceMetrics: PERFORMANCE_CATEGORIES.map(category => ({
      category,
    rating: '',
      comments: ''
    })),
    goals: '',
    strengths: '',
    areasForImprovement: '',
    trainingRecommendations: ''
  });

  // Fetch employees when component mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const handleMetricChange = (index, field, value) => {
    setReview(prev => ({
      ...prev,
      performanceMetrics: prev.performanceMetrics.map((metric, i) => {
        if (i === index) {
          return { ...metric, [field]: value };
        }
        return metric;
      })
    }));
  };

  const calculateOverallRating = () => {
    const validRatings = review.performanceMetrics
      .map(metric => metric.rating)
      .filter(rating => rating !== '');
    
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((acc, curr) => acc + Number(curr), 0);
    return Math.round(sum / validRatings.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.employeeId) {
      alert('Please select an employee to review');
      return;
    }
    
    const overallRating = calculateOverallRating();
    if (overallRating === 0) {
      alert('Please provide ratings for at least one performance metric');
      return;
    }
    
      const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post(
        `http://localhost:5001/api/performance-reviews/employees/${review.employeeId}/performance-reviews`,
        {
          ...review,
          goals: review.goals.split('\n').filter(goal => goal.trim()),
          strengths: review.strengths.split('\n').filter(strength => strength.trim()),
          areasForImprovement: review.areasForImprovement.split('\n').filter(area => area.trim()),
          trainingRecommendations: review.trainingRecommendations.split('\n').filter(rec => rec.trim()),
          overallRating,
          reviewDate: new Date(),
          status: 'draft'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      onSubmitSuccess(response.data);
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        const shouldUpdate = window.confirm(
          'A review already exists for this employee in Q' + review.quarter + ' ' + review.year + 
          '. Would you like to update the existing review instead?'
        );
        
        if (shouldUpdate) {
          try {
            // First, get the existing review ID
            const getResponse = await axios.get(
              `http://localhost:5001/api/performance-reviews/performance-reviews?year=${review.year}&quarter=${review.quarter}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            const existingReview = getResponse.data.find(r => r.employeeId === review.employeeId);
            if (existingReview) {
              // Update the existing review
              const updateResponse = await axios.put(
                `http://localhost:5001/api/performance-reviews/performance-reviews/${existingReview._id}`,
                {
                  ...review,
                  goals: review.goals.split('\n').filter(goal => goal.trim()),
                  strengths: review.strengths.split('\n').filter(strength => strength.trim()),
                  areasForImprovement: review.areasForImprovement.split('\n').filter(area => area.trim()),
                  trainingRecommendations: review.trainingRecommendations.split('\n').filter(rec => rec.trim()),
                  overallRating,
                  reviewDate: new Date(),
                  status: 'draft'
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              onSubmitSuccess(updateResponse.data);
              return;
            }
          } catch (updateError) {
            console.error('Error updating review:', updateError);
            alert('Failed to update the existing review. Please try again.');
            return;
          }
        } else {
          alert('Please select a different quarter or employee for the new review.');
          return;
        }
      }
      alert(`Failed to submit review: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
      <form onSubmit={handleSubmit}>
        <div style={styles.formHeader}>
            <h2>New Performance Review - Q{quarter} {year}</h2>
          <button type="button" onClick={onCancel} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Select Employee to Review</label>
          <select
            value={review.employeeId}
            onChange={(e) => setReview({ ...review, employeeId: e.target.value })}
            style={styles.select}
            required
          >
            <option value="">Choose an employee...</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Reviewer Name</label>
          <input
            type="text"
            value={review.reviewerName}
            onChange={(e) => setReview({ ...review, reviewerName: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Performance Metrics</h3>
            {review.performanceMetrics.map((metric, index) => (
              <div key={index} style={styles.metricContainer}>
                <div style={styles.metricHeader}>
                  <h4 style={styles.metricTitle}>{metric.category}</h4>
                </div>
                <div style={styles.metricContent}>
                  <div style={styles.ratingContainer}>
                    <label style={styles.label}>Rating (1-5):</label>
          <input
            type="number"
            min="1"
            max="5"
                      value={metric.rating}
                      onChange={(e) => handleMetricChange(index, 'rating', e.target.value)}
            style={styles.input}
            required
          />
        </div>
                  <div style={styles.commentsContainer}>
                    <label style={styles.label}>Comments:</label>
          <textarea
                      value={metric.comments}
                      onChange={(e) => handleMetricChange(index, 'comments', e.target.value)}
            style={styles.textarea}
                      placeholder={`Enter comments about ${metric.category.toLowerCase()}`}
          />
        </div>
          </div>
            </div>
          ))}
        </div>

        <div style={styles.formSection}>
            <label style={styles.label}>Goals (one per line)</label>
            <textarea
              value={review.goals}
              onChange={(e) => setReview({ ...review, goals: e.target.value })}
              style={styles.textarea}
              placeholder="Enter goals, one per line"
            />
          </div>

          <div style={styles.formSection}>
            <label style={styles.label}>Strengths (one per line)</label>
            <textarea
              value={review.strengths}
              onChange={(e) => setReview({ ...review, strengths: e.target.value })}
              style={styles.textarea}
              placeholder="Enter strengths, one per line"
            />
        </div>

        <div style={styles.formSection}>
            <label style={styles.label}>Areas for Improvement (one per line)</label>
            <textarea
              value={review.areasForImprovement}
              onChange={(e) => setReview({ ...review, areasForImprovement: e.target.value })}
              style={styles.textarea}
              placeholder="Enter areas for improvement, one per line"
            />
        </div>

        <div style={styles.formSection}>
            <label style={styles.label}>Training Recommendations (one per line)</label>
            <textarea
              value={review.trainingRecommendations}
              onChange={(e) => setReview({ ...review, trainingRecommendations: e.target.value })}
              style={styles.textarea}
              placeholder="Enter training recommendations, one per line"
            />
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={styles.submitButton}>
            Submit Review
          </button>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

const styles = {
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
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  formSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    color: '#333',
    fontSize: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minHeight: '100px',
    fontSize: '14px',
    resize: 'vertical',
  },
  metricContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  metricHeader: {
    marginBottom: '12px',
  },
  metricTitle: {
    margin: 0,
    color: '#333',
    fontSize: '16px',
  },
  metricContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '12px',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  commentsContainer: {
    flex: 1,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default ReviewForm;
