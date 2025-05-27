const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const PerformanceReview = require('../models/PerformanceReview');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// POST route to create a new performance review
router.post('/employees/:employeeId/performance-reviews', auth, async (req, res) => {
  try {
    console.log('Received review submission request:', {
      employeeId: req.params.employeeId,
      body: req.body,
      user: req.user
    });

    const { employeeId } = req.params;
    const { 
      year, 
      quarter, 
      reviewerName, 
      overallRating, 
      performanceMetrics, 
      goals, 
      strengths, 
      areasForImprovement, 
      trainingRecommendations 
    } = req.body;

    // Validate required fields
    if (!year || !quarter || !reviewerName || !overallRating || !performanceMetrics) {
      console.log('Missing required fields:', { year, quarter, reviewerName, overallRating, performanceMetrics });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['year', 'quarter', 'reviewerName', 'overallRating', 'performanceMetrics']
      });
    }

    // Validate employee exists
    const employee = await Employee.findOne({ 
      _id: employeeId,
      businessId: req.user.businessId 
    });

    if (!employee) {
      console.log('Employee not found:', { employeeId, businessId: req.user.businessId });
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if a review already exists for this employee and quarter
    const existingReview = await PerformanceReview.findOne({
      employeeId,
      businessId: req.user.businessId,
      year: parseInt(year),
      quarter: parseInt(quarter)
    });

    if (existingReview) {
      console.log('Review already exists:', { employeeId, year, quarter });
      return res.status(400).json({ 
        message: 'A review already exists for this employee in this quarter' 
      });
    }

    // Create the review
    const review = new PerformanceReview({
      employeeId,
      businessId: req.user.businessId,
      year: parseInt(year),
      quarter: parseInt(quarter),
      reviewDate: new Date(),
      reviewerName,
      overallRating: parseInt(overallRating),
      performanceMetrics: performanceMetrics.map(metric => ({
        category: metric.category,
        rating: parseInt(metric.rating),
        comments: metric.comments || ''
      })),
      goals: Array.isArray(goals) ? goals.map(goal => ({
        description: goal,
        status: 'pending'
      })) : [],
      strengths: Array.isArray(strengths) ? strengths : [],
      areasForImprovement: Array.isArray(areasForImprovement) ? areasForImprovement : [],
      trainingRecommendations: Array.isArray(trainingRecommendations) ? trainingRecommendations : [],
      status: 'draft'
    });

    console.log('Attempting to save review:', review);

    // Save the review
    const savedReview = await review.save();

    // Populate employee details before sending response
    const populatedReview = await PerformanceReview.findById(savedReview._id)
      .populate('employeeId', 'firstName lastName');

    console.log('Review saved successfully:', populatedReview);

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error creating review',
      error: error.message,
      details: error.stack
    });
  }
});

// GET route to fetch all performance reviews
router.get('/performance-reviews', auth, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const reviews = await PerformanceReview.find({
      businessId: req.user.businessId,
      year: parseInt(year),
      quarter: parseInt(quarter)
    }).populate('employeeId', 'firstName lastName');
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
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

// Update a performance review
router.put('/performance-reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const update = req.body;

    const review = await PerformanceReview.findOneAndUpdate(
      { _id: reviewId, businessId: req.user.businessId },
      update,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// Delete a performance review
router.delete('/performance-reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await PerformanceReview.findOneAndDelete({
      _id: reviewId,
      businessId: req.user.businessId
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

module.exports = router; 