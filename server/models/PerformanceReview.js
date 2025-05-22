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
  }
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
  reviewDate: {
    type: Date,
    required: true
  },
  reviewerName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: true
  },
  goals: [goalSchema],
  strengths: [String],
  areasForImprovement: [String],
  trainingRecommendations: [String],
  acknowledgement: {
    employeeSignature: Boolean,
    employeeSignatureDate: Date,
    reviewerSignature: Boolean,
    reviewerSignatureDate: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
performanceReviewSchema.index({ employeeId: 1, businessId: 1 });
performanceReviewSchema.index({ reviewDate: -1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema); 