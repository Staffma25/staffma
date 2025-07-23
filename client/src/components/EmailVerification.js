import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EmailVerification() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Email Verification</h1>
        
        {status === 'verifying' && (
          <div style={styles.message}>
            <p>Verifying your email address...</p>
            <div style={styles.spinner}></div>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.message}>
            <p style={styles.successMessage}>{message}</p>
            <p>Redirecting to login page...</p>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.message}>
            <p style={styles.errorMessage}>{message}</p>
            <button 
              onClick={() => navigate('/login')}
              style={styles.button}
            >
              Go to Login
            </button>
          </div>
        )}
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
    backgroundColor: '#f8f9fa',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '2rem',
    fontSize: '1.8rem'
  },
  message: {
    marginBottom: '1.5rem'
  },
  successMessage: {
    color: '#27ae60',
    fontSize: '1.1rem',
    marginBottom: '1rem'
  },
  errorMessage: {
    color: '#e74c3c',
    fontSize: '1.1rem',
    marginBottom: '1rem'
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2980b9'
    }
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '20px auto',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default EmailVerification; 