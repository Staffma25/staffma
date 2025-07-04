const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Business = require('../models/Business');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    console.log('Dashboard request received for user:', {
      userId: req.user._id,
      userType: req.user.type,
      businessId: req.user.businessId,
      email: req.user.email
    });

    // Get business details
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      console.error('Business not found for ID:', req.user.businessId);
      return res.status(404).json({ error: 'Business not found' });
    }

    console.log('Found business:', {
      businessId: business._id,
      businessName: business.businessName,
      email: business.email
    });

    // Get employee count
    const employeeCount = await Employee.countDocuments({ businessId: req.user.businessId });
    const maxEmployees = business.maxEmployees || 100; // Default to 100 if not set
    const remainingSlots = maxEmployees - employeeCount;

    console.log('Employee count for business:', {
      businessId: req.user.businessId,
      totalEmployees: employeeCount,
      maxEmployees: maxEmployees,
      remainingSlots
    });

    // Get user count
    const userCount = await User.countDocuments({ businessId: req.user.businessId });
    const activeUsers = await User.countDocuments({ 
      businessId: req.user.businessId,
      isActive: true 
    });

    console.log('User count for business:', {
      businessId: req.user.businessId,
      totalUsers: userCount,
      activeUsers
    });

    // Get payroll summary from actual payroll records (current month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const payrollStats = await Payroll.aggregate([
      {
        $match: {
          businessId: req.user.businessId,
          month: currentMonth,
          year: currentYear
        }
      },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          totalAllowances: { $sum: '$allowances.total' },
          totalDeductions: { $sum: '$deductions.total' }
        }
      }
    ]);

    const payrollSummary = payrollStats[0] || {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0
    };

    console.log('Payroll summary for business:', {
      businessId: req.user.businessId,
      month: currentMonth,
      year: currentYear,
      totalGrossSalary: payrollSummary.totalGrossSalary,
      totalNetSalary: payrollSummary.totalNetSalary,
      totalAllowances: payrollSummary.totalAllowances,
      totalDeductions: payrollSummary.totalDeductions
    });

    // Get performance review stats
    const performanceReviewsStats = {
      pendingReviews: 0, // You can implement this based on your performance review model
      completedReviews: 0
    };

    // Get leave management stats
    const leaveManagementStats = {
      pendingLeaves: await Leave.countDocuments({ 
        businessId: req.user.businessId, 
        status: 'pending' 
      }),
      approvedLeaves: await Leave.countDocuments({ 
        businessId: req.user.businessId, 
        status: 'approved' 
      }),
      rejectedLeaves: await Leave.countDocuments({ 
        businessId: req.user.businessId, 
        status: 'rejected' 
      })
    };

    // Get recent employees
    const recentEmployees = await Employee.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName position department startDate');

    console.log('Recent employees for business:', {
      businessId: req.user.businessId,
      recentEmployeeCount: recentEmployees.length
    });

    // Get recent users
    const recentUsers = await User.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role isActive');

    console.log('Recent users for business:', {
      businessId: req.user.businessId,
      recentUserCount: recentUsers.length
    });

    const responseData = {
      business,
      metrics: {
        employeeCount: {
          total: employeeCount,
          remaining: remainingSlots
        },
        userCount: {
          total: userCount,
          active: activeUsers
        }
      },
      payrollSummary,
      performanceReviewsStats,
      leaveManagementStats,
      recentEmployees,
      recentUsers
    };

    console.log('Sending dashboard response for business:', {
      businessId: req.user.businessId,
      businessName: business.businessName,
      employeeCount: responseData.metrics.employeeCount,
      userCount: responseData.metrics.userCount
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 