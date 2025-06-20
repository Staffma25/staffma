const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'employee_management',
      'payroll_management',
      'leave_management',
      'performance_management',
      'user_management',
      'system_administration',
      'security',
      'document_management',
      'financial_services'
    ],
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info',
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ businessId: 1, timestamp: -1 });
activitySchema.index({ category: 1, timestamp: -1 });
activitySchema.index({ severity: 1, timestamp: -1 });
activitySchema.index({ status: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ employeeId: 1, timestamp: -1 });

// Static method to log an activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Static method to get activities with filtering
activitySchema.statics.getActivities = async function(filters = {}, options = {}) {
  try {
    const {
      businessId,
      category,
      severity,
      status,
      userId,
      employeeId,
      dateRange,
      limit = 50,
      page = 1,
      sort = { timestamp: -1 }
    } = options;

    // Build filter object
    const filter = {};

    if (businessId) filter.businessId = businessId;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (employeeId) filter.employeeId = employeeId;

    // Handle date range filtering
    if (dateRange) {
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

    // Get activities with pagination
    const activities = await this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('businessId', 'businessName email')
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName email');

    // Get total count for pagination
    const totalActivities = await this.countDocuments(filter);

    return {
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNextPage: skip + activities.length < totalActivities,
        hasPrevPage: parseInt(page) > 1
      }
    };
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
};

// Static method to get activity summary
activitySchema.statics.getActivitySummary = async function(businessId = null) {
  try {
    const filter = businessId ? { businessId } : {};

    // Get total activities count
    const totalActivities = await this.countDocuments(filter);

    // Get activities by category
    const activitiesByCategory = await this.aggregate([
      ...(businessId ? [{ $match: { businessId: mongoose.Types.ObjectId(businessId) } }] : []),
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
    const activitiesBySeverity = await this.aggregate([
      ...(businessId ? [{ $match: { businessId: mongoose.Types.ObjectId(businessId) } }] : []),
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
    const activitiesByStatus = await this.aggregate([
      ...(businessId ? [{ $match: { businessId: mongoose.Types.ObjectId(businessId) } }] : []),
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
    const recentActivitiesFilter = {
      ...filter,
      timestamp: { $gte: oneDayAgo }
    };

    const recentActivities = await this.find(recentActivitiesFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('businessId', 'businessName')
      .populate('userId', 'firstName lastName');

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

    return {
      totalActivities,
      activitiesByCategory: categoryStats,
      activitiesBySeverity: severityStats,
      activitiesByStatus: statusStats,
      recentActivities
    };
  } catch (error) {
    console.error('Error getting activity summary:', error);
    throw error;
  }
};

// Method to format activity for display
activitySchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    category: this.category,
    severity: this.severity,
    status: this.status,
    timestamp: this.timestamp,
    business: this.businessId,
    user: this.userId,
    employee: this.employeeId,
    details: this.details,
    ipAddress: this.ipAddress,
    userAgent: this.userAgent
  };
};

module.exports = mongoose.model('Activity', activitySchema); 