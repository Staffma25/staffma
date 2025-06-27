import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PaymentProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { businessUser, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const token = getToken('business');
        if (!token) {
          navigate('/login');
          return;
        }

        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}/payment/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 402) {
            const errorData = await response.json();
            if (errorData.paymentRequired) {
              navigate('/subscription', { 
                state: { 
                  businessData: errorData.businessData,
                  fromLogin: true 
                },
                replace: true 
              });
              return;
            }
            if (errorData.subscriptionInactive) {
              navigate('/subscription', { 
                state: { 
                  businessData: errorData.businessData,
                  subscriptionInactive: true 
                },
                replace: true 
              });
              return;
            }
          } else if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.suspended) {
              navigate('/login', { 
                state: { 
                  error: 'Your account has been suspended. Please contact support.' 
                },
                replace: true 
              });
              return;
            }
          } else if (response.status === 401) {
            navigate('/login');
            return;
          }
        }

        const data = await response.json();
        setPaymentStatus(data);
        setLoading(false);
      } catch (error) {
        console.error('Payment status check error:', error);
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [navigate, getToken]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Checking payment status...</p>
      </div>
    );
  }

  // Check if payment is required
  if (paymentStatus?.payment?.status === 'pending') {
    navigate('/subscription', { 
      state: { 
        businessData: {
          businessName: businessUser?.businessName,
          email: businessUser?.email
        },
        fromLogin: true 
      },
      replace: true 
    });
    return null;
  }

  // Check if subscription is inactive
  if (paymentStatus?.subscription?.status === 'inactive') {
    navigate('/subscription', { 
      state: { 
        businessData: {
          businessName: businessUser?.businessName,
          email: businessUser?.email,
          payment: paymentStatus.payment,
          subscription: paymentStatus.subscription
        },
        subscriptionInactive: true 
      },
      replace: true 
    });
    return null;
  }

  // Check if account is suspended
  if (paymentStatus?.isSuspended) {
    navigate('/login', { 
      state: { 
        error: 'Your account has been suspended. Please contact support.' 
      },
      replace: true 
    });
    return null;
  }

  return children;
}

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default PaymentProtectedRoute; 