const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');

// Get all users (for admin, business users, and HR managers)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin, business user, or HR manager
    if (req.user.type !== 'admin' && req.user.type !== 'business' && req.user.type !== 'hr_manager') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only administrators, business users, and HR managers can access user management'
      });
    }

    // If HR manager, only show employees
    const query = req.user.type === 'hr_manager' 
      ? { businessId: req.user.businessId, type: 'employee' }
      : { businessId: req.user.businessId };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin, business user, or HR manager
    if (req.user.type !== 'admin' && req.user.type !== 'business' && req.user.type !== 'hr_manager') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only administrators, business users, and HR managers can update users'
      });
    }

    const { firstName, lastName, email, type, status } = req.body;
    const userId = req.params.id;

    // Find the user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // HR managers can only update employees
    if (req.user.type === 'hr_manager') {
      if (userToUpdate.type !== 'employee') {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'HR managers can only update employee accounts'
        });
      }
    }

    // Only admins and business users can change user type
    if (type && req.user.type === 'hr_manager') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only administrators and business users can change user roles'
      });
    }

    // Update user fields
    if (firstName) userToUpdate.firstName = firstName;
    if (lastName) userToUpdate.lastName = lastName;
    if (email) userToUpdate.email = email;
    if (type && (req.user.type === 'admin' || req.user.type === 'business')) userToUpdate.type = type;
    if (status) userToUpdate.status = status;

    // Save the updated user
    await userToUpdate.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins and business users can delete users
    if (req.user.type !== 'admin' && req.user.type !== 'business') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only administrators and business users can delete users'
      });
    }

    const userId = req.params.id;

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Invalid operation',
        message: 'You cannot delete your own account'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
});

// Create new user
router.post(
  '/',
  auth,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('type').optional().isIn(['admin', 'business', 'hr_manager'])
  ],
  async (req, res) => {
    try {
      // Check if user is admin, business user, or HR manager
      if (req.user.type !== 'admin' && req.user.type !== 'business' && req.user.type !== 'hr_manager') {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'Only administrators, business users, and HR managers can create users'
        });
      }

      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, type } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // HR managers cannot create users of other types
      if (req.user.type === 'hr_manager' && type && type !== 'hr_manager') {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'HR managers can only create HR manager accounts'
        });
      }

      // Set default permissions based on user type
      const defaultPermissions = {
        admin: {
          employeeManagement: { add: true, edit: true, delete: true, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
          payrollManagement: { processPayroll: true, configureSalary: true, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: true, viewReports: true },
          performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
          userManagement: { createUsers: true, assignRoles: true, modifyPermissions: true, manageAccounts: true, resetPasswords: true, manageSecurity: true },
          financialServices: { configureAdvances: true, approveAdvances: true, manageWallet: true, viewTransactions: true, configurePayments: true },
          systemAdministration: { configureSettings: true, manageIntegrations: true, handleBackups: true, viewAuditTrail: true, manageNotifications: true },
          leaveManagement: { applyLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
        },
        hr_manager: {
          employeeManagement: { add: true, edit: true, delete: false, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
          payrollManagement: { processPayroll: true, configureSalary: false, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: false, viewReports: true },
          performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
          userManagement: { createUsers: true, assignRoles: false, modifyPermissions: false, manageAccounts: true, resetPasswords: true, manageSecurity: false },
          financialServices: { configureAdvances: false, approveAdvances: true, manageWallet: false, viewTransactions: true, configurePayments: false },
          systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: true, manageNotifications: false },
          leaveManagement: { applyLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
        },
        business: {
          employeeManagement: { add: true, edit: true, delete: false, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
          payrollManagement: { processPayroll: true, configureSalary: false, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: false, viewReports: true },
          performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
          userManagement: { createUsers: true, assignRoles: false, modifyPermissions: false, manageAccounts: true, resetPasswords: true, manageSecurity: false },
          financialServices: { configureAdvances: false, approveAdvances: true, manageWallet: false, viewTransactions: true, configurePayments: false },
          systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: true, manageNotifications: false },
          leaveManagement: { applyLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
        }
      };

      // Create new user with appropriate permissions
      user = new User({
        firstName,
        lastName,
        email,
        password,
        type: type || 'hr_manager',
        businessId: req.user.businessId,
        permissions: defaultPermissions[type || 'hr_manager'],
        status: 'active',
        sessionTimeout: type === 'admin' ? 28800 : 14400 // 8 hours for admin, 4 hours for others
      });

      // Generate verification token
      const verificationToken = user.generateVerificationToken();
      
      // Generate password reset token for initial setup
      const resetToken = user.generatePasswordResetToken();

      // Save user
      await user.save();

      // Send welcome email
      await sendWelcomeEmail(email, firstName);

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      // Send password setup email
      await sendPasswordResetEmail(email, resetToken);

      // Return user data (excluding password)
      const userData = user.toObject();
      delete userData.password;

      res.status(201).json({
        message: 'User created successfully',
        user: userData
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        error: 'Failed to create user',
        details: error.message 
      });
    }
  }
);

module.exports = router; 


