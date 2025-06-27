import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Welcome to STAFMA
          </h1>
          <p style={styles.heroSubtitle}>
            Your Complete HR Solution for Small and Medium Businesses in Kenya
          </p>
          <div style={styles.heroButtons}>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.primaryButton}
            >
              Get Started Today
            </button>
            <button 
              onClick={() => navigate('/login')} 
              style={styles.secondaryButton}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Choose Your Plan</h2>
        <p style={styles.sectionSubtitle}>
          Get started with STAFMA today. Choose the plan that fits your business needs.
        </p>
        <div style={styles.plans}>
          <div style={styles.plan}>
            <div style={styles.planHeader}>
              <h3 style={styles.planTitle}>Small Business</h3>
              <div style={styles.planPrice}>
                <span style={styles.currency}>KES</span>
                <span style={styles.amount}>3,500</span>
                <span style={styles.period}>/month</span>
              </div>
            </div>
            <p style={styles.planDescription}>
              Perfect for small businesses with up to 10 employees. Basic payroll processing, employee management, and essential HR features.
            </p>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.planButton}
            >
              Get Started
            </button>
          </div>

          <div style={styles.plan}>
            <div style={styles.planBadge}>Most Popular</div>
            <div style={styles.planHeader}>
              <h3 style={styles.planTitle}>Medium Business</h3>
              <div style={styles.planPrice}>
                <span style={styles.currency}>KES</span>
                <span style={styles.amount}>12,000</span>
                <span style={styles.period}>/month</span>
              </div>
            </div>
            <p style={styles.planDescription}>
              Ideal for growing businesses with 11-50 employees. Advanced payroll with tax calculations, performance reviews, and analytics.
            </p>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.planButton}
            >
              Get Started
            </button>
          </div>

          <div style={styles.plan}>
            <div style={styles.planHeader}>
              <h3 style={styles.planTitle}>Large Business</h3>
              <div style={styles.planPrice}>
                <span style={styles.currency}>KES</span>
                <span style={styles.amount}>20,000</span>
                <span style={styles.period}>/month</span>
              </div>
            </div>
            <p style={styles.planDescription}>
              Complete HR solution for large businesses with 51-100 employees. Full automation, dedicated support, and custom integrations.
            </p>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.planButton}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" style={styles.about}>
        <h2 style={styles.sectionTitle}>Why Choose STAFMA?</h2>
        <div style={styles.features}>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 0 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(0)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 0 ? styles.featureIconHover : {})
            }}>💰</div>
            <h3 style={styles.featureTitle}>Kenyan Payroll Made Easy</h3>
            <p style={styles.featureText}>
              Automated PAYE, NHIF, and NSSF calculations. Compliant with Kenyan tax regulations.
            </p>
          </div>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 1 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(1)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 1 ? styles.featureIconHover : {})
            }}>👥</div>
            <h3 style={styles.featureTitle}>Employee Management</h3>
            <p style={styles.featureText}>
              Digital employee records, document management, and leave tracking.
            </p>
          </div>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 2 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(2)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 2 ? styles.featureIconHover : {})
            }}>📊</div>
            <h3 style={styles.featureTitle}>Performance Reviews</h3>
            <p style={styles.featureText}>
              Set KPIs, conduct reviews, and track employee growth over time.
            </p>
          </div>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 3 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(3)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 3 ? styles.featureIconHover : {})
            }}>🔒</div>
            <h3 style={styles.featureTitle}>Secure & Compliant</h3>
            <p style={styles.featureText}>
              Bank-level security with data encryption and GDPR compliance.
            </p>
          </div>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 4 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(4)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 4 ? styles.featureIconHover : {})
            }}>📱</div>
            <h3 style={styles.featureTitle}>Mobile Ready</h3>
            <p style={styles.featureText}>
              Access your HR data anywhere with our mobile-responsive platform.
            </p>
          </div>
          <div 
            style={{
              ...styles.feature,
              ...(hoveredFeature === 5 ? styles.featureHover : {})
            }}
            onMouseEnter={() => setHoveredFeature(5)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div style={{
              ...styles.featureIcon,
              ...(hoveredFeature === 5 ? styles.featureIconHover : {})
            }}>🎯</div>
            <h3 style={styles.featureTitle}>Kenyan Focused</h3>
            <p style={styles.featureText}>
              Built specifically for Kenyan businesses with local tax laws and regulations.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div style={styles.footer}>
        <div style={styles.footerBottom}>
          <p style={styles.copyright}>
            © 2024 STAFMA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center',
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '800px',
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: '3rem',
    marginBottom: '20px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 4px 8px rgba(0,0,0,0.1)',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '1.4rem',
    marginBottom: '40px',
    color: '#f8f9fa',
    fontWeight: '400',
    lineHeight: '1.4',
    maxWidth: '600px',
    margin: '0 auto 40px auto',
  },
  heroButtons: {
    display: 'flex',
    gap: '25px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    color: '#667eea',
    border: 'none',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  secondaryButton: {
    padding: '18px 40px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.8)',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pricing: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    position: 'relative',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2.8rem',
    marginBottom: '15px',
    color: '#2c3e50',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  sectionSubtitle: {
    textAlign: 'center',
    fontSize: '1.2rem',
    marginBottom: '60px',
    color: '#6c757d',
    fontWeight: '400',
    maxWidth: '600px',
    margin: '0 auto 60px auto',
    lineHeight: '1.6',
  },
  plans: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  plan: {
    textAlign: 'center',
    padding: '25px 20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  planHeader: {
    marginBottom: '15px',
  },
  planTitle: {
    fontSize: '1.2rem',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: '1.5rem',
    color: '#667eea',
    fontWeight: '700',
    marginBottom: '5px',
  },
  currency: {
    fontSize: '0.8rem',
    verticalAlign: 'top',
    fontWeight: '500',
  },
  amount: {
    fontSize: '1.6rem',
  },
  period: {
    fontSize: '0.75rem',
    color: '#6c757d',
    fontWeight: '400',
  },
  planDescription: {
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6c757d',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  planButton: {
    padding: '10px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  planBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '0.65rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  about: {
    padding: '120px 20px',
    backgroundColor: 'white',
    position: 'relative',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '50px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  feature: {
    textAlign: 'center',
    padding: '40px 30px',
    backgroundColor: '#f8f9fa',
    borderRadius: '20px',
    border: '1px solid rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  featureHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
    borderColor: '#667eea',
  },
  featureIcon: {
    fontSize: '4rem',
    marginBottom: '25px',
    display: 'block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    transition: 'transform 0.3s ease',
  },
  featureIconHover: {
    transform: 'scale(1.1)',
  },
  featureTitle: {
    fontSize: '1.5rem',
    marginBottom: '20px',
    color: '#2c3e50',
    fontWeight: '700',
    transition: 'color 0.3s ease',
  },
  featureText: {
    color: '#6c757d',
    lineHeight: '1.7',
    fontSize: '1.1rem',
    fontWeight: '400',
    transition: 'color 0.3s ease',
  },
  footer: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '40px 20px',
    textAlign: 'center',
    position: 'relative',
  },
  footerBottom: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '1rem',
    color: '#95a5a6',
    fontWeight: '400',
  },
};

export default LandingPage; 