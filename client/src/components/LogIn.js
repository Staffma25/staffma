import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, getCurrentUser } = useAuth();

  useEffect(() => {
    // If already logged in as business user, redirect to business dashboard
    if (isAuthenticated('business')) {
      console.log('LogIn: User is already authenticated as business user');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log('LogIn: Login successful, redirecting to business dashboard');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Failed to login. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>Business Login</h2>
          <p style={styles.subtitle}>Access your business dashboard</p>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email">Business Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="your-business@example.com"
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
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/')} 
            style={styles.backButton}
          >
            ← Back to Home
          </button>
          
          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>
          
          <button 
            onClick={() => {
              console.log('Navigating to Staffma login from LogIn component');
              navigate('/staffma/login', { replace: true });
            }} 
            style={styles.staffmaLoginButton}
          >
            Staffma System Login
          </button>
          
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <span 
              onClick={() => navigate('/register')} 
              style={styles.footerLink}
            >
              Register your business
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
    backgroundColor: '#f5f6fa',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  formCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0'
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
  button: {
    padding: '15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginTop: '10px'
  },
  buttonHover: {
    backgroundColor: '#2980b9'
  },
  buttonDisabled: {
      backgroundColor: '#95a5a6',
    cursor: 'not-allowed'
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
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '20px 0'
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 15px',
    color: '#7f8c8d',
    fontSize: '14px'
  },
  staffmaLoginButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    marginBottom: '20px'
  },
  staffmaLoginButtonHover: {
    backgroundColor: '#667eea',
    color: 'white'
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: '10px 0 0 0'
  },
  footerLink: {
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '500'
  }
};

export default LogIn;