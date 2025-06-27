const Business = require('../models/Business');

const paymentAuth = async (req, res, next) => {
  try {
    // Check if user is a business user
    if (req.user.type !== 'business') {
      return next(); // Allow system users to pass through
    }

    // Get business details
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if business is suspended
    if (business.isSuspended) {
      return res.status(403).json({ 
        message: 'Account is suspended. Please contact support.',
        suspended: true 
      });
    }

    // Check payment status
    if (business.payment.status === 'pending') {
      return res.status(402).json({ 
        message: 'Payment required to access dashboard',
        paymentRequired: true,
        businessData: {
          businessName: business.businessName,
          email: business.email,
          businessType: business.businessType,
          applicantName: business.applicantName,
          applicantRole: business.applicantRole,
          businessAddress: business.businessAddress,
          contactNumber: business.contactNumber
        }
      });
    }

    // Check if subscription is active
    if (business.subscription.status === 'inactive') {
      return res.status(402).json({ 
        message: 'Subscription is inactive. Please renew your subscription.',
        subscriptionInactive: true,
        businessData: {
          businessName: business.businessName,
          email: business.email,
          payment: business.payment,
          subscription: business.subscription
        }
      });
    }

    // All checks passed
    req.business = business;
    next();
  } catch (error) {
    console.error('Payment auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = paymentAuth; 