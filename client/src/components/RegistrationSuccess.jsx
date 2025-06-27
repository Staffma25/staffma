import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from previous steps
  const { businessData, subscriptionData, paymentData } = location.state || {};

  if (!businessData || !subscriptionData || !paymentData) {
    navigate('/register');
    return null;
  }

  const handleGoToDashboard = () => {
    // Here you would typically log the user in automatically
    // For now, we'll redirect to login
    navigate('/login');
  };

  const handleDownloadInvoice = () => {
    // Generate and download invoice
    const invoiceData = {
      businessName: businessData.businessName,
      plan: subscriptionData.planData.name,
      amount: paymentData.amount,
      transactionId: paymentData.transactionId,
      date: new Date().toLocaleDateString()
    };
    
    // Create a simple invoice (in a real app, you'd generate a proper PDF)
    const invoiceText = `
INVOICE

Business: ${invoiceData.businessName}
Plan: ${invoiceData.plan}
Amount: KES ${invoiceData.amount.toLocaleString()}
Transaction ID: ${invoiceData.transactionId}
Date: ${invoiceData.date}

Thank you for choosing STAFMA!
    `;
    
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stafma-invoice-${paymentData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h1 style={styles.title}>Welcome to STAFMA!</h1>
          <p style={styles.subtitle}>
            Your registration is complete and your account is ready to use.
          </p>

          <div style={styles.details}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Business Name:</span>
              <span style={styles.detailValue}>{businessData.businessName}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{businessData.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Plan:</span>
              <span style={styles.detailValue}>{subscriptionData.planData.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Billing Cycle:</span>
              <span style={styles.detailValue}>
                {subscriptionData.billingCycle.charAt(0).toUpperCase() + subscriptionData.billingCycle.slice(1)}ly
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Transaction ID:</span>
              <span style={styles.detailValue}>{paymentData.transactionId}</span>
            </div>
          </div>

          <div style={styles.trialInfo}>
            <div style={styles.trialIcon}>⏰</div>
            <div style={styles.trialText}>
              <h4 style={styles.trialTitle}>Welcome to STAFMA!</h4>
              <p style={styles.trialDescription}>
                Your account is now active and ready to use. You can start managing your employees and payroll immediately.
              </p>
            </div>
          </div>

          <div style={styles.nextSteps}>
            <h3 style={styles.nextStepsTitle}>What's Next?</h3>
            <div style={styles.stepsList}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Complete Your Profile</h4>
                  <p style={styles.stepDescription}>
                    Add your business details, departments, and company information.
                  </p>
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Add Your Employees</h4>
                  <p style={styles.stepDescription}>
                    Start by adding your first employee to the system.
                  </p>
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Set Up Payroll</h4>
                  <p style={styles.stepDescription}>
                    Configure payroll settings and tax calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
            <button style={styles.secondaryButton} onClick={handleDownloadInvoice}>
              Download Invoice
            </button>
          </div>

          <div style={styles.support}>
            <div style={styles.supportContent}>
              <div style={styles.supportIcon}>💬</div>
              <div style={styles.supportText}>
                <h4 style={styles.supportTitle}>Need Help?</h4>
                <p style={styles.supportDescription}>
                  Our support team is here to help you get started. 
                  Contact us at support@stafma.co.ke or call +254 700 000 000.
                </p>
              </div>
            </div>
          </div>
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
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '30px',
  },
  details: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '25px',
    marginBottom: '30px',
    textAlign: 'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '1rem',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  detailValue: {
    color: '#666',
  },
  trialInfo: {
    backgroundColor: '#e8f4fd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  trialIcon: {
    fontSize: '2rem',
  },
  trialText: {
    flex: 1,
    textAlign: 'left',
  },
  trialTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  trialDescription: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  nextSteps: {
    marginBottom: '30px',
    textAlign: 'left',
  },
  nextStepsTitle: {
    fontSize: '1.3rem',
    color: '#2c3e50',
    marginBottom: '20px',
    textAlign: 'center',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
  },
  stepNumber: {
    width: '30px',
    height: '30px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  stepDescription: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  primaryButton: {
    padding: '15px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '15px 30px',
    backgroundColor: 'transparent',
    color: '#3498db',
    border: '1px solid #3498db',
    borderRadius: '6px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  support: {
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    padding: '20px',
  },
  supportContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  supportIcon: {
    fontSize: '2rem',
  },
  supportText: {
    flex: 1,
    textAlign: 'left',
  },
  supportTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  supportDescription: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
};

export default RegistrationSuccess; 