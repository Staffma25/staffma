const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const auth = require('../middleware/auth');

// @route   POST api/payment/complete
// @desc    Complete payment for a business
// @access  Private
router.post('/complete', auth, async (req, res) => {
  try {
    const { 
      plan, 
      billingCycle, 
      amount, 
      transactionId, 
      paymentMethod 
    } = req.body;

    // Find business
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Set max employees based on plan
    let maxEmployees = 10; // default for small
    if (plan === 'medium') {
      maxEmployees = 50;
    } else if (plan === 'large') {
      maxEmployees = 100;
    }

    // Update payment information
    business.payment = {
      status: 'completed',
      plan: plan,
      amount: amount,
      transactionId: transactionId,
      paymentMethod: paymentMethod,
      firstPaymentDate: new Date()
    };

    // Update subscription information
    business.subscription = {
      type: billingCycle,
      status: 'active',
      expiryDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
    };

    // Update max employees
    business.maxEmployees = maxEmployees;

    await business.save();

    res.json({ 
      message: 'Payment completed successfully',
      business: {
        id: business._id,
        businessName: business.businessName,
        email: business.email,
        payment: business.payment,
        subscription: business.subscription,
        maxEmployees: business.maxEmployees
      }
    });
  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/payment/status
// @desc    Get payment status for current business
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({
      payment: business.payment,
      subscription: business.subscription,
      isSuspended: business.isSuspended
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 