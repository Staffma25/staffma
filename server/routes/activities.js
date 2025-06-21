const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');
const Business = require('../models/Business');
const User = require('../models/User');

// Helper function to check if user is a Staffma administrator
const isStaffmaAdmin = (user) => {
  return user && user.type === 'staffma' && ['super_admin', 'admin'].includes(user.role);
};

// @route   GET api/activities/summary
// @desc    Get activity summary statistics
// @access  Private (Staffma users only)
router.get('/summary', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can access activity summaries'
      });
    }

    // Get total activities count
    const totalActivities = await Activity.countDocuments();

    // Get activities by category
    const activitiesByCategory = await Activity.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get activities by severity
    const activitiesBySeverity = await Activity.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get activities by status
    const activitiesByStatus = await Activity.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent activities (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivities = await Activity.find({
      timestamp: { $gte: oneDayAgo }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('businessId', 'businessName')
    .populate('userId', 'firstName lastName');

    // Get unique businesses count
    const uniqueBusinesses = await Activity.distinct('businessId');

    // Get unique users count
    const uniqueUsers = await Activity.distinct('userId');

    // Convert aggregation results to objects
    const categoryStats = {};
    activitiesByCategory.forEach(item => {
      categoryStats[item._id] = item.count;
    });

    const severityStats = {};
    activitiesBySeverity.forEach(item => {
      severityStats[item._id] = item.count;
    });

    const statusStats = {};
    activitiesByStatus.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      totalActivities,
      activitiesByCategory: categoryStats,
      activitiesBySeverity: severityStats,
      activitiesByStatus: statusStats,
      recentActivities,
      uniqueBusinesses: uniqueBusinesses.length,
      uniqueUsers: uniqueUsers.length
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity summary',
      details: error.message 
    });
  }
});

// @route   GET api/activities/export
// @desc    Export activities to CSV
// @access  Private (Staffma users only)
router.get('/export', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can export activities'
      });
    }

    const {
      category,
      severity,
      status,
      dateRange,
      businessId,
      userId,
      employeeId
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (businessId) filter.businessId = businessId;
    if (userId) filter.userId = userId;
    if (employeeId) filter.employeeId = employeeId;

    // Handle date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      filter.timestamp = { $gte: startDate };
    }

    // Get activities with populated fields
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .populate('businessId', 'businessName email')
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName email');

    // Create CSV content
    const csvHeaders = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Severity',
      'Status',
      'Business',
      'User',
      'Employee',
      'IP Address',
      'User Agent',
      'Timestamp',
      'Details'
    ];

    const csvRows = activities.map(activity => [
      activity._id,
      activity.title,
      activity.description,
      activity.category,
      activity.severity,
      activity.status,
      activity.businessId?.businessName || '',
      activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : '',
      activity.employeeId ? `${activity.employeeId.firstName} ${activity.employeeId.lastName}` : '',
      activity.ipAddress || '',
      activity.userAgent || '',
      activity.timestamp,
      JSON.stringify(activity.details || {})
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activities-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting activities:', error);
    res.status(500).json({ 
      error: 'Failed to export activities',
      details: error.message 
    });
  }
});

// @route   GET api/activities
// @desc    Get all activities with optional filtering
// @access  Private (Staffma users only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user (system administrator)
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can access activity logs'
      });
    }

    const {
      category,
      severity,
      status,
      dateRange,
      businessId,
      userId,
      employeeId,
      limit = 50,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (businessId) filter.businessId = businessId;
    if (userId) filter.userId = userId;
    if (employeeId) filter.employeeId = employeeId;

    // Handle date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
      }

      filter.timestamp = { $gte: startDate };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activities with pagination
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('businessId', 'businessName email')
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName email');

    // Get total count for pagination
    const totalActivities = await Activity.countDocuments(filter);

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNextPage: skip + activities.length < totalActivities,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    });
  }
});

