import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

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
              Get Started
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

      {/* About Section */}
      <div id="about" style={styles.about}>
        <h2 style={styles.sectionTitle}>Why Choose STAFMA?</h2>
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>💰</div>
            <h3 style={styles.featureTitle}>Kenyan Payroll Made Easy</h3>
            <p style={styles.featureText}>
              Automated PAYE, NHIF, and NSSF calculations. Compliant with Kenyan tax regulations.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>👥</div>
            <h3 style={styles.featureTitle}>Employee Management</h3>
            <p style={styles.featureText}>
              Digital employee records, document management, and leave tracking.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Performance Reviews</h3>
            <p style={styles.featureText}>
              Set KPIs, conduct reviews, and track employee growth over time.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
        <p style={styles.ctaText}>
          Join thousands of businesses managing their HR with STAFMA
        </p>
        <button 
          onClick={() => navigate('/register')} 
          style={styles.ctaButton}
        >
          Register Your Business
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
  },
  hero: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center',
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    maxWidth: '800px',
  },
  heroTitle: {
    fontSize: '3.5rem',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  heroSubtitle: {
    fontSize: '1.5rem',
    marginBottom: '40px',
    color: '#ecf0f1',
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '15px 40px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  secondaryButton: {
    padding: '15px 40px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '30px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  about: {
    padding: '80px 20px',
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2.5rem',
    marginBottom: '60px',
    color: '#2c3e50',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  feature: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s',
    '&:hover': {
      transform: 'translateY(-10px)',
    },
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px',
    color: '#2c3e50',
  },
  featureText: {
    color: '#666',
    lineHeight: '1.6',
  },
  cta: {
    textAlign: 'center',
    padding: '100px 20px',
    backgroundColor: '#3498db',
    color: 'white',
  },
  ctaTitle: {
    fontSize: '2.5rem',
    marginBottom: '20px',
  },
  ctaText: {
    fontSize: '1.2rem',
    marginBottom: '40px',
    color: '#ecf0f1',
  },
  ctaButton: {
    padding: '15px 40px',
    backgroundColor: 'white',
    color: '#3498db',
    border: 'none',
    borderRadius: '30px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
};

export default LandingPage; 