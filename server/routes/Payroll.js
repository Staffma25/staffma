// server/routes/payroll.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const mongoose = require('mongoose');
const Business = require('../models/Business');
const PayrollSettings = require('../models/PayrollSettings');
const PDFDocument = require('pdfkit');
const { capitalize } = require('lodash');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Import tax calculation functions
const {
  calculatePAYE,
  calculateNHIF,
  calculateNSSF,
  calculatePayroll
} = require('../utils/taxCalculations');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Add this validation helper function
const isValidPayrollPeriod = async (businessId, month, year) => {
  try {
    const business = await Business.findById(businessId);
    if (!business) return false;

    // During development, allow all dates
    return true;

    // Original validation logic (commented out for development)
    /*
    // Get business registration date
    const registrationDate = business.createdAt;
    const requestDate = new Date(year, month - 1); // month is 0-based
    const currentDate = new Date();

    // Cannot process future months
    if (requestDate > currentDate) {
      return false;
    }

    // Cannot process months before business registration
    if (requestDate < registrationDate) {
      return false;
    }

    return true;
    */
  } catch (error) {
    console.error('Error validating payroll period:', error);
    return false;
  }
};

// Stats route
router.get('/stats', auth, async (req, res) => {
  try {
    // Get payroll stats for the current month
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const stats = await Payroll.aggregate([
      {
        $match: {
          businessId: req.user.businessId,
          month,
          year
        }
      },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          totalPAYE: { $sum: '$deductions.paye' },
          totalNHIF: { $sum: '$deductions.nhif' },
          totalNSSF: { $sum: '$deductions.nssf' }
        }
      }
    ]);

    res.status(200).json(stats[0] || {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalPAYE: 0,
      totalNHIF: 0,
      totalNSSF: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Process payroll route
router.post('/process', auth, async (req, res) => {
  try {
    const { month, year } = req.body;

    // Only business users can process payroll
    if (req.user.type !== 'business') {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only business users can process payroll'
      });
    }

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Check if payroll settings exist
    const payrollSettings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!payrollSettings) {
      return res.status(400).json({ error: 'Payroll settings not found' });
    }

    // Log the entire settings object to see its structure
    console.log('Full payroll settings:', JSON.stringify(payrollSettings, null, 2));

    // Get all active employees
    const employees = await Employee.find({ 
      businessId: req.user.businessId,
      status: 'active'
    });

    if (!employees.length) {
      return res.status(400).json({ error: 'No active employees found' });
    }

    // Validate employee data
    const invalidEmployees = employees.filter(employee => 
      !employee.salary?.basic || !employee.employeeNumber
    );

    if (invalidEmployees.length > 0) {
      return res.status(400).json({
        error: 'Invalid employee data',
        message: 'Some employees are missing required data',
        invalidEmployees: invalidEmployees.map(emp => ({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          missingData: [
            !emp.salary?.basic && 'basic salary',
            !emp.employeeNumber && 'employee number'
          ].filter(Boolean)
        }))
      });
    }

    // Process payroll for each employee
    const payrollResults = await Promise.all(employees.map(async (employee) => {
      const basicSalary = employee.salary.basic;
      let totalAllowances = 0;
      let totalDeductions = 0;
      const allowanceItems = [];
      const deductionItems = [];

      console.log('Processing employee:', {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        basicSalary
      });

      // Calculate allowances based on settings
      if (payrollSettings.taxRates?.allowances) {
        payrollSettings.taxRates.allowances.forEach(allowance => {
          if (allowance.enabled) {
            let amount = 0;
            if (allowance.type === 'percentage') {
              amount = (basicSalary * allowance.value) / 100;
            } else {
              amount = allowance.value;
            }
            console.log('Allowance calculation:', {
              name: allowance.name,
              type: allowance.type,
              value: allowance.value,
              calculatedAmount: amount
            });
            totalAllowances += amount;
            allowanceItems.push({
              name: allowance.name,
              amount: amount
            });
          }
        });
      }

      // Calculate deductions based on settings
      if (payrollSettings.taxRates?.customDeductions) {
        payrollSettings.taxRates.customDeductions.forEach(deduction => {
          if (deduction.enabled) {
            let amount = 0;
            if (deduction.type === 'percentage') {
              amount = (basicSalary * deduction.value) / 100;
            } else {
              amount = deduction.value;
            }
            console.log('Deduction calculation:', {
              name: deduction.name,
              type: deduction.type,
              value: deduction.value,
              calculatedAmount: amount
            });
            totalDeductions += amount;
            deductionItems.push({
              name: deduction.name,
              amount: amount
            });
          }
        });
      }

      // Calculate gross salary (basic + allowances)
      const grossSalary = basicSalary + totalAllowances;

      // Calculate net salary (gross - deductions)
      const netSalary = grossSalary - totalDeductions;

      console.log('Final calculations for employee:', {
        id: employee._id,
        basicSalary,
        totalAllowances,
        totalDeductions,
        grossSalary,
        netSalary
      });

      // Create or update payroll record
      const payroll = await Payroll.findOneAndUpdate(
        {
          businessId: req.user.businessId,
          employeeId: employee._id,
          month,
          year
        },
        {
          $set: {
            employeeNumber: employee.employeeNumber,
            basicSalary,
            grossSalary,
            allowances: {
              items: allowanceItems,
              total: totalAllowances
            },
            deductions: {
              items: deductionItems,
              total: totalDeductions
            },
            netSalary,
            status: 'pending',
            processedBy: req.user._id,
            processedDate: new Date()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      return payroll;
    }));

    res.status(200).json({
      message: 'Payroll processed successfully',
      payrolls: payrollResults
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ 
      error: 'Failed to process payroll',
      details: error.message 
    });
  }
});

// Get payroll history
router.get('/history', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    console.log('Query params:', { month, year });

    if (!req.user.businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // For business users, they can always access their history
    // For system users, check permissions
    if (req.user.type === 'user' && !req.user.hasPermission('payrollManagement', 'viewReports')) {
      return res.status(403).json({ message: 'You do not have permission to view payroll history' });
    }

    const query = { 
      businessId: new mongoose.Types.ObjectId(req.user.businessId),
      month: Number(month),
      year: Number(year)
    };

    console.log('Fetching payroll with query:', query);

    const payrollHistory = await Payroll.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName position department employeeNumber'
      })
      .sort({ processedDate: -1 });

    console.log('Query result:', {
      count: payrollHistory.length,
      sample: payrollHistory[0]
    });

    // Send the full array of records
    res.json(payrollHistory);
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid business ID format',
        details: error.message 
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch payroll history',
      details: error.message 
    });
  }
});

