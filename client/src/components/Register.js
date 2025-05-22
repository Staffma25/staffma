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
    backgroundColor: '#f5f6fa',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '2rem',
    color: '#2c3e50',
    fontSize: '1.8rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.8rem',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '1rem',
  },
  submitBtn: {
    padding: '0.8rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  text: {
    marginTop: '1rem',
    color: '#7f8c8d',
  },
  link: {
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  backBtn: {
    marginTop: '1rem',
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#7f8c8d',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  select: {
    padding: '0.8rem',
    borderRadius: '4px',
    border: '1px solid #dcdde1',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  kycSection: {
    marginTop: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  kycTitle: {
    marginBottom: '1rem',
    color: '#2c3e50',
    fontSize: '1.2rem',
  },
  fileInputGroup: {
    marginBottom: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  documentLabel: {
    color: '#2c3e50',
    fontSize: '0.95rem',
  },
  uploadBtn: {
    display: 'inline-block',
    padding: '0.5rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#2980b9',
    },
  },
  fileInput: {
    display: 'none',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  fileName: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    wordBreak: 'break-all',
  },
  removeBtn: {
    padding: '0.3rem 0.8rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginLeft: '1rem',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#c0392b',
    },
  },
  error: {
    color: '#e74c3c',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: '#fde2e2',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  footer: {
    marginTop: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#7f8c8d',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'color 0.3s',
    '&:hover': {
      color: '#2c3e50',
    },
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  footerLink: {
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'underline',
    '&:hover': {
      color: '#2980b9',
    },
  },
};

export default Register;