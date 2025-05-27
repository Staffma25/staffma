const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Business = require('../models/Business');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new business
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { businessName, email, password } = req.body;

    // Check if business already exists
    let business = await Business.findOne({ email });
    if (business) {
      return res.status(400).json({ message: 'Business already exists' });
    }

    // Create new business
    business = new Business({
      businessName,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    business.password = await bcrypt.hash(password, salt);

    // Save business
    await business.save();

    // Create JWT token
    const token = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and business data (excluding password)
    res.json({
      token,
      user: {
        id: business._id,
        businessName: business.businessName,
        email: business.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Login business
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if business exists
    const business = await Business.findOne({ email });
    if (!business) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and business data (excluding password)
    res.json({
      token,
      user: {
        id: business._id,
        businessName: business.businessName,
        email: business.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/me
// @desc    Get current business
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId).select('-password');
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 