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

// Import tax calculation functions
const {
  calculatePAYE,
  calculateNHIF,
  calculateNSSF,
  calculatePayroll
} = require('../utils/taxCalculations');

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

    if (!month || !year) {
      return res.status(400).json({
        message: 'Month and year are required'
      });
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return res.status(400).json({
        message: 'Invalid month. Month must be between 1 and 12'
      });
    }

    if (year < 2000 || year > 2100) {
      return res.status(400).json({
        message: 'Invalid year. Year must be between 2000 and 2100'
      });
    }

    // Get business settings first
    const settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    if (!settings) {
      return res.status(400).json({
        message: 'Payroll settings not found',
        details: 'Please configure your payroll settings before processing payroll'
      });
    }

    console.log('Processing payroll with settings:', {
      businessId: req.user.businessId,
      month,
      year,
      taxRates: settings.taxRates
    });

    // Get all active employees
    const employees = await Employee.find({ 
      businessId: req.user.businessId,
      status: 'active'
    });

    if (!employees.length) {
      return res.status(400).json({
        message: 'No active employees found',
        details: 'Please add employees before processing payroll'
      });
    }

    // Validate employee data
    const invalidEmployees = employees.filter(emp => !emp.salary?.basic);
    if (invalidEmployees.length > 0) {
      return res.status(400).json({
        message: 'Invalid employee data',
        details: `The following employees have no basic salary set: ${invalidEmployees.map(emp => `${emp.firstName} ${emp.lastName}`).join(', ')}`
      });
    }

    console.log(`Found ${employees.length} active employees`);

    // During development, allow reprocessing by deleting existing records
    const existingPayroll = await Payroll.find({
      businessId: req.user.businessId,
      month: Number(month),
      year: Number(year)
    });

    if (existingPayroll.length > 0) {
      console.log(`Deleting ${existingPayroll.length} existing payroll records for ${month}/${year}`);
      await Payroll.deleteMany({
        businessId: req.user.businessId,
        month: Number(month),
        year: Number(year)
      });
    }

    const payrollResults = [];
    const errors = [];

    for (const employee of employees) {
      try {
        console.log(`Processing payroll for employee: ${employee.firstName} ${employee.lastName}`);
        console.log('Employee details:', {
          id: employee._id,
          basicSalary: employee.salary?.basic,
          position: employee.position,
          department: employee.department
        });

        // Calculate payroll using the async function
        const payrollData = await calculatePayroll(employee, req.user.businessId);

        // Validate payroll calculation results
        if (!payrollData || typeof payrollData.grossSalary !== 'number' || isNaN(payrollData.grossSalary)) {
          throw new Error('Invalid payroll calculation results');
        }

        console.log('Payroll calculation results:', {
          employeeId: employee._id,
          basicSalary: payrollData.basicSalary,
          grossSalary: payrollData.grossSalary,
          deductions: payrollData.deductions,
          netSalary: payrollData.netSalary
        });

        // Create payroll record
        const payrollRecord = new Payroll({
          employeeId: employee._id,
          businessId: req.user.businessId,
          month: Number(month),
          year: Number(year),
          basicSalary: payrollData.basicSalary,
          grossSalary: payrollData.grossSalary,
          allowances: payrollData.allowances,
          deductions: {
            ...payrollData.deductions,
            totalDeductions: Object.values(payrollData.deductions).reduce((sum, val) => sum + val, 0)
          },
          netSalary: payrollData.netSalary,
          processedDate: new Date()
        });

        await payrollRecord.save();
        payrollResults.push(payrollRecord);
        console.log(`Successfully processed payroll for ${employee.firstName} ${employee.lastName}`);
      } catch (error) {
        console.error(`Error processing payroll for employee ${employee._id}:`, error);
        errors.push({
          employee: `${employee.firstName} ${employee.lastName}`,
          error: error.message
        });
      }
    }

    if (payrollResults.length === 0) {
      return res.status(400).json({
        message: 'No valid payroll records could be generated',
        errors: errors.map(e => `${e.employee}: ${e.error}`)
      });
    }

    console.log('Payroll processing completed:', {
      totalProcessed: payrollResults.length,
      errors: errors.length
    });

    res.status(200).json({
      message: `Successfully processed payroll for ${payrollResults.length} employees`,
      errors: errors.length > 0 ? errors.map(e => `${e.employee}: ${e.error}`) : undefined
    });
  } catch (error) {
    console.error('Payroll processing error:', error);
    res.status(500).json({
      message: 'Failed to process payroll',
      error: error.message,
      details: error.stack
    });
  }
});

