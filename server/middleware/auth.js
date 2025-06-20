const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const StaffmaUser = require('../models/StaffmaUser');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle Staffma user
    if (decoded.type === 'staffma') {
      const staffmaUser = await StaffmaUser.findById(decoded.userId).select('-password');
      if (!staffmaUser) {
        console.error('Staffma user not found for ID:', decoded.userId);
        return res.status(401).json({ message: 'Staffma user not found' });
      }

      // Check if user is active
      if (staffmaUser.status !== 'active') {
        return res.status(401).json({ message: 'Staffma user account is not active' });
      }

      req.user = {
        ...staffmaUser.toObject(),
        type: 'staffma',
        userId: staffmaUser._id,
        hasPermission: staffmaUser.hasPermission.bind(staffmaUser)
      };
      return next();
    }
    
    // Handle business user
    if (decoded.type === 'business') {
      const business = await Business.findById(decoded.businessId).select('-password');
      if (!business) {
        console.error('Business not found for ID:', decoded.businessId);
        return res.status(401).json({ message: 'Business not found' });
      }
      
      // Define business user permissions
      const businessPermissions = {
        leaveManagement: {
          applyLeave: true,
          approveLeave: true,
          viewAllLeaves: true,
          manageLeaveTypes: true,
          generateLeaveReports: true
        },
        employeeManagement: {
          view: true,
          add: true,
          edit: true,
          delete: true
        },
        payrollManagement: {
          view: true,
          generate: true,
          edit: true
        },
        performanceManagement: {
          view: true,
          create: true,
          edit: true
        }
      };

      req.user = {
        ...business.toObject(),
        type: 'business',
        businessId: business._id,
        permissions: businessPermissions,
        hasPermission: (module, action) => {
          return businessPermissions[module] && businessPermissions[module][action] === true;
        }
      };
      return next();
    }
    
    // Handle system user
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.error('User not found for ID:', decoded.userId);
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'User account is inactive' });
      }

      // Check if user has businessId
      if (!user.businessId) {
        console.error('User has no businessId:', user._id);
        return res.status(401).json({ message: 'User is not associated with any business' });
      }

      req.user = {
        ...user.toObject(),
        type: 'user',
        businessId: user.businessId,
        hasPermission: user.hasPermission.bind(user)
      };
      return next();
    }

    return res.status(401).json({ message: 'Invalid user type' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
  }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};