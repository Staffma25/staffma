const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Business = require('../models/Business');
const auth = require('../middleware/auth');
const { generateEmployeeNumber } = require('../utils/employeeNumberGenerator');

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    console.log('Employees request received for user:', {
      userId: req.user._id,
      userType: req.user.type,
      businessId: req.user.businessId,
      email: req.user.email
    });

    // Check if user has permission to view employees
    if (!req.user.hasPermission('employeeManagement', 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view employees' });
    }

    const employees = await Employee.find({ businessId: req.user.businessId });
    
    console.log('Found employees for business:', {
      businessId: req.user.businessId,
      employeeCount: employees.length,
      employeeIds: employees.map(emp => emp._id)
    });

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
    console.log('Create employee request received for user:', {
      userId: req.user._id,
      userType: req.user.type,
      businessId: req.user.businessId,
      email: req.user.email
    });

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

    // Check if employee with this email already exists in the business
    const existingEmployee = await Employee.findOne({
      email: email.toLowerCase().trim(),
      businessId: req.user.businessId
    });

    if (existingEmployee) {
      return res.status(400).json({
        error: 'Duplicate entry',
        details: 'An employee with this email already exists in your business'
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

    console.log('Creating employee for business:', {
      businessId: req.user.businessId,
      businessName: business.businessName,
      employeeEmail: email,
      employeeName: `${firstName} ${lastName}`
    });

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
    
    let retries = 3;
    let employee;
    
    while (retries > 0) {
      try {
        employee = new Employee(employeeData);
        await employee.save();
        break;
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.employeeNumber) {
          // If duplicate employee number, generate a new one and retry
          retries--;
          if (retries === 0) {
            throw new Error('Failed to generate unique employee number after multiple attempts');
          }
          employeeData.employeeNumber = await generateEmployeeNumber(business.businessName);
          continue;
        }
        throw error;
      }
    }
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ 
          error: 'Duplicate entry',
          details: 'An employee with this email already exists'
        });
      }
      if (error.keyPattern?.employeeNumber) {
        return res.status(400).json({ 
          error: 'System error',
          details: 'Failed to generate unique employee number. Please try again.'
        });
      }
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

// Check and create employee record for current user
router.post('/check-and-create', auth, async (req, res) => {
  try {
    // Check if employee record exists for current user
    const existingEmployee = await Employee.findOne({
      email: req.user.email,
      businessId: req.user.businessId
    });

    if (existingEmployee) {
      // If employee exists but is missing businessId, update it
      if (!existingEmployee.businessId) {
        existingEmployee.businessId = req.user.businessId;
        await existingEmployee.save();
      }
      return res.json(existingEmployee);
    }

    // If no employee record exists, create one
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Generate employee number
    const employeeNumber = await generateEmployeeNumber(business.businessName);

    const employeeData = {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      department: req.user.department || 'General',
      position: req.user.position || 'Employee',
      salary: {
        basic: 0,
        allowances: {
          housing: 0,
          transport: 0,
          medical: 0,
          other: 0
        },
        deductions: {
          loans: 0,
          other: 0
        }
      },
      startDate: new Date(),
      joiningDate: new Date(),
      businessId: req.user.businessId,
      employeeNumber
    };

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error checking/creating employee record:', error);
    res.status(500).json({ 
      error: 'Failed to verify employee record',
      details: error.message 
    });
  }
});

// Update employee's businessId
router.patch('/:id/business', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update the businessId
    employee.businessId = req.user.businessId;
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee businessId:', error);
    res.status(500).json({ 
      error: 'Failed to update employee businessId',
      details: error.message 
    });
  }
});

