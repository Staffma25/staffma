const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const { generateEmployeeNumber } = require('../utils/employeeNumberGenerator');

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
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
    // Get business details to generate employee number
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Generate employee number
    const employeeNumber = await generateEmployeeNumber(business.businessName);

    const employeeData = {
      ...req.body,
      businessId: req.user.businessId,
      employeeNumber
    };
    
    const employee = new Employee(employeeData);
    await employee.save();
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
  try {
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