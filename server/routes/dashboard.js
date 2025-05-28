const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Business = require('../models/Business');

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    // Get business details
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get employee count
    const employeeCount = await Employee.countDocuments({ businessId: req.user.businessId });
    const remainingSlots = business.maxEmployees - employeeCount;

    // Get user count
    const userCount = await User.countDocuments({ businessId: req.user.businessId });
    const activeUsers = await User.countDocuments({ 
      businessId: req.user.businessId,
      isActive: true 
    });

    // Get payroll summary
    const employees = await Employee.find({ businessId: req.user.businessId });
    const payrollSummary = employees.reduce((acc, employee) => {
      const basic = employee.salary.basic || 0;
      const allowances = Object.values(employee.salary.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
      const deductions = Object.values(employee.salary.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
      
      acc.totalGrossSalary += basic + allowances;
      acc.totalNetSalary += basic + allowances - deductions;
      return acc;
    }, { totalGrossSalary: 0, totalNetSalary: 0 });

    // Get performance review stats
    const performanceReviewsStats = {
      pendingReviews: 0, // You can implement this based on your performance review model
      completedReviews: 0
    };

    // Get recent employees
    const recentEmployees = await Employee.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName position department startDate');

    // Get recent users
    const recentUsers = await User.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role isActive');

    res.json({
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
      recentEmployees,
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 