// Add a summary endpoint
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required query parameters' 
      });
    }

    const summary = await Payroll.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(req.user.businessId),
          month: Number(month),
          year: Number(year)
        }
      },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          totalPAYE: { $sum: '$deductions.paye' },
          totalNHIF: { $sum: '$deductions.nhif' },
          totalNSSF: { $sum: '$deductions.nssf' }
        }
      }
    ]);

    res.json(summary[0] || {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalPAYE: 0,
      totalNHIF: 0,
      totalNSSF: 0
    });
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payroll summary',
      details: error.message 
    });
  }
});

// Debug endpoint to check all payroll records
router.get('/debug', auth, async (req, res) => {
  try {
    const allPayroll = await Payroll.find({ 
      businessId: new mongoose.Types.ObjectId(req.user.businessId) 
    });
    
    res.json({
      total: allPayroll.length,
      records: allPayroll.map(p => ({
        id: p._id,
        month: p.month,
        year: p.year,
        employeeId: p.employeeId
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payroll settings
router.get('/settings', auth, async (req, res) => {
  try {
    console.log('Fetching payroll settings for business:', req.user.businessId);
    
    if (!req.user.businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // For business users, they can always access their settings
    // For system users, check permissions
    if (req.user.type === 'user' && !req.user.hasPermission('payrollManagement', 'viewReports')) {
      return res.status(403).json({ message: 'You do not have permission to view payroll settings' });
    }

    const settings = await PayrollSettings.findOrCreate(req.user.businessId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payroll settings
router.put('/settings', auth, async (req, res) => {
  try {
    if (!req.user.businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    console.log('Updating payroll settings with:', JSON.stringify(req.body, null, 2));

    // Find existing settings or create new ones
    let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings) {
      settings = new PayrollSettings({ businessId: req.user.businessId });
    }

    // Update settings
    if (req.body.taxRates) {
      settings.taxRates = req.body.taxRates;
    }

    // Save the updated settings
    await settings.save();

    console.log('Updated payroll settings:', JSON.stringify(settings, null, 2));

    res.json(settings);
  } catch (error) {
    console.error('Error updating payroll settings:', error);
    res.status(500).json({ 
      error: 'Failed to update payroll settings',
      details: error.message 
    });
  }
});

// Add custom deduction
router.post('/settings/deductions', auth, async (req, res) => {
  try {
    const { name, type, value } = req.body;
    
    if (!name || !type || value === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find existing settings or create new ones
    let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings) {
      settings = new PayrollSettings({ businessId: req.user.businessId });
    }

    // Initialize taxRates if it doesn't exist
    if (!settings.taxRates) {
      settings.taxRates = {};
    }

    // Initialize customDeductions array if it doesn't exist
    if (!settings.taxRates.customDeductions) {
      settings.taxRates.customDeductions = [];
    }

    // Add new deduction
    settings.taxRates.customDeductions.push({
      name,
      type,
      value,
      enabled: true
    });

    // Save the updated settings
    await settings.save();
    
    console.log('Added custom deduction:', {
      businessId: req.user.businessId,
      deduction: { name, type, value }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error adding custom deduction:', error);
    res.status(500).json({ message: 'Error adding custom deduction' });
  }
});

// Remove custom deduction
router.delete('/settings/deductions/:index', auth, async (req, res) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= settings.taxRates.customDeductions.length) {
      return res.status(400).json({ message: 'Invalid deduction index' });
    }

    settings.taxRates.customDeductions.splice(index, 1);
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error removing custom deduction:', error);
    res.status(500).json({ message: 'Error removing custom deduction' });
  }
});

// Add custom allowance
router.post('/settings/allowances', auth, async (req, res) => {
  try {
    const { name, type, value } = req.body;
    
    if (!name || !type || value === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find existing settings or create new ones
    let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings) {
      settings = new PayrollSettings({ businessId: req.user.businessId });
    }

    // Initialize taxRates if it doesn't exist
    if (!settings.taxRates) {
      settings.taxRates = {};
    }

    // Initialize allowances array if it doesn't exist
    if (!settings.taxRates.allowances) {
      settings.taxRates.allowances = [];
    }

    // Add new allowance
    settings.taxRates.allowances.push({
      name,
      type,
      value,
      enabled: true
    });

    // Save the updated settings
    await settings.save();
    
    console.log('Added custom allowance:', {
      businessId: req.user.businessId,
      allowance: { name, type, value }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error adding custom allowance:', error);
    res.status(500).json({ message: 'Error adding custom allowance' });
  }
});

// Remove allowance
router.delete('/settings/allowances/:index', auth, async (req, res) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= settings.taxRates.allowances.length) {
      return res.status(400).json({ message: 'Invalid allowance index' });
    }

    settings.taxRates.allowances.splice(index, 1);
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error removing custom allowance:', error);
    res.status(500).json({ message: 'Error removing custom allowance' });
  }
});

// Download payslip as PDF
router.get('/download/:payrollId', auth, async (req, res) => {
  let doc;
  try {
    const payroll = await Payroll.findById(req.params.payrollId)
      .populate('employeeId', 'firstName lastName position department')
      .populate('businessId', 'name address');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    // Convert both IDs to strings for comparison
    const payrollBusinessId = payroll.businessId._id.toString();
    const userBusinessId = req.user.businessId.toString();
    if (payrollBusinessId !== userBusinessId) {
      return res.status(403).json({ message: 'Not authorized to access this payroll record' });
    }

    // Fetch business details from the database
    const business = await Business.findById(payrollBusinessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Fetch payroll settings for tax rates
    const settings = await PayrollSettings.findOne({ businessId: payrollBusinessId });
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }

    // Create a PDF document
    doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${payroll.employeeId.firstName}-${payroll.employeeId.lastName}-${payroll.month}-${payroll.year}.pdf"`);
    doc.pipe(res);

    // Payslip header
    doc
      .fontSize(20)
      .fillColor('#4F8EF7')
      .font('Helvetica-Bold')
      .text('PAYSLIP', { align: 'center' })
      .moveDown(1);

    // Employee Details Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Employee Details', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica')
      .text(`Name: ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`)
      .text(`Employee Number: ${payroll.employeeNumber}`)
      .text(`Position: ${payroll.employeeId.position}`)
      .text(`Department: ${payroll.employeeId.department}`)
      .moveDown(0.5);

    // Payroll Details Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Payroll Details', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica')
      .text(`Period: ${payroll.month}/${payroll.year}`)
      .text(`Processed Date: ${new Date(payroll.processedDate).toLocaleDateString()}`)
      .moveDown(0.5);

    // Earnings Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Earnings', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica')
      .text(`Basic Salary: KES ${(payroll.basicSalary || 0).toLocaleString()}`)
      .moveDown(0.2);

    // Allowances Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Allowances', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica');

    // Display allowances from payroll record
    if (payroll.allowances?.items) {
      payroll.allowances.items.forEach(allowance => {
        doc.text(`${allowance.name}: KES ${allowance.amount.toLocaleString()}`);
      });
    }
    
    doc.moveDown(0.5);

    // Deductions Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Deductions', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica');

    // Display deductions from payroll record
    if (payroll.deductions?.items) {
      payroll.deductions.items.forEach(deduction => {
        doc.text(`${deduction.name}: KES ${deduction.amount.toLocaleString()}`);
      });
    }
    
    doc.moveDown(0.5);

    // Summary Section
    doc
      .fontSize(14)
      .fillColor('#1a237e')
      .font('Helvetica-Bold')
      .text('Summary', { underline: true })
      .moveDown(0.2)
      .fontSize(12)
      .fillColor('#333')
      .font('Helvetica')
      .text(`Basic Salary: KES ${(payroll.basicSalary || 0).toLocaleString()}`)
      .text(`Total Allowances: KES ${(payroll.allowances?.total || 0).toLocaleString()}`)
      .text(`Gross Salary: KES ${(payroll.grossSalary || 0).toLocaleString()}`)
      .text(`Total Deductions: KES ${(payroll.deductions?.total || 0).toLocaleString()}`)
      .text(`Net Salary: KES ${(payroll.netSalary || 0).toLocaleString()}`)
      .moveDown(1);

    // Footer
    doc
      .fontSize(10)
      .fillColor('#666')
      .font('Helvetica')
      .text('This is a computer-generated document. No signature is required.', { align: 'center' })
      .moveDown(0.5)
      .text('Thank you for your hard work!', { align: 'center' });

    // End the PDF document
    doc.end();

  } catch (error) {
    console.error('Error downloading payslip:', error);
    if (doc) {
      doc.end();
    }
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error downloading payslip',
        details: error.message 
      });
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Delete payroll settings
router.delete('/settings', auth, async (req, res) => {
  try {
    const settings = await PayrollSettings.findOneAndDelete({ businessId: req.user.businessId });
    
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }
    
    res.json({ message: 'Payroll settings deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll settings:', error);
    res.status(500).json({ message: 'Error deleting payroll settings' });
  }
});

// Get employee payroll history
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const payrollHistory = await Payroll.find({
      businessId: req.user.businessId,
      employeeId: employeeId
    })
    .populate({
      path: 'employeeId',
      select: 'firstName lastName position department employeeNumber'
    })
    .sort({ year: -1, month: -1 });

    if (!payrollHistory.length) {
      return res.status(404).json({ message: 'No payroll history found for this employee' });
    }

    res.json(payrollHistory);
  } catch (error) {
    console.error('Error fetching employee payroll history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employee payroll history',
      details: error.message 
    });
  }
});

// Add tax bracket
router.post('/settings/tax-brackets', auth, async (req, res) => {
  try {
    const { lowerBound, upperBound, rate, region, businessType } = req.body;

    // Validate input
    if (!lowerBound || !upperBound || !rate || !region || !businessType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (lowerBound < 0 || upperBound <= lowerBound) {
      return res.status(400).json({ error: 'Invalid bounds' });
    }

    if (rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Tax rate must be between 0 and 100' });
    }

    // Find or create payroll settings
    let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    
    if (!settings) {
      settings = new PayrollSettings({
        businessId: req.user.businessId,
        taxRates: {
          allowances: [],
          customDeductions: [],
          taxBrackets: {
            region,
            businessType,
            source: 'manual',
            brackets: []
          }
        }
      });
    }

    // Initialize tax brackets if they don't exist or update existing ones
    if (!settings.taxRates.taxBrackets) {
      settings.taxRates.taxBrackets = {
        region,
        businessType,
        source: 'manual',
        brackets: []
      };
    } else {
      // Update the tax bracket info
      settings.taxRates.taxBrackets.region = region;
      settings.taxRates.taxBrackets.businessType = businessType;
      settings.taxRates.taxBrackets.source = 'manual';
    }

    // Add new tax bracket
    settings.taxRates.taxBrackets.brackets.push({
      lowerBound,
      upperBound,
      rate,
      enabled: true
    });

    // Sort brackets by lower bound
    settings.taxRates.taxBrackets.brackets.sort((a, b) => a.lowerBound - b.lowerBound);

    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error adding tax bracket:', error);
    res.status(500).json({ error: 'Failed to add tax bracket' });
  }
});

// Remove tax bracket
router.delete('/settings/tax-brackets/:index', auth, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    const settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings || !settings.taxRates.taxBrackets) {
      return res.status(404).json({ error: 'Tax brackets not found' });
    }

    if (index < 0 || index >= settings.taxRates.taxBrackets.brackets.length) {
      return res.status(400).json({ error: 'Invalid tax bracket index' });
    }

    // Remove the tax bracket
    settings.taxRates.taxBrackets.brackets.splice(index, 1);
    await settings.save();

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error removing tax bracket:', error);
    res.status(500).json({ error: 'Failed to remove tax bracket' });
  }
});

// Upload tax brackets
router.post('/settings/tax-brackets/upload', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Received file upload request:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });

    const { region, businessType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!region || !businessType) {
      return res.status(400).json({ error: 'Region and business type are required' });
    }

    // Process the file based on its type
    let brackets = [];
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    try {
      console.log('Processing file:', {
        path: filePath,
        extension: fileExt
      });

      if (fileExt === '.csv') {
        // Process CSV file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log('Parsed CSV data:', data);

        brackets = data.map(row => ({
          lowerBound: Number(row['Lower Bound'] || row['lowerBound'] || row['Lower bound']),
          upperBound: Number(row['Upper Bound'] || row['upperBound'] || row['Upper bound']),
          rate: Number(row['Rate'] || row['rate'] || row['Tax Rate'] || row['taxRate'] || row['tax rate']),
          enabled: true
        }));
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        // Process Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log('Parsed Excel data:', data);

        brackets = data.map(row => ({
          lowerBound: Number(row['Lower Bound'] || row['lowerBound'] || row['Lower bound']),
          upperBound: Number(row['Upper Bound'] || row['upperBound'] || row['Upper bound']),
          rate: Number(row['Rate'] || row['rate'] || row['Tax Rate'] || row['taxRate'] || row['tax rate']),
          enabled: true
        }));
      }

      console.log('Processed brackets:', brackets);

      // Validate brackets
      for (const bracket of brackets) {
        if (isNaN(bracket.lowerBound) || isNaN(bracket.upperBound) || isNaN(bracket.rate)) {
          throw new Error('Invalid data in file. Please ensure all values are numbers.');
        }
        if (bracket.lowerBound < 0 || bracket.upperBound <= bracket.lowerBound) {
          throw new Error('Invalid bounds in file. Lower bound must be >= 0 and upper bound must be > lower bound.');
        }
        if (bracket.rate < 0 || bracket.rate > 100) {
          throw new Error('Invalid rate in file. Tax rate must be between 0 and 100.');
        }
      }

      // Sort brackets by lower bound
      brackets.sort((a, b) => a.lowerBound - b.lowerBound);

      // Find or create payroll settings
      let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
      if (!settings) {
        settings = new PayrollSettings({
          businessId: req.user.businessId,
          taxRates: {
            allowances: [],
            customDeductions: [],
            taxBrackets: {
              region,
              businessType,
              source: 'upload',
              brackets: []
            }
          }
        });
      }

      // Update tax brackets
      settings.taxRates.taxBrackets = {
        region,
        businessType,
        source: 'upload',
        brackets,
        lastUpdated: new Date()
      };

      await settings.save();
      console.log('Settings saved successfully');

      // Clean up: delete the uploaded file
      fs.unlinkSync(filePath);

      res.status(200).json(settings);
    } catch (error) {
      console.error('Error processing file:', error);
      // Clean up: delete the uploaded file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error uploading tax brackets:', error);
    res.status(500).json({ 
      error: 'Failed to upload tax brackets',
      details: error.message 
    });
  }
});

// Get tax bracket template
router.get('/settings/tax-brackets/template', auth, async (req, res) => {
  try {
    const { region, businessType } = req.query;

    if (!region || !businessType) {
      return res.status(400).json({ error: 'Region and business type are required' });
    }

    // This is a placeholder - you'll need to implement the actual template loading
    const templateBrackets = []; // Load template based on region and business type

    const settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings) {
      return res.status(404).json({ error: 'Payroll settings not found' });
    }

    settings.taxRates.taxBrackets = {
      region,
      businessType,
      source: 'template',
      brackets: templateBrackets,
      lastUpdated: new Date()
    };

    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error loading tax bracket template:', error);
    res.status(500).json({ error: 'Failed to load tax bracket template' });
  }
});

module.exports = router;