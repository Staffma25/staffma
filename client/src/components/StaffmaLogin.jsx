import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function StaffmaLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { staffmaLogin, isAuthenticated, getCurrentUser } = useAuth();

  useEffect(() => {
    // If already logged in as Staffma user, redirect to Staffma dashboard
    if (isAuthenticated('staffma')) {
      console.log('StaffmaLogin: User is already authenticated as Staffma user');
      const from = location.state?.from?.pathname || '/staffma/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('StaffmaLogin: Attempting login with email:', email);
      const result = await staffmaLogin(email, password);

      if (result.success) {
        console.log('StaffmaLogin: Login successful, redirecting to Staffma dashboard');
        navigate('/staffma/dashboard', { replace: true });
      } else {
        console.log('StaffmaLogin: Login failed:', result.error);
        setError(result.error || 'Failed to login. Please try again.');
      }
    } catch (error) {
      console.error('StaffmaLogin: Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>Staffma Login</h2>
          <p style={styles.subtitle}>System Administrator Access</p>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="admin@staffma.com"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Staffma'}
          </button>
        </form>

        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/', { replace: true })} 
            style={styles.backButton}
          >
            ← Back to Home
          </button>
          
          <p style={styles.footerText}>
            Need help? Contact{' '}
            <span style={styles.footerLink}>
              system support
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
    backgroundColor: '#1a1a2e',
    backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
  },
  formCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#7f8c8d',
    margin: 0,
    fontWeight: '500'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  input: {
    padding: '15px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s ease',
    backgroundColor: '#f8f9fa'
  },
  inputFocus: {
    borderColor: '#667eea',
    outline: 'none',
    backgroundColor: 'white'
  },
  button: {
    padding: '15px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginTop: '10px'
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)'
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
    transform: 'none'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c53030',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid #fed7d7',
    marginBottom: '20px'
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#7f8c8d',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
    textDecoration: 'underline'
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: '10px 0 0 0'
  },
  footerLink: {
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '500'
  }
};

export default StaffmaLogin; 