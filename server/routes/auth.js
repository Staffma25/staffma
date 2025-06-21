const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

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
      { expiresIn: '1h' }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { 
        businessId: business._id,
        type: 'business'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and business data (excluding password)
    res.json({
      token,
      refreshToken,
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
// @desc    Login user (business or system user)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // First try to find a business user
    let business = await Business.findOne({ email });
    if (business) {
      console.log('Found business user');
      // Validate business password
      const isMatch = await bcrypt.compare(password, business.password);
      if (isMatch) {
        console.log('Business password matched');
        // Create JWT token
        const token = jwt.sign(
          { 
            businessId: business._id,
            type: 'business'
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
          { 
            businessId: business._id,
            type: 'business'
          },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        // Return token and business data
        return res.json({
          token,
          refreshToken,
          user: {
            id: business._id,
            businessName: business.businessName,
            email: business.email,
            type: 'business'
          }
        });
      }
      console.log('Business password did not match');
    }

    // If not a business user, try to find a system user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate user password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('System user password did not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('System user account is inactive');
      return res.status(400).json({ message: 'Account is inactive' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        businessId: user.businessId,
        type: 'user',
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        businessId: user.businessId,
        type: 'user',
        role: user.role
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and user data
    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        type: 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user (business or system user)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // If it's a business user
    if (req.user.type === 'business') {
      const business = await Business.findById(req.user.businessId).select('-password');
      if (!business) {
        return res.status(404).json({ message: 'Business not found' });
      }
      return res.json({
        ...business.toObject(),
        type: 'business'
      });
    }
    
    // If it's a system user
    if (req.user.type === 'user') {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({
        ...user.toObject(),
        type: 'user'
      });
    }

    return res.status(400).json({ message: 'Invalid user type' });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log('Password reset email sent successfully to:', email);
      res.json({ message: 'Password reset email sent' });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Password must contain at least one letter, one number, and one special character')
], async (req, res) => {
  try {
    console.log('Password reset attempt with token:', req.params.token);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Password validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('No user found with valid reset token');
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset email.' 
      });
    }

    console.log('Found user for password reset:', { 
      userId: user._id,
      email: user.email,
      businessId: user.businessId,
      role: user.role
    });

    // Verify the business exists
    const business = await Business.findById(user.businessId);
    if (!business) {
      console.error('Business not found for user:', user.businessId);
      return res.status(500).json({ error: 'System configuration error' });
    }

    // Update user's password and clear reset token
    user.password = password; // Let the pre-save hook handle hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    try {
      await user.save();
      console.log('Password reset successful for user:', {
        userId: user._id,
        email: user.email,
        businessId: user.businessId,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      });
      
      // Verify the password was hashed correctly
      const isMatch = await user.comparePassword(password);
      console.log('Verification of new password:', isMatch);
      
      if (!isMatch) {
        console.error('Password verification failed after reset');
        return res.status(500).json({ error: 'Error setting new password. Please try again.' });
      }

      res.json({ 
        message: 'Password reset successful. You can now log in with your new password.' 
      });
    } catch (saveError) {
      console.error('Error saving user after password reset:', saveError);
      res.status(500).json({ error: 'Error saving new password. Please try again.' });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token. Please request a new verification email.'
      });
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully. You can now log in to your account.'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Server error during email verification' });
  }
});

// Test email route
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Testing email service with:', email);
    
    // Test password reset email
    const testToken = 'test-token-123';
    await sendPasswordResetEmail(email, testToken);
    
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/auth/create-user
// @desc    Create a new system user
// @access  Private
router.post('/create-user', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, permissions } = req.body;
    console.log('Creating new system user:', { email, role });

    // Ensure the creator has admin privileges
    if (req.user.type !== 'user' || !req.user.role.includes('admin')) {
      console.log('Unauthorized user creation attempt:', req.user);
      return res.status(403).json({ error: 'Unauthorized to create users' });
    }

    // Verify the business exists
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      console.error('Business not found for admin:', req.user.businessId);
      return res.status(500).json({ error: 'System configuration error' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      permissions,
      businessId: business._id, // Use the business ID of the admin creating the user
      isActive: true,
      isVerified: true
    });

    await user.save();
    console.log('New system user created successfully:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      createdBy: req.user.userId
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error during user creation' });
  }
});

// @route   POST api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Handle different user types
    if (decoded.type === 'business') {
      const business = await Business.findById(decoded.businessId);
      if (!business) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          businessId: business._id,
          type: 'business'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token: newToken });
    } else if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          userId: user._id,
          businessId: user.businessId,
          type: 'user',
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token: newToken });
    } else if (decoded.type === 'staffma') {
      const staffmaUser = await StaffmaUser.findById(decoded.userId);
      if (!staffmaUser || staffmaUser.status !== 'active') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          userId: staffmaUser._id,
          email: staffmaUser.email,
          role: staffmaUser.role,
          type: 'staffma'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token: newToken });
    } else {
      return res.status(401).json({ error: 'Invalid token type' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token has expired' });
    }
    res.status(500).json({ error: 'Server error during token refresh' });
  }
});

module.exports = router; 