const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  type: {
    type: String,
    enum: ['admin', 'business', 'hr_manager', 'employee'],
    default: 'employee'
  },
  permissions: {
    employeeManagement: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
      manageOnboarding: { type: Boolean, default: false },
      manageDocuments: { type: Boolean, default: false },
      setStatus: { type: Boolean, default: false }
    },
    payrollManagement: {
      processPayroll: { type: Boolean, default: false },
      configureSalary: { type: Boolean, default: false },
      manageAllowances: { type: Boolean, default: false },
      manageDeductions: { type: Boolean, default: false },
      generatePayslips: { type: Boolean, default: false },
      bulkPayments: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false }
    },
    performanceManagement: {
      createReviews: { type: Boolean, default: false },
      viewAllReviews: { type: Boolean, default: false },
      editTemplates: { type: Boolean, default: false },
      generateReports: { type: Boolean, default: false },
      manageTraining: { type: Boolean, default: false },
      trackDevelopment: { type: Boolean, default: false }
    },
    userManagement: {
      createUsers: { type: Boolean, default: false },
      assignRoles: { type: Boolean, default: false },
      modifyPermissions: { type: Boolean, default: false },
      manageAccounts: { type: Boolean, default: false },
      resetPasswords: { type: Boolean, default: false },
      manageSecurity: { type: Boolean, default: false }
    },
    financialServices: {
      configureAdvances: { type: Boolean, default: false },
      approveAdvances: { type: Boolean, default: false },
      manageWallet: { type: Boolean, default: false },
      viewTransactions: { type: Boolean, default: false },
      configurePayments: { type: Boolean, default: false }
    },
    leaveManagement: {
      applyLeave: { type: Boolean, default: true },
      approveLeave: { type: Boolean, default: false },
      viewAllLeaves: { type: Boolean, default: false },
      manageLeaveTypes: { type: Boolean, default: false },
      generateLeaveReports: { type: Boolean, default: false }
    },
    systemAdministration: {
      configureSettings: { type: Boolean, default: false },
      manageIntegrations: { type: Boolean, default: false },
      handleBackups: { type: Boolean, default: false },
      viewAuditTrail: { type: Boolean, default: false },
      manageNotifications: { type: Boolean, default: false }
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  sessionTimeout: {
    type: Number,
    default: 14400 // 4 hours in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('type')) {
    const rolePermissions = {
      admin: {
        employeeManagement: { add: true, edit: true, delete: true, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
        payrollManagement: { processPayroll: true, configureSalary: true, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: true, viewReports: true },
        performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
        userManagement: { createUsers: true, assignRoles: true, modifyPermissions: true, manageAccounts: true, resetPasswords: true, manageSecurity: true },
        financialServices: { configureAdvances: true, approveAdvances: true, manageWallet: true, viewTransactions: true, configurePayments: true },
        systemAdministration: { configureSettings: true, manageIntegrations: true, handleBackups: true, viewAuditTrail: true, manageNotifications: true },
        leaveManagement: { applyForLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
      },
      business: {
        employeeManagement: { add: true, edit: true, delete: true, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
        payrollManagement: { processPayroll: true, configureSalary: true, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: true, viewReports: true },
        performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
        userManagement: { createUsers: true, assignRoles: true, modifyPermissions: true, manageAccounts: true, resetPasswords: true, manageSecurity: true },
        financialServices: { configureAdvances: true, approveAdvances: true, manageWallet: true, viewTransactions: true, configurePayments: true },
        systemAdministration: { configureSettings: true, manageIntegrations: true, handleBackups: true, viewAuditTrail: true, manageNotifications: true },
        leaveManagement: { applyForLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
      },
      hr_manager: {
        employeeManagement: { add: true, edit: true, delete: false, view: true, manageOnboarding: true, manageDocuments: true, setStatus: true },
        payrollManagement: { processPayroll: true, configureSalary: false, manageAllowances: true, manageDeductions: true, generatePayslips: true, bulkPayments: false, viewReports: true },
        performanceManagement: { createReviews: true, viewAllReviews: true, editTemplates: true, generateReports: true, manageTraining: true, trackDevelopment: true },
        userManagement: { createUsers: true, assignRoles: false, modifyPermissions: false, manageAccounts: true, resetPasswords: true, manageSecurity: false },
        financialServices: { configureAdvances: false, approveAdvances: true, manageWallet: false, viewTransactions: true, configurePayments: false },
        systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: true, manageNotifications: false },
        leaveManagement: { applyForLeave: true, approveLeave: true, viewAllLeaves: true, manageLeaveTypes: true, generateLeaveReports: true }
      },
      employee: {
        employeeManagement: { add: false, edit: false, delete: false, view: false, manageOnboarding: false, manageDocuments: false, setStatus: false },
        payrollManagement: { processPayroll: false, configureSalary: false, manageAllowances: false, manageDeductions: false, generatePayslips: false, bulkPayments: false, viewReports: false },
        performanceManagement: { createReviews: false, viewAllReviews: false, editTemplates: false, generateReports: false, manageTraining: false, trackDevelopment: false },
        userManagement: { createUsers: false, assignRoles: false, modifyPermissions: false, manageAccounts: false, resetPasswords: false, manageSecurity: false },
        financialServices: { configureAdvances: false, approveAdvances: false, manageWallet: false, viewTransactions: false, configurePayments: false },
        systemAdministration: { configureSettings: false, manageIntegrations: false, handleBackups: false, viewAuditTrail: false, manageNotifications: false },
        leaveManagement: { applyLeave: true, approveLeave: false, viewAllLeaves: false, manageLeaveTypes: false, generateLeaveReports: false }
      }
    };

    this.permissions = rolePermissions[this.type] || rolePermissions.employee;
    
    // Set session timeout based on role
    this.sessionTimeout = (this.type === 'admin' || this.type === 'business') ? 28800 : 14400; // 8 hours for admin/business, 4 hours for others
  }
  next();
});

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(module, action) {
  return this.permissions[module] && this.permissions[module][action];
};

// Method to check if user can perform multiple permissions
userSchema.methods.hasPermissions = function(permissions) {
  return permissions.every(permission => {
    const [module, action] = permission.split('.');
    return this.hasPermission(module, action);
  });
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  return token;
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      _id: this._id,
      email: this.email,
      type: this.type,
      businessId: this.businessId
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

// Check if user is active
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Check if user is admin, business user, or HR manager
userSchema.methods.canManageUsers = function() {
  return this.type === 'admin' || this.type === 'business' || this.type === 'hr_manager';
};

// Check if user can manage specific user
userSchema.methods.canManageUser = function(targetUser) {
  if (!targetUser) return false;
  
  // Admins and business users can manage any user
  if (this.type === 'admin' || this.type === 'business') {
    return true;
  }
  
  // HR managers can manage employees but not admins or business users
  if (this.type === 'hr_manager') {
    return targetUser.type === 'employee' && 
           this.businessId.toString() === targetUser.businessId.toString();
  }
  
  return false;
};

// Check if user can delete specific user
userSchema.methods.canDeleteUser = function(targetUser) {
  if (!targetUser) return false;
  
  // Cannot delete yourself
  if (this._id.toString() === targetUser._id.toString()) {
    return false;
  }
  
  // Only admins and business users can delete users
  if (this.type === 'admin' || this.type === 'business') {
    return this.businessId.toString() === targetUser.businessId.toString();
  }
  
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 