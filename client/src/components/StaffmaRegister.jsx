import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function StaffmaRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { staffmaRegister } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('StaffmaRegister: Attempting registration with:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role
      });

      const result = await staffmaRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        console.log('StaffmaRegister: Registration successful:', result.message);
        setSuccess('Registration successful! You can now login to Staffma.');
        
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin'
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/staffma/login');
        }, 2000);

      } else {
        console.log('StaffmaRegister: Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      }

    } catch (error) {
      console.error('StaffmaRegister: Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>Staffma Registration</h2>
          <p style={styles.subtitle}>Create Staffma System Administrator Account</p>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your first name"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your last name"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="admin@staffma.com"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="admin">System Administrator</option>
              <option value="super_admin">Super Administrator</option>
              <option value="support">Support Staff</option>
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your password (min 8 characters)"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Staffma Account'}
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
            onClick={() => navigate('/staffma/login')} 
            style={styles.loginButton}
          >
            Already have an account? Login
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
    maxWidth: '500px',
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
    gap: '20px'
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
  success: {
    backgroundColor: '#f0fff4',
    color: '#38a169',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid #c6f6d5',
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
  loginButton: {
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

export default StaffmaRegister; 