// Get payroll history
router.get('/history', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    console.log('Auth user:', req.user.businessId);
    console.log('Query params:', { month, year });

    const query = { 
      businessId: new mongoose.Types.ObjectId(req.user.businessId),
      month: Number(month),
      year: Number(year)
    };

    console.log('Fetching payroll with query:', query);

    const payrollHistory = await Payroll.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName position department'
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
    let settings = await PayrollSettings.findOne({ businessId: req.user.businessId });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new PayrollSettings({
        businessId: req.user.businessId,
        taxRates: {
          paye: {
            rates: [
              { min: 0, max: 24000, rate: 10 },
              { min: 24001, max: 32333, rate: 25 },
              { min: 32334, max: 500000, rate: 30 },
              { min: 500001, max: 800000, rate: 32.5 },
              { min: 800001, rate: 35 }
            ],
            personalRelief: 2400,
            insuranceRelief: 15000,
            housingRelief: 9000
          },
          nhif: {
            rates: [
              { min: 0, max: 5999, amount: 150 },
              { min: 6000, max: 7999, amount: 300 },
              { min: 8000, max: 11999, amount: 400 },
              { min: 12000, max: 14999, amount: 500 },
              { min: 15000, max: 19999, amount: 600 },
              { min: 20000, max: 24999, amount: 750 },
              { min: 25000, max: 29999, amount: 850 },
              { min: 30000, max: 34999, amount: 900 },
              { min: 35000, max: 39999, amount: 950 },
              { min: 40000, max: 44999, amount: 1000 },
              { min: 45000, max: 49999, amount: 1100 },
              { min: 50000, max: 59999, amount: 1200 },
              { min: 60000, max: 69999, amount: 1300 },
              { min: 70000, max: 79999, amount: 1400 },
              { min: 80000, max: 89999, amount: 1500 },
              { min: 90000, max: 99999, amount: 1600 },
              { min: 100000, amount: 1700 }
            ],
            employerContribution: 0.5
          },
          nssf: {
            employeeRate: 6,
            employerRate: 6,
            maxContribution: 1080,
            tier1Limit: 6000,
            tier2Limit: 18000
          },
          customDeductions: [],
          allowances: []
        },
        benefits: {
          gratuity: {
            enabled: true,
            rate: 15,
            description: "End of service gratuity"
          },
          leave: {
            annualLeave: 21,
            sickLeave: 14,
            maternityLeave: 90,
            paternityLeave: 14
          }
        },
        taxExemptions: {
          personalRelief: 2400,
          insuranceRelief: 15000,
          housingRelief: 9000,
          disabilityExemption: 150000
        }
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    res.status(500).json({ message: 'Error fetching payroll settings' });
  }
});

