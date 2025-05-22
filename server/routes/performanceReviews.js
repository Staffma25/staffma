const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const PerformanceReview = require('../models/PerformanceReview');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// POST route to create a new performance review
router.post('/employees/:employeeId/performance-reviews', auth, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    
    // First check if employee exists
    const employeeExists = await Employee.exists({ _id: employeeId });
    if (!employeeExists) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create and save the performance review
    const newReview = new PerformanceReview({
      employeeId: employeeId,
      businessId: req.user.businessId,
      reviewDate: new Date(),
      reviewerName: req.body.reviewerName,
      rating: req.body.rating,
      comments: req.body.comments,
      goals: Array.isArray(req.body.goals) ? req.body.goals : [],
      strengths: Array.isArray(req.body.strengths) ? req.body.strengths : [],
      areasForImprovement: Array.isArray(req.body.areasForImprovement) ? req.body.areasForImprovement : [],
      trainingRecommendations: Array.isArray(req.body.trainingRecommendations) ? req.body.trainingRecommendations : []
    });

    const savedReview = await newReview.save();

    // Update employee's performanceReviews array using updateOne
    await Employee.updateOne(
      { _id: employeeId },
      { $push: { performanceReviews: savedReview._id } }
    );

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({ message: 'Error creating performance review', error: error.message });
  }
});

// GET route to fetch all performance reviews
router.get('/performance-reviews', auth, async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({ businessId: req.user.businessId })
      .populate('employeeId', 'firstName lastName');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Add a new route to get review statistics
router.get('/performance-reviews/stats', auth, async (req, res) => {
  try {
    const pendingReviews = await PerformanceReview.countDocuments({
      businessId: req.user.businessId,
      'goals.status': 'pending'
    });

    const completedReviews = await PerformanceReview.countDocuments({
      businessId: req.user.businessId,
      'goals.status': 'completed'
    });

    res.json({ pendingReviews, completedReviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching review statistics', error: error.message });
  }
});

module.exports = router; 