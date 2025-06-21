const express = require('express');
const jwt = require('jsonwebtoken');
const StaffmaUser = require('../models/StaffmaUser');
const auth = require('../middleware/auth');
const router = express.Router();

// Register new Staffma user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await StaffmaUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if this is the first user (should be super admin)
    const userCount = await StaffmaUser.countDocuments();
    let finalRole = role;

    if (userCount === 0) {
      // First user must be super admin
      finalRole = 'super_admin';
      console.log('Creating first Staffma super admin user');
    } else if (role === 'super_admin') {
      // Only allow super admin creation if no super admin exists
      const superAdminExists = await StaffmaUser.findOne({ role: 'super_admin' });
      if (superAdminExists) {
        return res.status(400).json({ message: 'Super admin already exists' });
      }
    }

    // Create new Staffma user
    const staffmaUser = new StaffmaUser({
      firstName,
      lastName,
      email,
      password,
      role: finalRole,
      isEmailVerified: true, // Auto-verify for now
      status: 'active'
    });

    await staffmaUser.save();

    console.log('Staffma user created successfully:', {
      id: staffmaUser._id,
      email: staffmaUser.email,
      role: staffmaUser.role,
      firstName: staffmaUser.firstName,
      lastName: staffmaUser.lastName
    });

    res.status(201).json({
      message: 'Staffma user created successfully',
      user: {
        id: staffmaUser._id,
        firstName: staffmaUser.firstName,
        lastName: staffmaUser.lastName,
        email: staffmaUser.email,
        role: staffmaUser.role
      }
    });

  } catch (error) {
    console.error('Staffma registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Staffma user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const staffmaUser = await StaffmaUser.findOne({ email });
    if (!staffmaUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (staffmaUser.status !== 'active') {
      return res.status(400).json({ message: 'Account is not active' });
    }

    // Check password
    const isPasswordValid = await staffmaUser.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    staffmaUser.lastLogin = new Date();
    await staffmaUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: staffmaUser._id,
        email: staffmaUser.email,
        role: staffmaUser.role,
        type: 'staffma' // Distinguish from business users
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        userId: staffmaUser._id,
        email: staffmaUser.email,
        role: staffmaUser.role,
        type: 'staffma'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Staffma login successful:', {
      id: staffmaUser._id,
      email: staffmaUser.email,
      role: staffmaUser.role,
      firstName: staffmaUser.firstName,
      lastName: staffmaUser.lastName
    });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: staffmaUser._id,
        firstName: staffmaUser.firstName,
        lastName: staffmaUser.lastName,
        email: staffmaUser.email,
        role: staffmaUser.role,
        permissions: staffmaUser.permissions,
        type: 'staffma'
      }
    });

  } catch (error) {
    console.error('Staffma login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current Staffma user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (req.user.type !== 'staffma') {
      return res.status(403).json({ message: 'Access denied. Staffma users only.' });
    }

    // The auth middleware has already fetched and prepared the user object.
    // We just need to return it for consistency with the /api/auth/me endpoint.
    res.json(req.user);

  } catch (error) {
    console.error('Get Staffma profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all Staffma users (admin only)
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user with admin permissions
    if (req.user.type !== 'staffma') {
      return res.status(403).json({ message: 'Access denied. Staffma users only.' });
    }

    const currentUser = await StaffmaUser.findById(req.user.userId);
    if (!currentUser || !currentUser.hasPermission('userManagement', 'manageStaffmaUsers')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const users = await StaffmaUser.find({}).select('-password').sort({ createdAt: -1 });

    res.json({
      users: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        createdBy: user.createdBy
      }))
    });

  } catch (error) {
    console.error('Get Staffma users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new Staffma user (admin only)
router.post('/users', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user with admin permissions
    if (req.user.type !== 'staffma') {
      return res.status(403).json({ message: 'Access denied. Staffma users only.' });
    }

    const currentUser = await StaffmaUser.findById(req.user.userId);
    if (!currentUser || !currentUser.hasPermission('userManagement', 'createStaffmaUsers')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await StaffmaUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new Staffma user
    const staffmaUser = new StaffmaUser({
      firstName,
      lastName,
      email,
      password,
      role,
      isEmailVerified: true,
      status: 'active',
      createdBy: req.user.userId
    });

    await staffmaUser.save();

    res.status(201).json({
      message: 'Staffma user created successfully',
      user: {
        id: staffmaUser._id,
        firstName: staffmaUser.firstName,
        lastName: staffmaUser.lastName,
        email: staffmaUser.email,
        role: staffmaUser.role
      }
    });

  } catch (error) {
    console.error('Create Staffma user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Staffma user (admin only)
router.put('/users/:id', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user with admin permissions
    if (req.user.type !== 'staffma') {
      return res.status(403).json({ message: 'Access denied. Staffma users only.' });
    }

    const currentUser = await StaffmaUser.findById(req.user.userId);
    if (!currentUser || !currentUser.hasPermission('userManagement', 'manageStaffmaUsers')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { firstName, lastName, email, role, status } = req.body;
    const userId = req.params.id;

    const staffmaUser = await StaffmaUser.findById(userId);
    if (!staffmaUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (firstName) staffmaUser.firstName = firstName;
    if (lastName) staffmaUser.lastName = lastName;
    if (email) staffmaUser.email = email;
    if (role) staffmaUser.role = role;
    if (status) staffmaUser.status = status;

    await staffmaUser.save();

    res.json({
      message: 'Staffma user updated successfully',
      user: {
        id: staffmaUser._id,
        firstName: staffmaUser.firstName,
        lastName: staffmaUser.lastName,
        email: staffmaUser.email,
        role: staffmaUser.role,
        status: staffmaUser.status
      }
    });

  } catch (error) {
    console.error('Update Staffma user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Staffma user (admin only)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user with admin permissions
    if (req.user.type !== 'staffma') {
      return res.status(403).json({ message: 'Access denied. Staffma users only.' });
    }

    const currentUser = await StaffmaUser.findById(req.user.userId);
    if (!currentUser || !currentUser.hasPermission('userManagement', 'manageStaffmaUsers')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const userId = req.params.id;

    // Prevent deleting self
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const staffmaUser = await StaffmaUser.findById(userId);
    if (!staffmaUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting super admin
    if (staffmaUser.role === 'super_admin') {
      return res.status(400).json({ message: 'Cannot delete super admin account' });
    }

    await StaffmaUser.findByIdAndDelete(userId);

    res.json({ message: 'Staffma user deleted successfully' });

  } catch (error) {
    console.error('Delete Staffma user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 