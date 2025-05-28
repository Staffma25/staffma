const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const { generateEmployeeNumber } = require('../utils/employeeNumberGenerator');

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    // Check if user has permission to view employees
    if (!req.user.hasPermission('employeeManagement', 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view employees' });
    }

    const employees = await Employee.find({ businessId: req.user.businessId });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission to view employees
    if (!req.user.hasPermission('employeeManagement', 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view employee details' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission to add employees
    if (!req.user.hasPermission('employeeManagement', 'add')) {
      return res.status(403).json({ message: 'You do not have permission to add employees' });
    }

    // Validate required fields
    const { firstName, lastName, email, department, position, salary, startDate, joiningDate } = req.body;

    if (!firstName || !lastName || !email || !department || !position || !startDate || !joiningDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'All fields are required: firstName, lastName, email, department, position, startDate, joiningDate'
      });
    }

    // Validate salary
    if (!salary || !salary.basic || typeof salary.basic !== 'number' || salary.basic <= 0) {
      return res.status(400).json({ 
        error: 'Invalid salary amount',
        details: 'Salary must be a positive number'
      });
    }

    // Get business details to generate employee number
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Generate employee number
    const employeeNumber = await generateEmployeeNumber(business.businessName);

    const employeeData = {
      firstName,
      lastName,
      email,
      department,
      position,
      salary: {
        basic: salary.basic,
        allowances: salary.allowances || {
          housing: 0,
          transport: 0,
          medical: 0,
          other: 0
        },
        deductions: salary.deductions || {
          loans: 0,
          other: 0
        }
      },
      startDate,
      joiningDate,
      businessId: req.user.businessId,
      employeeNumber
    };
    
    const employee = new Employee(employeeData);
    await employee.save();
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        details: 'An employee with this email already exists'
      });
    }
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: error.message 
    });
  }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      req.body,
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission to delete employees
    if (!req.user.hasPermission('employeeManagement', 'delete')) {
      return res.status(403).json({ message: 'You do not have permission to delete employees' });
    }

    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      businessId: req.user.businessId
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 