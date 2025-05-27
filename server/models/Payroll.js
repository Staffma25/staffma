const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
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
    type: Map,
    of: Number,
    default: {}
  },
  deductions: {
    type: Map,
    of: Number,
    default: {}
  },
  netSalary: {
    type: Number,
    required: true
  },
  processedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payroll', PayrollSchema); 