import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { login, setBusinessUser } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    applicantName: '',
    contactNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.businessName || !formData.email || !formData.password || !formData.applicantName) {
        console.log('Missing required fields:', {
          businessName: !formData.businessName,
          email: !formData.email,
          password: !formData.password,
          applicantName: !formData.applicantName
        });
        setError('Business name, applicant name, email and password are required');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Create request body
      const registrationData = {
        businessName: formData.businessName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        applicantName: formData.applicantName.trim(),
        contactNumber: formData.contactNumber ? formData.contactNumber.trim() : '',
        businessType: 'sole', // Default to sole proprietorship
        applicantRole: '', // Empty since we removed this field
        businessAddress: '' // Empty since we removed this field
      };

      console.log('Attempting registration with data:', {
        ...registrationData,
        password: '[HIDDEN]'
      });

      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Registration failed');
      }

      // Registration successful - navigate to subscription selection
      console.log('Registration successful, navigating to subscription selection...');
      
      // Navigate to subscription page with business data
      navigate('/subscription', { 
        state: { 
          businessData: {
            businessName: formData.businessName,
            email: formData.email,
            businessType: 'sole',
            applicantName: formData.applicantName,
            applicantRole: '',
            businessAddress: '',
            contactNumber: formData.contactNumber
          }
        },
        replace: true 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>Create Business Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Business Details */}
          <input
            style={styles.input}
            type="text"
            placeholder="Business Name *"
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            required
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Applicant Name *"
            value={formData.applicantName}
            onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
            required
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Contact Number"
            value={formData.contactNumber}
            onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
          />

          <input
            style={styles.input}
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input
            style={styles.input}
            type="password"
            placeholder="Password *"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />

          <button 
            type="submit" 
            style={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/')} 
            style={styles.backButton}
          >
            ← Back to Home
          </button>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <span 
              onClick={() => navigate('/login')} 
              style={styles.footerLink}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '500px',
    margin: '20px',
  },
  title: {
    marginBottom: '2rem',
    color: '#1a365d',
    fontSize: '2rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  input: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    width: '100%',
    '&:focus': {
      outline: 'none',
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
    },
  },
  submitBtn: {
    padding: '0.8rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#3182ce',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: '#a0aec0',
      cursor: 'not-allowed',
    },
  },
  error: {
    color: '#e53e3e',
    marginBottom: '1.2rem',
    padding: '0.8rem',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    fontSize: '0.9rem',
    border: '1px solid #feb2b2',
  },
  footer: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#4a5568',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      color: '#2d3748',
    },
  },
  footerText: {
    color: '#4a5568',
    fontSize: '0.9rem',
  },
  footerLink: {
    color: '#4299e1',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    '&:hover': {
      color: '#3182ce',
      textDecoration: 'underline',
    },
  },
};

export default Register;