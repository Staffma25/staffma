// server/routes/payroll.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const mongoose = require('mongoose');
const Business = require('../models/Business');
const PayrollSettings = require('../models/PayrollSettings');

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

    // Check if the payroll period is valid
    const isValid = await isValidPayrollPeriod(req.user.businessId, Number(month), Number(year));
    if (!isValid) {
      return res.status(400).json({
        message: 'Cannot process payroll for this period. You can only process payroll from your registration month onwards.'
      });
    }

    // Get all active employees
    const employees = await Employee.find({ 
      businessId: req.user.businessId,
      status: 'active'
    });

    if (!employees.length) {
      return res.status(400).json({
        message: 'No active employees found'
      });
    }

    // During development, allow reprocessing by deleting existing records
    const existingPayroll = await Payroll.find({
      businessId: req.user.businessId,
      month: Number(month),
      year: Number(year)
    });

    if (existingPayroll.length > 0) {
      // Delete existing payroll records for this period
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
        // Calculate payroll using the async function
        const payrollData = await calculatePayroll(employee, req.user.businessId);

        // Create payroll record
        const payrollRecord = new Payroll({
          employeeId: employee._id,
          businessId: req.user.businessId,
          month: Number(month),
          year: Number(year),
          ...payrollData,
          processedDate: new Date()
        });

        await payrollRecord.save();
        payrollResults.push(payrollRecord);
      } catch (error) {
        console.error(`Error processing payroll for employee ${employee._id}:`, error);
        errors.push(`Failed to process payroll for ${employee.firstName} ${employee.lastName}: ${error.message}`);
      }
    }

    if (payrollResults.length === 0) {
      return res.status(400).json({
        message: 'No valid payroll records could be generated',
        errors
      });
    }

    res.status(200).json({
      message: `Successfully processed payroll for ${payrollResults.length} employees`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Payroll processing error:', error);
    res.status(500).json({
      message: 'Failed to process payroll',
      error: error.message
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
              { min: 0, max: 24000, rate: 0 },
              { min: 24000, max: 32333, rate: 25 },
              { min: 32333, max: 500000, rate: 30 },
              { min: 500000, max: 800000, rate: 32.5 },
              { min: 800000, rate: 35 }
            ]
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
            ]
          },
          nssf: {
            rate: 6,
            maxContribution: 1080 // 6% of 18,000
          },
          customDeductions: []
        },
        allowances: {
          housing: { enabled: true, defaultRate: 15 },
          transport: { enabled: true, defaultRate: 10 },
          medical: { enabled: true, defaultRate: 5 },
          other: { enabled: false, defaultRate: 0 }
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
    
    res.json(settings);
  } catch (error) {
    console.error('Error adding custom deduction:', error);
    res.status(500).json({ message: 'Error adding custom deduction' });
  }
});

// Remove custom deduction
router.delete('/settings/deductions/:index', auth, async (req, res) => {
  try {
    const settings = await PayrollSettings.findOneAndUpdate(
      { businessId: req.user.businessId },
      { 
        $unset: { [`taxRates.customDeductions.${req.params.index}`]: 1 },
        $pull: { 'taxRates.customDeductions': null }
      },
      { new: true }
    );
    
    res.json(settings);
  } catch (error) {
    console.error('Error removing custom deduction:', error);
    res.status(500).json({ message: 'Error removing custom deduction' });
  }
});

module.exports = router;