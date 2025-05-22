// server/routes/payroll.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const mongoose = require('mongoose');
const Business = require('../models/Business');

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

    // Check if payroll already processed for this month
    const existingPayroll = await Payroll.findOne({
      businessId: req.user.businessId,
      month: Number(month),
      year: Number(year)
    });

    if (existingPayroll) {
      return res.status(400).json({
        message: `Payroll for ${month}/${year} has already been processed`
      });
    }

    const payrollResults = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Ensure we have valid salary data
        if (!employee.salary?.basic) {
          errors.push(`Employee ${employee.firstName} ${employee.lastName} has no valid salary data`);
          continue;
        }

        // Get basic salary and ensure it's a number
        const basicSalary = Number(employee.salary.basic);
        if (isNaN(basicSalary) || basicSalary < 0) {
          errors.push(`Employee ${employee.firstName} ${employee.lastName} has invalid basic salary`);
          continue;
        }

        // Calculate allowances (all defaulting to 0)
        const allowances = {
          housing: 0,
          transport: 0,
          medical: 0,
          other: 0
        };

        // Calculate gross salary (basic + allowances)
        const grossSalary = basicSalary + Object.values(allowances)
          .reduce((sum, val) => sum + (Number(val) || 0), 0);

        // Calculate deductions using the tax calculation functions
        const paye = Math.round(calculatePAYE(grossSalary));
        const nhif = Math.round(calculateNHIF(grossSalary));
        const nssf = Math.round(calculateNSSF(grossSalary));
        
        const deductions = {
          paye,
          nhif,
          nssf,
          loans: 0,
          other: 0,
          totalDeductions: paye + nhif + nssf
        };

        // Calculate net salary
        const netSalary = grossSalary - deductions.totalDeductions;

        // Create payroll record with explicit number conversions
        const payrollRecord = {
          employeeId: employee._id,
          businessId: req.user.businessId,
          month: Number(month),
          year: Number(year),
          basicSalary: Number(basicSalary),
          grossSalary: Number(grossSalary),
          allowances,
          deductions: {
            paye: Number(deductions.paye),
            nhif: Number(deductions.nhif),
            nssf: Number(deductions.nssf),
            loans: 0,
            other: 0,
            totalDeductions: Number(deductions.totalDeductions)
          },
          netSalary: Number(netSalary),
          processedDate: new Date()
        };

        // Validate numbers before pushing
        if (Object.values(payrollRecord).some(val => 
            typeof val === 'number' && isNaN(val))) {
          console.warn(`Skipping employee ${employee._id} - Invalid calculations`);
          continue;
        }

        payrollResults.push(new Payroll(payrollRecord));
      } catch (employeeError) {
        errors.push(`Error processing ${employee.firstName} ${employee.lastName}: ${employeeError.message}`);
      }
    }

    if (payrollResults.length === 0) {
      return res.status(400).json({
        message: 'No valid payroll records could be generated',
        errors
      });
    }

    // Save all valid payroll records
    await Payroll.insertMany(payrollResults);

    res.status(200).json({
      message: `Payroll processed successfully for ${payrollResults.length} employees`,
      warnings: errors.length ? errors : undefined,
      count: payrollResults.length
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

module.exports = router;