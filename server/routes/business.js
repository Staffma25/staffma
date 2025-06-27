const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// GET /api/business/health
router.get('/health', (req, res) => {
  res.json({ status: 'business route ok' });
});

// GET /api/business/all - Get all businesses for Staffma dashboard
router.get('/all', auth, async (req, res) => {
  try {
    const businesses = await Business.find({})
      .select('-password') // Exclude password from response
      .populate('employees', 'firstName lastName email')
      .lean();

    // Get real activity statistics for each business
    const businessesWithStats = await Promise.all(businesses.map(async (business) => {
      // Get total activities for this business
      const totalActivities = await Activity.countDocuments({ businessId: business._id });
      
      // Get recent activities (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentActivitiesCount = await Activity.countDocuments({
        businessId: business._id,
        timestamp: { $gte: oneDayAgo }
      });
      
      // Get critical activities
      const criticalActivitiesCount = await Activity.countDocuments({
        businessId: business._id,
        severity: 'critical'
      });
      
      // Get last activity timestamp
      const lastActivity = await Activity.findOne(
        { businessId: business._id },
        { timestamp: 1 },
        { sort: { timestamp: -1 } }
      );

      return {
        ...business,
        totalActivities,
        recentActivitiesCount,
        criticalActivitiesCount,
        lastActivity: lastActivity ? lastActivity.timestamp : null
      };
    }));

    // Calculate overall statistics
    const totalActivities = await Activity.countDocuments({});
    const totalCriticalActivities = await Activity.countDocuments({ severity: 'critical' });

    res.json({
      success: true,
      businesses: businessesWithStats,
      statistics: {
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter(b => !b.isSuspended).length,
        suspendedBusinesses: businesses.filter(b => b.isSuspended).length,
        totalActivities,
        totalCriticalActivities
      }
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
  }
});

// GET /api/business/:id - Get specific business
router.get('/:id', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .select('-password')
      .populate('employees', 'firstName lastName email');
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    res.json({ success: true, business });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch business' });
  }
});

// PUT /api/business/:id - Update business
router.put('/:id', auth, async (req, res) => {
  try {
    const { businessName, email, contactNumber, businessAddress } = req.body;
    
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Update fields
    if (businessName) business.businessName = businessName;
    if (email) business.email = email;
    if (contactNumber) business.contactNumber = contactNumber;
    if (businessAddress) business.businessAddress = businessAddress;

    await business.save();

    res.json({ 
      success: true, 
      message: 'Business updated successfully',
      business: {
        _id: business._id,
        businessName: business.businessName,
        email: business.email,
        contactNumber: business.contactNumber,
        businessAddress: business.businessAddress,
        isSuspended: business.isSuspended
      }
    });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ success: false, message: 'Failed to update business' });
  }
});

// POST /api/business/:id/suspend - Suspend business
router.post('/:id/suspend', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.isSuspended = true;
    await business.save();

    res.json({ 
      success: true, 
      message: 'Business suspended successfully',
      business: {
        _id: business._id,
        businessName: business.businessName,
        isSuspended: business.isSuspended
      }
    });
  } catch (error) {
    console.error('Error suspending business:', error);
    res.status(500).json({ success: false, message: 'Failed to suspend business' });
  }
});

// POST /api/business/:id/reactivate - Reactivate business
router.post('/:id/reactivate', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.isSuspended = false;
    await business.save();

    res.json({ 
      success: true, 
      message: 'Business reactivated successfully',
      business: {
        _id: business._id,
        businessName: business.businessName,
        isSuspended: business.isSuspended
      }
    });
  } catch (error) {
    console.error('Error reactivating business:', error);
    res.status(500).json({ success: false, message: 'Failed to reactivate business' });
  }
});

// DELETE /api/business/:id - Delete business (optional)
router.delete('/:id', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    await Business.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ success: false, message: 'Failed to delete business' });
  }
});

module.exports = router; 