// Update payroll settings
router.put('/settings', auth, async (req, res) => {
  try {
    const settings = await PayrollSettings.findOneAndUpdate(
      { businessId: req.user.businessId },
      { 
        ...req.body,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating payroll settings:', error);
    res.status(500).json({ message: 'Error updating payroll settings' });
  }
});

// Add custom deduction
router.post('/settings/deductions', auth, async (req, res) => {
  try {
    const { name, type, value } = req.body;
    
    if (!name || !type || value === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const settings = await PayrollSettings.findOneAndUpdate(
      { businessId: req.user.businessId },
      { 
        $push: { 
          'taxRates.customDeductions': {
            name,
            type,
            value,
            enabled: true
          }
        }
      },
      { new: true }
    );
    
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }
    
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
    
    const settings = await PayrollSettings.findOneAndUpdate(
      { businessId: req.user.businessId },
      { 
        $push: { 
          'taxRates.allowances': {
            name,
            type,
            value,
            enabled: true
          }
        }
      },
      { new: true }
    );
    
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }
    
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

    // Display custom allowances from settings
    const allowances = settings.taxRates.allowances || [];
    let totalAllowances = 0;
    
    allowances.forEach(allowance => {
      if (allowance.enabled) {
        const amount = payroll.allowances.get(allowance.name) || 0;
        totalAllowances += amount;
        doc.text(`${allowance.name}: KES ${amount.toLocaleString()}`);
      }
    });
    
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

    // Display custom deductions from settings
    const deductions = settings.taxRates.customDeductions || [];
    let totalDeductions = 0;
    
    deductions.forEach(deduction => {
      if (deduction.enabled) {
        const amount = payroll.deductions.get(deduction.name) || 0;
        totalDeductions += amount;
        // Show percentage for percentage-based deductions
        if (deduction.type === 'percentage') {
          doc.text(`${deduction.name} (${deduction.value}%): KES ${amount.toLocaleString()}`);
        } else {
          doc.text(`${deduction.name}: KES ${amount.toLocaleString()}`);
        }
      }
    });
    
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
      .text(`Gross Salary: KES ${(payroll.grossSalary || 0).toLocaleString()}`)
      .text(`Total Deductions: KES ${totalDeductions.toLocaleString()}`)
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

// View payslip in browser
router.get('/view/:payrollId', async (req, res) => {
  let doc;
  try {
    // Get token from query parameter
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Fetch the payroll record with populated business details
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

    // Get the business details
    const business = await Business.findById(payrollBusinessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Fetch payroll settings for tax rates
    const settings = await PayrollSettings.findOne({ businessId: payrollBusinessId });
    if (!settings) {
      return res.status(404).json({ message: 'Payroll settings not found' });
    }

    console.log('Business details:', {
      name: business.name,
      address: business.address
    });

    // Set response headers for viewing PDF in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="payslip.pdf"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Create a PDF document
    doc = new PDFDocument({ 
      margin: 40,
      bufferPages: true,
      autoFirstPage: true
    });

    // Handle PDF generation errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF' });
      }
    });

    // Pipe the PDF to the response
    doc.pipe(res);

    try {
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

      // Tax Rates Section
      doc
        .fontSize(14)
        .fillColor('#1a237e')
        .font('Helvetica-Bold')
        .text('Tax Rates and Deductions', { underline: true })
        .moveDown(0.2)
        .fontSize(12)
        .fillColor('#333')
        .font('Helvetica');

      // Calculate and display actual rates used
      const payeRate = ((payroll.deductions?.paye || 0) / (payroll.grossSalary || 1)) * 100;
      const nhifRate = ((payroll.deductions?.nhif || 0) / (payroll.grossSalary || 1)) * 100;
      const nssfRate = ((payroll.deductions?.nssf || 0) / (payroll.grossSalary || 1)) * 100;

      // Display PAYE rate and amount
      doc.text(`PAYE Rate: ${payeRate.toFixed(2)}%`);
      doc.text(`PAYE Amount: KES ${(payroll.deductions?.paye || 0).toLocaleString()}`);
      doc.moveDown(0.2);

      // Display NHIF rate and amount
      doc.text(`NHIF Rate: ${nhifRate.toFixed(2)}%`);
      doc.text(`NHIF Amount: KES ${(payroll.deductions?.nhif || 0).toLocaleString()}`);
      doc.moveDown(0.2);

      // Display NSSF rate and amount
      doc.text(`NSSF Rate: ${nssfRate.toFixed(2)}%`);
      doc.text(`NSSF Amount: KES ${(payroll.deductions?.nssf || 0).toLocaleString()}`);
      doc.moveDown(0.2);

      // Display other deductions if any
      if (payroll.deductions?.loans || payroll.deductions?.other) {
        doc.text('Additional Deductions:');
        if (payroll.deductions.loans) {
          doc.text(`  Loans: KES ${payroll.deductions.loans.toLocaleString()}`);
        }
        if (payroll.deductions.other) {
          doc.text(`  Other: KES ${payroll.deductions.other.toLocaleString()}`);
        }
      }
      doc.moveDown(0.5);

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
      
      Object.entries(payroll.allowances || {}).forEach(([key, value]) => {
        doc.text(`${capitalize(key)}: KES ${(value || 0).toLocaleString()}`);
      });
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
        .text(`Gross Salary: KES ${(payroll.grossSalary || 0).toLocaleString()}`)
        .text(`Total Deductions: KES ${Object.values(payroll.deductions || {}).reduce((a, b) => (a || 0) + (b || 0), 0).toLocaleString()}`)
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

    } catch (pdfError) {
      console.error('Error generating PDF content:', pdfError);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error generating PDF content',
          details: pdfError.message 
        });
      }
      return;
    }

    // End the PDF document
    doc.end();

  } catch (error) {
    console.error('Error viewing payslip:', error);
    if (!res.headersSent) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      res.status(500).json({ 
        message: 'Error viewing payslip',
        details: error.message 
      });
    }
    if (doc) {
      doc.end();
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

module.exports = router;