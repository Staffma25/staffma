const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffmaUserSchema = new mongoose.Schema({
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
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'support'],
    default: 'admin'
  },
  permissions: {
    systemMonitoring: {
      viewActivities: { type: Boolean, default: true },
      viewAnalytics: { type: Boolean, default: true },
      exportData: { type: Boolean, default: true },
      manageAlerts: { type: Boolean, default: true }
    },
    userManagement: {
      createStaffmaUsers: { type: Boolean, default: false },
      manageStaffmaUsers: { type: Boolean, default: false },
      createBusinessUsers: { type: Boolean, default: false },
      manageBusinessUsers: { type: Boolean, default: false }
    },
    businessManagement: {
      viewAllBusinesses: { type: Boolean, default: true },
      manageBusinesses: { type: Boolean, default: false },
      suspendBusinesses: { type: Boolean, default: false },
      deleteBusinesses: { type: Boolean, default: false }
    },
    systemAdministration: {
      configureSystem: { type: Boolean, default: false },
      manageBackups: { type: Boolean, default: false },
      viewSystemLogs: { type: Boolean, default: true },
      manageIntegrations: { type: Boolean, default: false }
    },
    support: {
      viewSupportTickets: { type: Boolean, default: true },
      respondToTickets: { type: Boolean, default: true },
      escalateTickets: { type: Boolean, default: false }
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
    default: 28800 // 8 hours in seconds
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffmaUser'
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
staffmaUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
staffmaUserSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    const rolePermissions = {
      super_admin: {
        systemMonitoring: { viewActivities: true, viewAnalytics: true, exportData: true, manageAlerts: true },
        userManagement: { createStaffmaUsers: true, manageStaffmaUsers: true, createBusinessUsers: true, manageBusinessUsers: true },
        businessManagement: { viewAllBusinesses: true, manageBusinesses: true, suspendBusinesses: true, deleteBusinesses: true },
        systemAdministration: { configureSystem: true, manageBackups: true, viewSystemLogs: true, manageIntegrations: true },
        support: { viewSupportTickets: true, respondToTickets: true, escalateTickets: true }
      },
      admin: {
        systemMonitoring: { viewActivities: true, viewAnalytics: true, exportData: true, manageAlerts: true },
        userManagement: { createStaffmaUsers: false, manageStaffmaUsers: true, createBusinessUsers: true, manageBusinessUsers: true },
        businessManagement: { viewAllBusinesses: true, manageBusinesses: true, suspendBusinesses: true, deleteBusinesses: false },
        systemAdministration: { configureSystem: false, manageBackups: true, viewSystemLogs: true, manageIntegrations: false },
        support: { viewSupportTickets: true, respondToTickets: true, escalateTickets: true }
      },
      support: {
        systemMonitoring: { viewActivities: true, viewAnalytics: false, exportData: false, manageAlerts: false },
        userManagement: { createStaffmaUsers: false, manageStaffmaUsers: false, createBusinessUsers: false, manageBusinessUsers: false },
        businessManagement: { viewAllBusinesses: true, manageBusinesses: false, suspendBusinesses: false, deleteBusinesses: false },
        systemAdministration: { configureSystem: false, manageBackups: false, viewSystemLogs: false, manageIntegrations: false },
        support: { viewSupportTickets: true, respondToTickets: true, escalateTickets: false }
      }
    };

    this.permissions = rolePermissions[this.role] || rolePermissions.support;
  }
  next();
});

// Method to compare password
staffmaUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has specific permission
staffmaUserSchema.methods.hasPermission = function(module, action) {
  // Super admins have all permissions
  if (this.role === 'super_admin') {
    return true;
  }
  return this.permissions?.[module]?.[action] || false;
};

// Method to check if user is super admin
staffmaUserSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// Method to check if user is admin or super admin
staffmaUserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'super_admin';
};

// Method to get dynamic status based on last login and account activity
staffmaUserSchema.methods.getDynamicStatus = function() {
  // If manually suspended, return suspended
  if (this.status === 'suspended') {
    return 'suspended';
  }
  
  // If no last login, consider inactive
  if (!this.lastLogin) {
    return 'inactive';
  }
  
  const now = new Date();
  const lastLogin = new Date(this.lastLogin);
  const daysSinceLastLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
  
  // If last login was more than 30 days ago, consider inactive
  if (daysSinceLastLogin > 30) {
    return 'inactive';
  }
  
  // If last login was more than 7 days ago, consider idle
  if (daysSinceLastLogin > 7) {
    return 'idle';
  }
  
  // Otherwise, consider active
  return 'active';
};

// Virtual for dynamic status
staffmaUserSchema.virtual('dynamicStatus').get(function() {
  return this.getDynamicStatus();
});

// Ensure virtual fields are serialized
staffmaUserSchema.set('toJSON', { virtuals: true });
staffmaUserSchema.set('toObject', { virtuals: true });

// Static method to create first super admin
staffmaUserSchema.statics.createFirstSuperAdmin = async function(userData) {
  const count = await this.countDocuments();
  if (count > 0) {
    throw new Error('Super admin already exists');
  }
  
  const superAdmin = new this({
    ...userData,
    role: 'super_admin',
    isEmailVerified: true,
    status: 'active'
  });
  
  return superAdmin.save();
};

module.exports = mongoose.model('StaffmaUser', staffmaUserSchema); 