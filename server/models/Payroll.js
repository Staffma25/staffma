const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeNumber: {
    type: String,
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    items: [{
      name: String,
      amount: Number
    }],
    total: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    items: [{
      name: String,
      amount: Number
    }],
    total: {
      type: Number,
      default: 0
    }
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['processed', 'approved', 'paid', 'failed'],
    default: 'processed'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['staffpesa_wallet', 'bank_transfer'],
    trim: true
  },
  paymentReference: {
    type: String,
    trim: true
  },
  processedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payroll', PayrollSchema); 