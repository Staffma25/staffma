const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Business = require('../models/Business');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample activities data
const sampleActivities = [
  {
    type: 'employee_created',
    category: 'employee_management',
    title: 'New Employee Added',
    description: 'A new employee was added to the system',
    severity: 'low',
    status: 'success'
  },
  {
    type: 'payroll_processed',
    category: 'payroll_management',
    title: 'Payroll Processed',
    description: 'Monthly payroll was processed successfully',
    severity: 'medium',
    status: 'success'
  },
  {
    type: 'login_attempt',
    category: 'security',
    title: 'Failed Login Attempt',
    description: 'Multiple failed login attempts detected',
    severity: 'high',
    status: 'warning'
  },
  {
    type: 'system_error',
    category: 'system_administration',
    title: 'System Error',
    description: 'Database connection timeout occurred',
    severity: 'critical',
    status: 'error'
  },
  {
    type: 'document_uploaded',
    category: 'document_management',
    title: 'Document Uploaded',
    description: 'Employee contract document was uploaded',
    severity: 'low',
    status: 'success'
  },
  {
    type: 'leave_requested',
    category: 'leave_management',
    title: 'Leave Request Submitted',
    description: 'Employee submitted a leave request',
    severity: 'low',
    status: 'info'
  },
  {
    type: 'performance_review',
    category: 'performance_management',
    title: 'Performance Review Completed',
    description: 'Annual performance review was completed',
    severity: 'medium',
    status: 'success'
  },
  {
    type: 'user_created',
    category: 'user_management',
    title: 'New User Account Created',
    description: 'New user account was created for employee',
    severity: 'low',
    status: 'success'
  },
  {
    type: 'payment_processed',
    category: 'financial_services',
    title: 'Salary Payment Processed',
    description: 'Salary payment was processed via bank transfer',
    severity: 'medium',
    status: 'success'
  },
  {
    type: 'security_alert',
    category: 'security',
    title: 'Suspicious Activity Detected',
    description: 'Unusual access pattern detected from unknown IP',
    severity: 'critical',
    status: 'error'
  }
];

async function populateActivities() {
  try {
    // Get all businesses
    const businesses = await Business.find({});
    
    if (businesses.length === 0) {
      console.log('No businesses found. Please create some businesses first.');
      return;
    }

    console.log(`Found ${businesses.length} businesses. Creating sample activities...`);

    // Create activities for each business
    for (const business of businesses) {
      console.log(`Creating activities for business: ${business.businessName}`);
      
      // Create 5-15 activities per business with different timestamps
      const numActivities = Math.floor(Math.random() * 11) + 5; // 5-15 activities
      
      for (let i = 0; i < numActivities; i++) {
        const activityData = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
        
        // Create timestamp within the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));

        const activity = new Activity({
          ...activityData,
          businessId: business._id,
          timestamp,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        await activity.save();
      }
    }

    console.log('Sample activities created successfully!');
    
    // Display summary
    const totalActivities = await Activity.countDocuments({});
    const criticalActivities = await Activity.countDocuments({ severity: 'critical' });
    const recentActivities = await Activity.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    console.log('\n=== ACTIVITY SUMMARY ===');
    console.log(`Total Activities: ${totalActivities}`);
    console.log(`Critical Activities: ${criticalActivities}`);
    console.log(`Recent Activities (24h): ${recentActivities}`);
    console.log('========================\n');

  } catch (error) {
    console.error('Error populating activities:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
populateActivities(); 