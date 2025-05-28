import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../utils/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the token for debugging
    console.log('Reset password token:', token);
    
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const validatePassword = (pass) => {
    const hasMinLength = pass.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[@$!%*#?&]/.test(pass);
    
    return {
      isValid: hasMinLength && hasLetter && hasNumber && hasSpecial,
      errors: {
        minLength: !hasMinLength,
        letter: !hasLetter,
        number: !hasNumber,
        special: !hasSpecial
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('Password must be at least 8 characters long and contain at least one letter, one number, and one special character (@$!%*#?&)');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setSuccess(true);
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      if (err.response?.status === 400) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Invalid Reset Link</h2>
          <p style={styles.message}>
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const validation = validatePassword(password);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Your Password</h2>
        {error && <div style={styles.error}>{error}</div>}
        {success && (
          <div style={styles.success}>
            Password reset successful! Redirecting to login...
          </div>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...styles.input,
                borderColor: password ? (validation.isValid ? '#27ae60' : '#e74c3c') : '#ddd'
              }}
              required
              minLength="8"
            />
            <div style={styles.requirements}>
              <p style={styles.requirementTitle}>Password must contain:</p>
              <ul style={styles.requirementList}>
                <li style={{ color: validation.errors.minLength ? '#e74c3c' : '#27ae60' }}>
                  At least 8 characters
                </li>
                <li style={{ color: validation.errors.letter ? '#e74c3c' : '#27ae60' }}>
                  At least one letter
                </li>
                <li style={{ color: validation.errors.number ? '#e74c3c' : '#27ae60' }}>
                  At least one number
                </li>
                <li style={{ color: validation.errors.special ? '#e74c3c' : '#27ae60' }}>
                  At least one special character (@$!%*#?&)
                </li>
              </ul>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                ...styles.input,
                borderColor: confirmPassword ? 
                  (password === confirmPassword ? '#27ae60' : '#e74c3c') : 
                  '#ddd'
              }}
              required
              minLength="8"
            />
          </div>
          <button
            type="submit"
            style={styles.button}
            disabled={loading || !validation.isValid || password !== confirmPassword}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    color: '#666',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#0056b3',
    },
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  success: {
    backgroundColor: '#e6ffe6',
    color: '#006600',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  message: {
    color: '#666',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  requirements: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  requirementTitle: {
    color: '#2c3e50',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  requirementList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.9rem',
  },
};

export default ResetPassword; 