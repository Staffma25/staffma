import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    applicantName: '',
    applicantRole: '',
    businessAddress: '',
    contactNumber: '',
    kycDocuments: {
      companyPin: null,
      cr12: null,
      businessCertificate: null
    }
  });

  const [fileNames, setFileNames] = useState({
    companyPin: '',
    cr12: '',
    businessCertificate: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.businessName || !formData.email || !formData.password) {
        console.log('Missing required fields:', {
          businessName: !formData.businessName,
          email: !formData.email,
          password: !formData.password
        });
        setError('Business name, email and password are required');
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
        businessType: formData.businessType || 'sole',
        applicantName: formData.applicantName.trim(),
        applicantRole: formData.applicantRole.trim(),
        businessAddress: formData.businessAddress.trim(),
        contactNumber: formData.contactNumber.trim()
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

      // Registration successful
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      kycDocuments: {
        ...prev.kycDocuments,
        [documentType]: file
      }
    }));
    setFileNames(prev => ({
      ...prev,
      [documentType]: file ? file.name : ''
    }));
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
            placeholder="Business Name"
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          />
          
          <select
            style={styles.select}
            value={formData.businessType}
            onChange={(e) => setFormData({...formData, businessType: e.target.value})}
          >
            <option value="">Select Business Type</option>
            <option value="limited">Limited Company</option>
            <option value="sole">Sole Proprietorship</option>
          </select>

          <input
            style={styles.input}
            type="text"
            placeholder="Applicant Name"
            value={formData.applicantName}
            onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Role in Business"
            value={formData.applicantRole}
            onChange={(e) => setFormData({...formData, applicantRole: e.target.value})}
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Business Physical Address"
            value={formData.businessAddress}
            onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
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
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />

          {/* KYC Documents Section */}
          <div style={styles.kycSection}>
            <h3 style={styles.kycTitle}>KYC Documents</h3>
            
            <div style={styles.fileInputGroup}>
              <div style={styles.fileRow}>
                <span style={styles.documentLabel}>Company PIN Certificate</span>
                <label style={styles.uploadBtn}>
                  Upload
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'companyPin')}
                    style={styles.fileInput}
                  />
                </label>
              </div>
              {fileNames.companyPin && (
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>{fileNames.companyPin}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        kycDocuments: { ...prev.kycDocuments, companyPin: null }
                      }));
                      setFileNames(prev => ({ ...prev, companyPin: '' }));
                    }}
                    style={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {formData.businessType === 'limited' && (
              <div style={styles.fileInputGroup}>
                <div style={styles.fileRow}>
                  <span style={styles.documentLabel}>CR12 Certificate</span>
                  <label style={styles.uploadBtn}>
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'cr12')}
                      style={styles.fileInput}
                    />
                  </label>
                </div>
                {fileNames.cr12 && (
                  <div style={styles.fileInfo}>
                    <span style={styles.fileName}>{fileNames.cr12}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          kycDocuments: { ...prev.kycDocuments, cr12: null }
                        }));
                        setFileNames(prev => ({ ...prev, cr12: '' }));
                      }}
                      style={styles.removeBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {formData.businessType === 'sole' && (
              <div style={styles.fileInputGroup}>
                <div style={styles.fileRow}>
                  <span style={styles.documentLabel}>Business Registration Certificate</span>
                  <label style={styles.uploadBtn}>
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'businessCertificate')}
                      style={styles.fileInput}
                    />
                  </label>
                </div>
                {fileNames.businessCertificate && (
                  <div style={styles.fileInfo}>
                    <span style={styles.fileName}>{fileNames.businessCertificate}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          kycDocuments: { ...prev.kycDocuments, businessCertificate: null }
                        }));
                        setFileNames(prev => ({ ...prev, businessCertificate: '' }));
                      }}
                      style={styles.removeBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    '&:focus': {
      outline: 'none',
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
    },
  },
  select: {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
  },
  },
  submitBtn: {
    padding: '1rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
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
  kycSection: {
    marginTop: '2rem',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
  },
  kycTitle: {
    marginBottom: '1.5rem',
    color: '#2d3748',
    fontSize: '1.3rem',
    fontWeight: '600',
  },
  fileInputGroup: {
    marginBottom: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.8rem',
  },
  documentLabel: {
    color: '#4a5568',
    fontSize: '1rem',
    fontWeight: '500',
  },
  uploadBtn: {
    display: 'inline-block',
    padding: '0.6rem 1.5rem',
    backgroundColor: '#4299e1',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#3182ce',
    },
  },
  fileInput: {
    display: 'none',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.8rem',
    padding: '0.8rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  fileName: {
    fontSize: '0.95rem',
    color: '#4a5568',
    wordBreak: 'break-all',
  },
  removeBtn: {
    padding: '0.4rem 1rem',
    backgroundColor: '#fc8181',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginLeft: '1rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f56565',
    },
  },
  error: {
    color: '#e53e3e',
    marginBottom: '1rem',
    padding: '0.8rem',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    fontSize: '0.95rem',
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
    fontSize: '0.95rem',
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
    fontSize: '0.95rem',
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