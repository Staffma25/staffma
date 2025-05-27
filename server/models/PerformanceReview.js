const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  targetDate: Date,
  completionDate: Date
});

const performanceMetricSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Quality of Work', 'Productivity', 'Communication', 'Teamwork', 'Initiative', 'Problem Solving']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: String
});

const performanceReviewSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  quarter: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  reviewDate: {
    type: Date,
    required: true
  },
  reviewerName: {
    type: String,
    required: true
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  performanceMetrics: [performanceMetricSchema],
  goals: [goalSchema],
  strengths: [String],
  areasForImprovement: [String],
  trainingRecommendations: [String],
  acknowledgement: {
    employeeSignature: Boolean,
    employeeSignatureDate: Date,
    reviewerSignature: Boolean,
    reviewerSignatureDate: Date
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'acknowledged'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Compound index for efficient quarterly review queries
performanceReviewSchema.index({ employeeId: 1, businessId: 1, year: 1, quarter: 1 }, { unique: true });
performanceReviewSchema.index({ reviewDate: -1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema); 