// @route   GET api/activities/businesses
// @desc    Get all businesses with their activity statistics
// @access  Private (Staffma users only)
router.get('/businesses', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can access business activity data'
      });
    }

    // Get all businesses with their activity counts
    const businessesWithActivities = await Business.aggregate([
      {
        $lookup: {
          from: 'activities',
          localField: '_id',
          foreignField: 'businessId',
          as: 'activities'
        }
      },
      {
        $addFields: {
          totalActivities: { $size: '$activities' },
          recentActivities: {
            $filter: {
              input: '$activities',
              as: 'activity',
              cond: {
                $gte: [
                  '$$activity.timestamp',
                  new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                ]
              }
            }
          },
          criticalActivities: {
            $filter: {
              input: '$activities',
              as: 'activity',
              cond: { $eq: ['$$activity.severity', 'critical'] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          businessName: 1,
          email: 1,
          totalActivities: 1,
          recentActivitiesCount: { $size: '$recentActivities' },
          criticalActivitiesCount: { $size: '$criticalActivities' },
          lastActivity: { $max: '$activities.timestamp' },
          createdAt: 1
        }
      },
      {
        $sort: { totalActivities: -1 }
      }
    ]);

    // Get overall statistics
    const totalBusinesses = businessesWithActivities.length;
    const activeBusinesses = businessesWithActivities.filter(b => b.totalActivities > 0).length;
    const totalActivities = businessesWithActivities.reduce((sum, b) => sum + b.totalActivities, 0);
    const totalCriticalActivities = businessesWithActivities.reduce((sum, b) => sum + b.criticalActivitiesCount, 0);

    // Get recent activities across all businesses (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivities = await Activity.find({
      timestamp: { $gte: oneDayAgo }
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('businessId', 'businessName')
    .populate('userId', 'firstName lastName')
    .populate('employeeId', 'firstName lastName');

    res.json({
      businesses: businessesWithActivities,
      statistics: {
        totalBusinesses,
        activeBusinesses,
        totalActivities,
        totalCriticalActivities,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Error fetching business activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business activities',
      details: error.message 
    });
  }
});

// @route   GET api/activities/business/:businessId
// @desc    Get activities for a specific business
// @access  Private (Staffma users only)
router.get('/business/:businessId', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can access business activity data'
      });
    }

    const { businessId } = req.params;
    const {
      category,
      severity,
      status,
      dateRange,
      limit = 50,
      page = 1
    } = req.query;

    // Build filter object
    const filter = { businessId };

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    // Handle date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      filter.timestamp = { $gte: startDate };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activities for the specific business
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('businessId', 'businessName email')
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName email');

    // Get total count for pagination
    const totalActivities = await Activity.countDocuments(filter);

    // Get business details
    const business = await Business.findById(businessId).select('businessName email createdAt');

    // Get activity statistics for this business
    const activityStats = await Activity.aggregate([
      { $match: { businessId: businessId } },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          criticalActivities: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          highActivities: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          mediumActivities: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
          lowActivities: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      business,
      activities,
      statistics: activityStats[0] || {
        totalActivities: 0,
        criticalActivities: 0,
        highActivities: 0,
        mediumActivities: 0,
        lowActivities: 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNextPage: skip + activities.length < totalActivities,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching business activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business activities',
      details: error.message 
    });
  }
});

// @route   GET api/activities/:id
// @desc    Get specific activity by ID
// @access  Private (Staffma users only)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can access activity details'
      });
    }

    const activity = await Activity.findById(req.params.id)
      .populate('businessId', 'businessName email')
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName email');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity',
      details: error.message 
    });
  }
});

// @route   DELETE api/activities/:id
// @desc    Delete specific activity
// @access  Private (Staffma users only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can delete activities'
      });
    }

    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ 
      error: 'Failed to delete activity',
      details: error.message 
    });
  }
});

// @route   DELETE api/activities
// @desc    Bulk delete activities
// @access  Private (Staffma users only)
router.delete('/', auth, async (req, res) => {
  try {
    // Check if user is a Staffma user
    if (!isStaffmaAdmin(req.user)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only Staffma administrators can delete activities'
      });
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Activity IDs are required' });
    }

    const result = await Activity.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `${result.deletedCount} activities deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting activities:', error);
    res.status(500).json({ 
      error: 'Failed to delete activities',
      details: error.message 
    });
  }
});

module.exports = router; 