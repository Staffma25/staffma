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
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    paye: { type: Number, required: true },
    nhif: { type: Number, required: true },
    nssf: { type: Number, required: true },
    loans: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true }
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