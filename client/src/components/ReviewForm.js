import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewForm = ({ onSubmitSuccess, onCancel }) => {
  const [employees, setEmployees] = useState([]);
  const [review, setReview] = useState({
    employeeId: '',
    reviewerName: '',
    rating: '',
    comments: '',
    goals: [{ description: '', status: 'pending' }],
    strengths: [''],
    areasForImprovement: [''],
    trainingRecommendations: ['']
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

  const handleAddField = (field) => {
    setReview(prev => ({
      ...prev,
      [field]: field === 'goals' 
        ? [...prev[field], { description: '', status: 'pending' }]
        : [...prev[field], '']
    }));
  };

  const handleRemoveField = (field, index) => {
    setReview(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleFieldChange = (field, index, value, subfield = null) => {
    setReview(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => {
        if (i === index) {
          return subfield ? { ...item, [subfield]: value } : value;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.employeeId) {
      alert('Please select an employee to review');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/employees/${review.employeeId}/performance-reviews`,
        {
          employeeId: review.employeeId,
          reviewerName: review.reviewerName,
          rating: review.rating,
          comments: review.comments,
          goals: review.goals.filter(goal => goal.description.trim() !== ''),
          strengths: review.strengths.filter(strength => strength.trim() !== ''),
          areasForImprovement: review.areasForImprovement.filter(area => area.trim() !== ''),
          trainingRecommendations: review.trainingRecommendations.filter(rec => rec.trim() !== '')
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      onSubmitSuccess(response.data);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`Failed to submit review: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div style={styles.formHeader}>
          <h2>New Performance Review</h2>
          <button type="button" onClick={onCancel} style={styles.closeButton}>×</button>
        </div>

        {/* Employee Selection */}
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

        {/* Rest of your existing form fields */}
        <div style={styles.formSection}>
          <label style={styles.label}>Rating (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={review.rating}
            onChange={(e) => setReview({ ...review, rating: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formSection}>
          <label style={styles.label}>Comments</label>
          <textarea
            value={review.comments}
            onChange={(e) => setReview({ ...review, comments: e.target.value })}
            style={styles.textarea}
            required
          />
        </div>

        {/* Goals Section */}
        <div style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <label style={styles.label}>Goals</label>
            <button type="button" onClick={() => handleAddField('goals')} style={styles.addButton}>
              Add Goal
            </button>
          </div>
          {review.goals.map((goal, index) => (
            <div key={index} style={styles.fieldGroup}>
              <input
                type="text"
                placeholder="Goal description"
                value={goal.description}
                onChange={(e) => handleFieldChange('goals', index, e.target.value, 'description')}
                style={{ ...styles.input, flex: 2 }}
              />
              <select
                value={goal.status}
                onChange={(e) => handleFieldChange('goals', index, e.target.value, 'status')}
                style={styles.select}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField('goals', index)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Strengths Section */}
        <div style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <label style={styles.label}>Strengths</label>
            <button type="button" onClick={() => handleAddField('strengths')} style={styles.addButton}>
              Add Strength
            </button>
          </div>
          {review.strengths.map((strength, index) => (
            <div key={index} style={styles.fieldGroup}>
              <input
                type="text"
                placeholder="Strength"
                value={strength}
                onChange={(e) => handleFieldChange('strengths', index, e.target.value)}
                style={styles.input}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField('strengths', index)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Areas for Improvement Section */}
        <div style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <label style={styles.label}>Areas for Improvement</label>
            <button
              type="button"
              onClick={() => handleAddField('areasForImprovement')}
              style={styles.addButton}
            >
              Add Area
            </button>
          </div>
          {review.areasForImprovement.map((area, index) => (
            <div key={index} style={styles.fieldGroup}>
              <input
                type="text"
                placeholder="Area for improvement"
                value={area}
                onChange={(e) => handleFieldChange('areasForImprovement', index, e.target.value)}
                style={styles.input}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField('areasForImprovement', index)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Training Recommendations Section */}
        <div style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <label style={styles.label}>Training Recommendations</label>
            <button
              type="button"
              onClick={() => handleAddField('trainingRecommendations')}
              style={styles.addButton}
            >
              Add Recommendation
            </button>
          </div>
          {review.trainingRecommendations.map((recommendation, index) => (
            <div key={index} style={styles.fieldGroup}>
              <input
                type="text"
                placeholder="Training recommendation"
                value={recommendation}
                onChange={(e) => handleFieldChange('trainingRecommendations', index, e.target.value)}
                style={styles.input}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField('trainingRecommendations', index)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              )}
            </div>
          ))}
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
  );
};

const styles = {
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
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
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  select: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minHeight: '100px',
    fontSize: '14px',
  },
  fieldGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeButton: {
    padding: '0 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
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
