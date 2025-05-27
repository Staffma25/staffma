const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { ObjectId } = mongoose.Types;
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Import models
const Business = require('./models/Business');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const PerformanceReview = require('./models/PerformanceReview');
const performanceReviewsRouter = require('./routes/performanceReviews');
const payrollRoutes = require('./routes/Payroll');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY
  }
});

// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
    }
  })
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-refresh-token'],
  exposedHeaders: ['x-new-token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // Exit if can't connect to database
  });

// Add this near the top of the file, after the require statements
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('JWT secrets are not properly configured in environment variables');
  process.exit(1);
}

// Authentication middleware
const authenticateBusiness = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!mongoose.Types.ObjectId.isValid(decoded.businessId)) {
        return res.status(400).json({ error: 'Invalid business ID' });
      }

      req.businessId = decoded.businessId;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Check if there's a refresh token
        const refreshToken = req.headers['x-refresh-token'];
        if (!refreshToken) {
          return res.status(401).json({ error: 'Token expired, no refresh token provided' });
        }

        try {
          // Verify refresh token
          const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
          const business = await Business.findById(decodedRefresh.businessId);
          
          if (!business) {
            return res.status(401).json({ error: 'Invalid refresh token' });
          }

          // Generate new access token
          const newToken = jwt.sign(
            { businessId: business._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );

          // Set new token in response header
          res.setHeader('x-new-token', newToken);
          req.businessId = business._id;
          next();
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
          return res.status(401).json({ error: 'Invalid refresh token' });
        }
      } else {
        console.error('Token verification error:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Add this dashboard data endpoint
app.get('/api/dashboard', authenticateBusiness, async (req, res) => {
  try {
    const business = await Business.findById(req.businessId)
      .populate('employees')
      .select('-password');

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Calculate dashboard metrics
    const totalEmployees = business.employees.length;
    const departments = business.departments || [];
    const employeesByDepartment = {};
    
    business.employees.forEach(employee => {
      employeesByDepartment[employee.department] = 
        (employeesByDepartment[employee.department] || 0) + 1;
    });

    res.json({
      business: {
        id: business._id,
        businessName: business.businessName,
        email: business.email,
        businessType: business.businessType,
        departments: business.departments
      },
      metrics: {
        totalEmployees,
        departments: departments.length,
        employeesByDepartment
      },
      employees: business.employees
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Add these endpoints for dashboard data
app.get('/api/business', authenticateBusiness, async (req, res) => {
  try {
    const business = await Business.findById(req.businessId)
      .select('-password');
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business data' });
  }
});

app.get('/api/employees', authenticateBusiness, async (req, res) => {
  try {
    const employees = await Employee.find({ businessId: req.businessId });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.get('/api/employees/count', authenticateBusiness, async (req, res) => {
  try {
    const count = await Employee.countDocuments({ businessId: req.businessId });
    res.json({
      total: count,
      limit: 100,
      remaining: 100 - count
    });
  } catch (error) {
    console.error('Error counting employees:', error);
    res.status(500).json({ error: 'Failed to get employee count' });
  }
});

app.put('/api/business/update', authenticateBusiness, async (req, res) => {
  try {
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.businessId,
      { $set: req.body },
      { new: true }
    ).select('-password');

    if (!updatedBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// Add employee endpoint
app.post('/api/employees', authenticateBusiness, async (req, res) => {
  try {
    // Validate salary before creating employee
    const basicSalary = Number(req.body.salary);
    if (isNaN(basicSalary) || basicSalary <= 0) {
      return res.status(400).json({ 
        error: 'Invalid salary amount. Salary must be a positive number.' 
      });
    }

    const employeeData = {
      ...req.body,
      businessId: req.businessId,
      salary: {
        basic: basicSalary, // Use the validated salary
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
      }
    };

    // Log the employee data for debugging
    console.log('Creating employee with data:', {
      ...employeeData,
      salary: {
        ...employeeData.salary,
        basic: employeeData.salary.basic
      }
    });

    const employee = new Employee(employeeData);
    await employee.save();

    // Update business with new employee
    await Business.findByIdAndUpdate(
      req.businessId,
      { $push: { employees: employee._id } }
    );

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ 
      error: 'Failed to add employee',
      details: error.message 
    });
  }
});

// Get employee details with all related information
app.get('/api/employees/:id', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: new mongoose.Types.ObjectId(id),
      businessId: new mongoose.Types.ObjectId(req.businessId)
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get payroll history
    const payrollHistory = await Payroll.find({
      employeeId: new mongoose.Types.ObjectId(id),
      businessId: new mongoose.Types.ObjectId(req.businessId)
    }).sort({ year: -1, month: -1 });

    // Get performance reviews
    const performanceReviews = await PerformanceReview.find({
      employeeId: new mongoose.Types.ObjectId(id),
      businessId: new mongoose.Types.ObjectId(req.businessId)
    }).sort({ reviewDate: -1 });

    // Combine all data
    const employeeData = {
      ...employee.toObject(),
      payrollHistory,
      performanceReviews
    };

    res.json(employeeData);
  } catch (error) {
    console.error('Error fetching employee details:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch employee details' });
  }
});

// Update employee details
app.put('/api/employees/:id', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify the employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee data
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { ...updateData, businessId: req.businessId },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
app.delete('/api/employees/:id', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete all related records and documents
    await Promise.all([
      // Delete employee
      Employee.findByIdAndDelete(id),
      // Delete payroll records
      Payroll.deleteMany({ employeeId: id }),
      // Delete performance reviews
      PerformanceReview.deleteMany({ employeeId: id }),
      // Delete documents from S3
      deleteEmployeeDocuments(employee)
    ]);

    res.json({ message: 'Employee and all related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Helper function to delete employee documents from S3
async function deleteEmployeeDocuments(employee) {
  try {
    const documents = [
      employee.documents?.employmentContract?.url,
      employee.documents?.idDocument?.url,
      employee.documents?.taxPin?.url,
      employee.insurance?.nhif?.url,
      employee.insurance?.medical?.url,
      employee.insurance?.life?.url
    ].filter(url => url);

    if (documents.length > 0) {
      const deletePromises = documents.map(url => {
        const key = url.split('/').pop();
        return s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        }));
      });

      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Error deleting employee documents from S3:', error);
    // Don't throw error to allow employee deletion to complete even if document deletion fails
  }
}

// Add employee status update endpoint
app.put('/api/employees/:id/status', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee status:', error);
    res.status(500).json({ error: 'Failed to update employee status' });
  }
});

// Routes
app.post('/api/register', upload.fields([
  { name: 'companyPin', maxCount: 1 },
  { name: 'cr12', maxCount: 1 },
  { name: 'businessCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Registration request received:', {
      ...req.body,
      password: '[HIDDEN]',
      files: req.files
    });

    const {
      businessName,
      email,
      password,
      businessType,
      applicantName,
      applicantRole,
      businessAddress,
      contactNumber
    } = req.body;

    // Validate required fields
    if (!businessName || !email || !password) {
      return res.status(400).json({ 
        error: 'Business name, email and password are required' 
      });
    }

    // Check if email already exists
    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare KYC documents
    const kycDocuments = {
      companyPin: req.files?.companyPin?.[0]?.location,
      cr12: req.files?.cr12?.[0]?.location,
      businessCertificate: req.files?.businessCertificate?.[0]?.location
    };

    // Create business document
    const business = new Business({
      businessName: businessName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      businessType: businessType || 'sole',
      applicantName: applicantName?.trim(),
      applicantRole: applicantRole?.trim(),
      businessAddress: businessAddress?.trim(),
      contactNumber: contactNumber?.trim(),
      kycDocuments,
      createdAt: new Date()
    });

    // Save to database
    await business.save();

    // Generate token
    const token = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send success response
    return res.status(201).json({
      message: 'Registration successful',
      token,
      business: {
        id: business._id,
        businessName: business.businessName,
        email: business.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      });
    }
    return res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const business = await Business.findOne({ email });
    if (!business) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const isValid = await bcrypt.compare(password, business.password);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate access token (1 hour expiry)
    const token = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token (7 days expiry)
    const refreshToken = jwt.sign(
      { businessId: business._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Send response with both tokens
    res.status(200).json({
      token,
      refreshToken,
      business: {
        id: business._id,
        businessName: business.businessName,
        email: business.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
});

// Add refresh token endpoint
app.post('/api/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const business = await Business.findById(decoded.businessId);

    if (!business) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Add this endpoint for employee payroll history
app.get('/api/payroll/employee/:employeeId', authenticateBusiness, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: new ObjectId(employeeId),
      businessId: new ObjectId(req.businessId)
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const payrollHistory = await Payroll.find({
      employeeId: new ObjectId(employeeId),
      businessId: new ObjectId(req.businessId)
    }).sort({ year: -1, month: -1 });

    res.json(payrollHistory);
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

// Add this endpoint for processing payroll
app.post('/api/payroll/process-employee', authenticateBusiness, async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: employeeId,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculate payroll
    const basicSalary = employee.salary.basic;
    const allowances = Object.values(employee.salary.allowances || {}).reduce((sum, val) => sum + val, 0);
    const grossSalary = basicSalary + allowances;

    // Calculate deductions
    const paye = calculatePAYE(grossSalary);
    const nhif = calculateNHIF(grossSalary);
    const nssf = calculateNSSF(grossSalary);
    const otherDeductions = Object.values(employee.salary.deductions || {}).reduce((sum, val) => sum + val, 0);
    const totalDeductions = paye + nhif + nssf + otherDeductions;

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Create or update payroll record
    const payroll = await Payroll.findOneAndUpdate(
      {
        employeeId,
        businessId: req.businessId,
        month,
        year
      },
      {
        basicSalary,
        allowances,
        grossSalary,
        deductions: {
          paye,
          nhif,
          nssf,
          other: otherDeductions,
          totalDeductions
        },
        netSalary,
        processedDate: new Date()
      },
      { upsert: true, new: true }
    );

    res.json(payroll);
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// Get payroll summary
app.get('/api/payroll/summary', authenticateBusiness, async (req, res) => {
  try {
    const { month, year } = req.query;

    const summary = await Payroll.aggregate([
      {
        $match: {
          businessId: new ObjectId(req.businessId),
          month: parseInt(month),
          year: parseInt(year)
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
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

// Add this endpoint for downloading payslips
app.get('/api/payroll/download/:payrollId', authenticateBusiness, async (req, res) => {
  try {
    const { payrollId } = req.params;
    const payroll = await Payroll.findOne({
      _id: payrollId,
      businessId: req.businessId
    }).populate('employeeId');

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    // Get business details
    const business = await Business.findById(req.businessId);

    // Generate PDF payslip
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('PAYSLIP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`${business.businessName}`);
    doc.text(`${business.businessAddress}`);
    doc.moveDown();
    doc.text(`Employee: ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`);
    doc.text(`Position: ${payroll.employeeId.position}`);
    doc.text(`Department: ${payroll.employeeId.department}`);
    doc.moveDown();
    doc.text(`Period: ${payroll.month}/${payroll.year}`);
    doc.moveDown();
    doc.text(`Basic Salary: KES ${payroll.basicSalary.toLocaleString()}`);
    doc.text(`Allowances: KES ${payroll.allowances.toLocaleString()}`);
    doc.text(`Gross Salary: KES ${payroll.grossSalary.toLocaleString()}`);
    doc.moveDown();
    doc.text('Deductions:');
    doc.text(`PAYE: KES ${payroll.deductions.paye.toLocaleString()}`);
    doc.text(`NHIF: KES ${payroll.deductions.nhif.toLocaleString()}`);
    doc.text(`NSSF: KES ${payroll.deductions.nssf.toLocaleString()}`);
    doc.moveDown();
    doc.text(`Total Deductions: KES ${payroll.deductions.totalDeductions.toLocaleString()}`);
    doc.moveDown();
    doc.text(`Net Salary: KES ${payroll.netSalary.toLocaleString()}`);
    doc.moveDown();
    doc.end();
  } catch (error) {
    console.error('Error downloading payslip:', error);
    res.status(500).json({ error: 'Failed to download payslip' });
  }
});

// Add performance review
app.post('/api/employees/:id/performance-review', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      reviewDate,
      reviewerName,
      rating,
      comments,
      goals,
      strengths,
      areasForImprovement,
      trainingRecommendations
    } = req.body;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const performanceReview = new PerformanceReview({
      employeeId: id,
      businessId: req.businessId,
      reviewDate,
      reviewerName,
      rating,
      comments,
      goals,
      strengths,
      areasForImprovement,
      trainingRecommendations
    });

    await performanceReview.save();
    res.status(201).json(performanceReview);
  } catch (error) {
    console.error('Error adding performance review:', error);
    res.status(500).json({ error: 'Failed to add performance review' });
  }
});

// Get employee performance reviews
app.get('/api/employees/:id/performance-reviews', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const reviews = await PerformanceReview.find({
      employeeId: id,
      businessId: req.businessId
    }).sort({ reviewDate: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({ error: 'Failed to fetch performance reviews' });
  }
});

app.use('/api', performanceReviewsRouter);
app.use('/api/payroll', payrollRoutes);

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get pre-signed URL for S3 upload
app.post('/api/employees/:id/upload-url', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileType, documentType } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !documentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Generate a unique file key
    const fileKey = `employees/${req.businessId}/${id}/${documentType}/${Date.now()}-${fileName}`;

    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    if (error.name === 'CredentialsProviderError') {
      return res.status(500).json({ error: 'AWS credentials not properly configured' });
    }
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Update employee documents
app.put('/api/employees/:id/documents', authenticateBusiness, async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, fileUrl } = req.body;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update the document URL
    const update = {};
    update[`documents.${documentType}.url`] = fileUrl;
    update[`documents.${documentType}.uploadedAt`] = new Date();

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee documents:', error);
    res.status(500).json({ error: 'Failed to update employee documents' });
  }
});

// Delete employee document
app.delete('/api/employees/:id/documents/:documentType', authenticateBusiness, async (req, res) => {
  try {
    const { id, documentType } = req.params;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get the current document URL
    const currentDoc = employee.documents?.[documentType];
    if (currentDoc?.url) {
      // Extract the key from the URL
      const urlParts = currentDoc.url.split('/');
      const key = urlParts.slice(3).join('/');

      // Delete from S3
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      }));
    }

    // Remove the document reference from the employee record
    const update = {};
    update[`documents.${documentType}`] = null;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $unset: update },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error deleting employee document:', error);
    res.status(500).json({ error: 'Failed to delete employee document' });
  }
});

// Update employee insurance documents
app.put('/api/employees/:id/insurance/:type', authenticateBusiness, async (req, res) => {
  try {
    const { id, type } = req.params;
    const { fileUrl, provider, policyNumber, coverage, number } = req.body;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate insurance type
    const validTypes = ['nhif', 'medical', 'life'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid insurance type' });
    }

    // Prepare update data based on insurance type
    let updateData = {
      uploadDate: new Date(),
      status: 'active'
    };

    // Add type-specific fields
    if (type === 'nhif') {
      updateData.number = number;
    } else {
      updateData.provider = provider;
      updateData.policyNumber = policyNumber;
      updateData.coverage = coverage;
    }

    // Add file URL if provided
    if (fileUrl) {
      updateData.url = fileUrl;
    }

    // Update the insurance data
    const update = {
      [`insurance.${type}`]: updateData
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating insurance document:', error);
    res.status(500).json({ error: 'Failed to update insurance document' });
  }
});

// Delete insurance document
app.delete('/api/employees/:id/insurance/:type', authenticateBusiness, async (req, res) => {
  try {
    const { id, type } = req.params;

    // Verify employee belongs to this business
    const employee = await Employee.findOne({
      _id: id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get the current document URL
    const currentDoc = employee.insurance?.[type];
    if (currentDoc?.url) {
      // Extract the key from the URL
      const urlParts = currentDoc.url.split('/');
      const key = urlParts.slice(3).join('/');

      // Delete from S3
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      }));
    }

    // Remove the document reference from the employee record
    const update = {};
    update[`insurance.${type}`] = {
      ...employee.insurance[type],
      url: null,
      uploadDate: null,
      status: 'inactive'
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error deleting insurance document:', error);
    res.status(500).json({ error: 'Failed to delete insurance document' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


