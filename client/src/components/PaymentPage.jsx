import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    phoneNumber: ''
  });

  // Get data from previous steps
  const { businessData, subscriptionData } = location.state || {};

  // Create axios instance with base URL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api'
  });

  // Add response interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh the token
          const refreshToken = localStorage.getItem('businessRefreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/refresh-token`, {
                refreshToken
              });

              const { token: newToken } = refreshResponse.data;
              if (newToken) {
                localStorage.setItem('businessToken', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Debug: Check token on component mount
  useEffect(() => {
    console.log('PaymentPage: Component mounted');
    console.log('PaymentPage: Location state:', location.state);
    console.log('PaymentPage: businessData:', businessData);
    console.log('PaymentPage: subscriptionData:', subscriptionData);
    
    const token = getToken('business');
    console.log('PaymentPage: Token on mount:', !!token);
    if (token) {
      console.log('PaymentPage: Token preview:', token.substring(0, 20) + '...');
    } else {
      console.error('PaymentPage: NO TOKEN FOUND ON MOUNT');
      console.log('PaymentPage: All localStorage keys:', Object.keys(localStorage));
      console.log('PaymentPage: businessToken value:', localStorage.getItem('businessToken'));
      console.log('PaymentPage: staffmaToken value:', localStorage.getItem('staffmaToken'));
      console.log('PaymentPage: businessRefreshToken value:', localStorage.getItem('businessRefreshToken'));
      
      // Check for fallback token keys
      const fallbackToken = localStorage.getItem('token');
      console.log('PaymentPage: Fallback token value:', !!fallbackToken);
      if (fallbackToken) {
        console.log('PaymentPage: Fallback token preview:', fallbackToken.substring(0, 20) + '...');
      }
      
      if (fallbackToken) {
        console.log('PaymentPage: Using fallback token');
        // Use the fallback token and store it as businessToken for consistency
        localStorage.setItem('businessToken', fallbackToken);
      } else {
        // If no token found, redirect to login with a message
        console.log('PaymentPage: Redirecting to login due to missing token');
        navigate('/login', { 
          state: { 
            error: 'Please log in to complete your payment.',
            returnTo: '/payment',
            businessData,
            subscriptionData
          }
        });
      }
    }
  }, [location.state, businessData, subscriptionData, navigate, getToken]);

  if (!businessData || !subscriptionData) {
    navigate('/register');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get token from AuthContext
      const token = getToken('business');
      console.log('PaymentPage: Using token from AuthContext:', !!token);
      
      if (!token) {
        console.error('PaymentPage: No token available from AuthContext');
        throw new Error('No authentication token found. Please try logging in again.');
      }

      const paymentData = {
        plan: subscriptionData.plan,
        billingCycle: subscriptionData.billingCycle,
        amount: subscriptionData.price,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paymentMethod: paymentMethod
      };

      console.log('PaymentPage: Making payment request with token:', token.substring(0, 20) + '...');

      const response = await api.post('/payment/complete', paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Payment completed successfully:', response.data);
      
      // Navigate to success page with all the data
      navigate('/registration-success', {
        state: {
          businessData,
          subscriptionData,
          paymentData: {
            method: paymentMethod,
            amount: subscriptionData.price,
            transactionId: paymentData.transactionId
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again to complete your payment.');
        navigate('/login', { 
          state: { 
            error: 'Please log in to complete your payment.',
            returnTo: '/payment',
            businessData,
            subscriptionData
          }
        });
      } else {
        alert(`Payment failed: ${error.response?.data?.message || error.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/subscription', { state: { businessData } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Complete Your Registration</h1>
        <p style={styles.subtitle}>
          You're just one step away from accessing STAFMA
        </p>
      </div>

      <div style={styles.content}>
        <div style={styles.paymentSection}>
          <h2 style={styles.sectionTitle}>Payment Information</h2>
          
          {/* Order Summary */}
          <div style={styles.orderSummary}>
            <h3 style={styles.summaryTitle}>Order Summary</h3>
            <div style={styles.summaryRow}>
              <span>Business:</span>
              <span>{businessData.businessName}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Plan:</span>
              <span>{subscriptionData.planData.name}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Billing:</span>
              <span>{subscriptionData.billingCycle.charAt(0).toUpperCase() + subscriptionData.billingCycle.slice(1)}ly</span>
            </div>
            <div style={styles.summaryRow}>
              <span>First Charge:</span>
              <span>KES {subscriptionData.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div style={styles.paymentMethods}>
            <h3 style={styles.methodsTitle}>Payment Method</h3>
            <div style={styles.methodOptions}>
              <label style={styles.methodOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={styles.methodLabel}>Credit/Debit Card</span>
              </label>
              <label style={styles.methodOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mpesa"
                  checked={paymentMethod === 'mpesa'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span style={styles.methodLabel}>M-Pesa</span>
              </label>
            </div>
          </div>

          {/* Payment Form */}
          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} style={styles.paymentForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    style={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cardholder Name</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  style={styles.formInput}
                  required
                />
              </div>

              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay KES ${subscriptionData.price.toLocaleString()}`}
              </button>
            </form>
          )}

          {paymentMethod === 'mpesa' && (
            <div style={styles.mpesaSection}>
              <div style={styles.mpesaInfo}>
                <div style={styles.mpesaIcon}>📱</div>
                <div style={styles.mpesaText}>
                  <h4 style={styles.mpesaTitle}>M-Pesa Payment</h4>
                  <p style={styles.mpesaDescription}>
                    You'll receive an M-Pesa prompt on your phone to complete the payment.
                  </p>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="07XXXXXXXX"
                  style={styles.formInput}
                  required
                />
              </div>

              <button 
                onClick={handleSubmit}
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay KES ${subscriptionData.price.toLocaleString()} via M-Pesa`}
              </button>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div style={styles.securityInfo}>
          <div style={styles.securityContent}>
            <div style={styles.securityIcon}>🔒</div>
            <div style={styles.securityText}>
              <h4 style={styles.securityTitle}>Secure Payment</h4>
              <p style={styles.securityDescription}>
                Your payment information is encrypted and secure. We use industry-standard SSL encryption.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={styles.navigation}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    margin: 0,
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '25px',
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
  },
  summaryTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '0.95rem',
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #ddd',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  paymentMethods: {
    marginBottom: '25px',
  },
  methodsTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  methodOptions: {
    display: 'flex',
    gap: '20px',
  },
  methodOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  methodLabel: {
    fontSize: '1rem',
    color: '#2c3e50',
  },
  paymentForm: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.95rem',
    color: '#2c3e50',
    fontWeight: '500',
  },
  formInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  mpesaSection: {
    marginTop: '20px',
  },
  mpesaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#e8f4fd',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  mpesaIcon: {
    fontSize: '2rem',
  },
  mpesaText: {
    flex: 1,
  },
  mpesaTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  mpesaDescription: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  securityInfo: {
    backgroundColor: '#e8f5e8',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  securityContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  securityIcon: {
    fontSize: '2rem',
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  securityDescription: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  navigation: {
    textAlign: 'center',
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default PaymentPage; 