// Update employee numbers for employees missing them
router.post('/update-missing-numbers', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    // Get business details to generate employee numbers
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Find all employees without employee numbers
    const employeesWithoutNumbers = await Employee.find({
      businessId: req.user.businessId,
      $or: [
        { employeeNumber: { $exists: false } },
        { employeeNumber: null },
        { employeeNumber: '' }
      ]
    });

    const updatedEmployees = [];
    const errors = [];

    for (const employee of employeesWithoutNumbers) {
      try {
        // Generate new employee number
        const employeeNumber = await generateEmployeeNumber(business.businessName);
        
        // Update employee with new number
        employee.employeeNumber = employeeNumber;
        await employee.save();
        
        updatedEmployees.push({
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber
        });
      } catch (error) {
        errors.push(`Failed to update employee ${employee.firstName} ${employee.lastName}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Some employees could not be updated',
        updatedEmployees,
        errors
      });
    }

    res.json({
      message: 'All employees updated successfully',
      updatedEmployees
    });
  } catch (error) {
    console.error('Error updating employee numbers:', error);
    res.status(500).json({ error: 'Failed to update employee numbers' });
  }
});

// Add custom deduction to employee
router.post('/:id/custom-deductions', auth, async (req, res) => {
  try {
    console.log('Adding custom deduction for employee:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      console.log('Permission denied for employee management edit');
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const { description, type, amount, monthlyAmount, startDate, endDate } = req.body;

    // Validate required fields
    if (!description || !type || !amount || !monthlyAmount || !startDate) {
      console.log('Missing required fields:', { description, type, amount, monthlyAmount, startDate });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Description, type, amount, monthly amount, and start date are required'
      });
    }

    // Validate amount
    if (amount <= 0 || monthlyAmount <= 0) {
      console.log('Invalid amount:', { amount, monthlyAmount });
      return res.status(400).json({ 
        error: 'Invalid amount',
        details: 'Amount and monthly amount must be greater than 0'
      });
    }

    // Validate monthly amount doesn't exceed total amount
    if (monthlyAmount > amount) {
      console.log('Monthly amount exceeds total amount:', { monthlyAmount, amount });
      return res.status(400).json({ 
        error: 'Invalid monthly amount',
        details: 'Monthly deduction amount cannot exceed total amount'
      });
    }

    console.log('Looking for employee with ID:', req.params.id, 'and businessId:', req.user.businessId);
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      console.log('Employee not found');
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Employee found:', employee._id);

    const newDeduction = {
      description,
      type,
      amount: parseFloat(amount),
      monthlyAmount: parseFloat(monthlyAmount),
      remainingAmount: parseFloat(amount),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: 'active'
    };

    console.log('New deduction object:', newDeduction);

    employee.customDeductions.push(newDeduction);
    console.log('Deduction added to employee array');
    
    await employee.save();
    console.log('Employee saved successfully');

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error adding custom deduction:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add custom deduction',
      details: error.message 
    });
  }
});

// Update custom deduction status
router.put('/:id/custom-deductions/:deductionId', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const { status } = req.body;

    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: 'Status must be active, completed, or cancelled'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const deduction = employee.customDeductions.id(req.params.deductionId);
    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' });
    }

    deduction.status = status;
    deduction.updatedAt = new Date();
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating custom deduction:', error);
    res.status(500).json({ 
      error: 'Failed to update custom deduction',
      details: error.message 
    });
  }
});

// Delete custom deduction
router.delete('/:id/custom-deductions/:deductionId', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const deduction = employee.customDeductions.id(req.params.deductionId);
    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' });
    }

    // Only allow deletion if deduction is not active
    if (deduction.status === 'active') {
      return res.status(400).json({ 
        error: 'Cannot delete active deduction',
        details: 'Please cancel or complete the deduction before deleting'
      });
    }

    employee.customDeductions.pull(req.params.deductionId);
    await employee.save();

    res.json({ message: 'Deduction deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom deduction:', error);
    res.status(500).json({ 
      error: 'Failed to delete custom deduction',
      details: error.message 
    });
  }
});

// Get employee's custom deductions
router.get('/:id/custom-deductions', auth, async (req, res) => {
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

    res.json(employee.customDeductions);
  } catch (error) {
    console.error('Error fetching custom deductions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch custom deductions',
      details: error.message 
    });
  }
});

// ==================== BANK ACCOUNTS ROUTES ====================

// Add bank account
router.post('/:id/bank-accounts', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const { bankName, accountNumber, accountType, branchCode, swiftCode, isPrimary } = req.body;

    // Validate required fields
    if (!bankName || !accountNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Bank name and account number are required'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary) {
      employee.bankAccounts.forEach(account => {
        account.isPrimary = false;
      });
    }

    const newBankAccount = {
      bankName,
      accountNumber,
      accountType: accountType || 'savings',
      branchCode,
      swiftCode,
      isPrimary: isPrimary || false
    };

    employee.bankAccounts.push(newBankAccount);
    await employee.save();

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ 
      error: 'Failed to add bank account',
      details: error.message 
    });
  }
});

// Update bank account
router.put('/:id/bank-accounts/:accountId', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const bankAccount = employee.bankAccounts.id(req.params.accountId);
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (bankAccount[key] !== undefined) {
        bankAccount[key] = req.body[key];
      }
    });

    // If setting as primary, unset other primary accounts
    if (req.body.isPrimary) {
      employee.bankAccounts.forEach(account => {
        if (account._id.toString() !== req.params.accountId) {
          account.isPrimary = false;
        }
      });
    }

    bankAccount.updatedAt = new Date();
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ 
      error: 'Failed to update bank account',
      details: error.message 
    });
  }
});

// Delete bank account
router.delete('/:id/bank-accounts/:accountId', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const bankAccount = employee.bankAccounts.id(req.params.accountId);
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    employee.bankAccounts.pull(req.params.accountId);
    await employee.save();

    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ 
      error: 'Failed to delete bank account',
      details: error.message 
    });
  }
});

// Delete all bank accounts for an employee
router.delete('/:id/bank-accounts', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Clear all bank accounts
    employee.bankAccounts = [];
    await employee.save();

    res.json({ message: 'All bank accounts deleted successfully' });
  } catch (error) {
    console.error('Error deleting all bank accounts:', error);
    res.status(500).json({ 
      error: 'Failed to delete bank accounts',
      details: error.message 
    });
  }
});

// ==================== STAFFPESA WALLET ROUTES ====================

// Create or update staffpesa wallet (POST for compatibility)
router.post('/:id/staffpesa-wallet', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const { walletId, phoneNumber, isActive, status, notes } = req.body;

    // Validate required fields
    if (!walletId || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Wallet ID and phone number are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: 'Phone number must be in format 254XXXXXXXXX'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if wallet ID already exists for another employee
    const existingWallet = await Employee.findOne({
      'staffpesaWallet.walletId': walletId,
      _id: { $ne: req.params.id },
      businessId: req.user.businessId
    });

    if (existingWallet) {
      return res.status(400).json({ 
        error: 'Wallet ID already exists',
        details: 'This wallet ID is already assigned to another employee'
      });
    }

    // Create or update wallet
    const walletData = {
      walletId,
      employeeId: employee.employeeNumber,
      phoneNumber,
      isActive: isActive || false,
      status: status || 'pending',
      notes,
      updatedAt: new Date(),
      createdBy: req.user._id
    };

    if (!employee.staffpesaWallet || !employee.staffpesaWallet.walletId) {
      walletData.createdAt = new Date();
    }
    if (isActive && (!employee.staffpesaWallet || !employee.staffpesaWallet.isActive)) {
      walletData.activatedAt = new Date();
    } else if (!isActive && employee.staffpesaWallet && employee.staffpesaWallet.isActive) {
      walletData.deactivatedAt = new Date();
    }

    employee.staffpesaWallet = walletData;
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating staffpesa wallet (POST):', error);
    res.status(500).json({ 
      error: 'Failed to update staffpesa wallet',
      details: error.message 
    });
  }
});

// Delete staffpesa wallet
router.delete('/:id/staffpesa-wallet', auth, async (req, res) => {
  try {
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    employee.staffpesaWallet = undefined;
    await employee.save();
    res.json({ message: 'Staffpesa wallet removed successfully' });
  } catch (error) {
    console.error('Error deleting staffpesa wallet:', error);
    res.status(500).json({ error: 'Failed to delete staffpesa wallet', details: error.message });
  }
});

// Get staffpesa wallet details
router.get('/:id/staffpesa-wallet', auth, async (req, res) => {
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

    res.json(employee.staffpesaWallet || {});
  } catch (error) {
    console.error('Error fetching staffpesa wallet:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staffpesa wallet',
      details: error.message 
    });
  }
});

// Toggle wallet status
router.patch('/:id/staffpesa-wallet/toggle', auth, async (req, res) => {
  try {
    // Check if user has permission to edit employees
    if (!req.user.hasPermission('employeeManagement', 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit employees' });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.user.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.staffpesaWallet || !employee.staffpesaWallet.walletId) {
      return res.status(400).json({ 
        error: 'No wallet found',
        details: 'Please create a wallet first before toggling status'
      });
    }

    const newStatus = !employee.staffpesaWallet.isActive;
    employee.staffpesaWallet.isActive = newStatus;
    employee.staffpesaWallet.updatedAt = new Date();

    if (newStatus) {
      employee.staffpesaWallet.activatedAt = new Date();
      employee.staffpesaWallet.status = 'active';
    } else {
      employee.staffpesaWallet.deactivatedAt = new Date();
      employee.staffpesaWallet.status = 'suspended';
    }

    await employee.save();

    res.json({
      message: `Wallet ${newStatus ? 'activated' : 'deactivated'} successfully`,
      wallet: employee.staffpesaWallet
    });
  } catch (error) {
    console.error('Error toggling wallet status:', error);
    res.status(500).json({ 
      error: 'Failed to toggle wallet status',
      details: error.message 
    });
  }
});

module.exports = router; 






