import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function SubscriptionSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState('medium');
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Get business data from registration or login
  const businessData = location.state?.businessData || {};
  const fromLogin = location.state?.fromLogin || false;
  const subscriptionInactive = location.state?.subscriptionInactive || false;

  // Set plan based on existing subscription if coming from login
  React.useEffect(() => {
    if (fromLogin && businessData.payment?.plan) {
      setSelectedPlan(businessData.payment.plan);
    }
    if (fromLogin && businessData.subscription?.type) {
      setBillingCycle(businessData.subscription.type);
    }
  }, [fromLogin, businessData]);

  const plans = {
    small: {
      name: 'Small Business',
      monthlyPrice: 3500,
      yearlyPrice: 35000,
      features: [
        '1-10 employees',
        'Basic payroll processing',
        'Employee management',
        'Leave tracking',
        'Basic reports',
        'Email support'
      ],
      maxEmployees: 10
    },
    medium: {
      name: 'Medium Business',
      monthlyPrice: 12000,
      yearlyPrice: 120000,
      features: [
        '11-50 employees',
        'Advanced payroll with tax calculations',
        'Performance reviews',
        'Document management',
        'Advanced analytics',
        'Priority support',
        'Staffpesa integration'
      ],
      maxEmployees: 50
    },
    large: {
      name: 'Large Business',
      monthlyPrice: 20000,
      yearlyPrice: 200000,
      features: [
        '51-100 employees',
        'Full payroll automation',
        'Advanced HR analytics',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom training'
      ],
      maxEmployees: 100
    }
  };

  const selectedPlanData = plans[selectedPlan];
  const price = billingCycle === 'monthly' ? selectedPlanData.monthlyPrice : selectedPlanData.yearlyPrice;
  const savings = billingCycle === 'yearly' ? Math.round((selectedPlanData.monthlyPrice * 12 - selectedPlanData.yearlyPrice) / 100) * 100 : 0;

  const handleContinue = () => {
    navigate('/payment', {
      state: {
        businessData,
        subscriptionData: {
          plan: selectedPlan,
          billingCycle,
          price,
          planData: selectedPlanData
        }
      }
    });
  };

  const handleBack = () => {
    if (fromLogin) {
      navigate('/login');
    } else {
      navigate('/register', { state: { businessData } });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Choose Your Subscription Plan</h1>
        <p style={styles.subtitle}>
          {subscriptionInactive && 'Your subscription is inactive. Please select a plan to reactivate.'}
          {!subscriptionInactive && 'Choose your plan to get started with STAFMA.'}
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div style={styles.billingToggle}>
        <span style={billingCycle === 'monthly' ? styles.activeToggle : styles.inactiveToggle}>
          Monthly
        </span>
        <button
          style={styles.toggleButton}
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
        >
          <div style={styles.toggleSlider}></div>
        </button>
        <span style={billingCycle === 'yearly' ? styles.activeToggle : styles.inactiveToggle}>
          Yearly
          {billingCycle === 'yearly' && <span style={styles.savingsBadge}>Save {savings} KES</span>}
        </span>
      </div>

      {/* Plans Grid */}
      <div style={styles.plansGrid}>
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            style={{
              ...styles.planCard,
              ...(selectedPlan === key ? styles.selectedPlan : {}),
              ...(key === 'medium' ? styles.popularPlan : {})
            }}
            onClick={() => setSelectedPlan(key)}
          >
            {key === 'medium' && (
              <div style={styles.popularBadge}>Most Popular</div>
            )}
            
            <div style={styles.planHeader}>
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.planPrice}>
                <span style={styles.currency}>KES</span>
                <span style={styles.amount}>
                  {billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.yearlyPrice.toLocaleString()}
                </span>
                <span style={styles.period}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <div style={styles.yearlySavings}>
                  Save {Math.round((plan.monthlyPrice * 12 - plan.yearlyPrice) / 100) * 100} KES/year
                </div>
              )}
            </div>

            <div style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <div key={index} style={styles.feature}>
                  <span style={styles.checkmark}>✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <div style={styles.planFooter}>
              {plan.maxEmployees === -1 ? (
                <span style={styles.employeeLimit}>Unlimited employees</span>
              ) : (
                <span style={styles.employeeLimit}>Up to {plan.maxEmployees} employees</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryContent}>
          <div style={styles.summaryDetails}>
            <h3 style={styles.summaryTitle}>Selected Plan</h3>
            <p style={styles.summaryPlan}>
              {selectedPlanData.name} - {billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}ly
            </p>
            <p style={styles.summaryPrice}>
              KES {price.toLocaleString()} / {billingCycle === 'monthly' ? 'month' : 'year'}
            </p>
            {billingCycle === 'yearly' && (
              <p style={styles.summarySavings}>
                You save KES {savings.toLocaleString()} per year
              </p>
            )}
          </div>
          <div style={styles.summaryActions}>
            <button style={styles.backButton} onClick={handleBack}>
              {fromLogin ? 'Back to Login' : 'Back'}
            </button>
            <button style={styles.continueButton} onClick={handleContinue}>
              Continue to Payment
            </button>
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
  billingToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '40px',
  },
  activeToggle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#3498db',
  },
  inactiveToggle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  toggleButton: {
    width: '60px',
    height: '30px',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    position: 'relative',
    padding: '2px',
  },
  toggleSlider: {
    width: '26px',
    height: '26px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'transform 0.3s',
    transform: 'translateX(0px)',
  },
  savingsBadge: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    marginLeft: '8px',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto 40px auto',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    border: '2px solid #e1e8ed',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#3498db',
    boxShadow: '0 4px 20px rgba(52, 152, 219, 0.2)',
  },
  popularPlan: {
    borderColor: '#f39c12',
  },
  popularBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#f39c12',
    color: 'white',
    padding: '5px 15px',
    borderRadius: '15px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  planHeader: {
    textAlign: 'center',
    marginBottom: '25px',
  },
  planName: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  planPrice: {
    fontSize: '1.8rem',
    color: '#3498db',
    fontWeight: 'bold',
  },
  currency: {
    fontSize: '1rem',
    verticalAlign: 'top',
  },
  amount: {
    fontSize: '2rem',
  },
  period: {
    fontSize: '1rem',
    color: '#666',
    fontWeight: 'normal',
  },
  yearlySavings: {
    fontSize: '0.9rem',
    color: '#27ae60',
    marginTop: '5px',
  },
  planFeatures: {
    marginBottom: '20px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '0.95rem',
    color: '#2c3e50',
  },
  checkmark: {
    color: '#27ae60',
    marginRight: '10px',
    fontWeight: 'bold',
  },
  planFooter: {
    textAlign: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #e1e8ed',
  },
  employeeLimit: {
    fontSize: '0.9rem',
    color: '#666',
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '800px',
    margin: '0 auto 30px auto',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  summaryContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: '1.2rem',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  summaryPlan: {
    fontSize: '1.1rem',
    color: '#3498db',
    marginBottom: '5px',
  },
  summaryPrice: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  summarySavings: {
    fontSize: '0.9rem',
    color: '#27ae60',
    margin: 0,
  },
  summaryActions: {
    display: 'flex',
    gap: '15px',
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
  continueButton: {
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
};

export default SubscriptionSelection; 