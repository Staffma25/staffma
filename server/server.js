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
const { generateEmployeeNumber } = require('./utils/employeeNumberGenerator');

// Import models
const Business = require('./models/Business');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const PerformanceReview = require('./models/PerformanceReview');
const performanceReviewsRouter = require('./routes/performanceReviews');
const payrollRoutes = require('./routes/Payroll');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves');
const activitiesRoutes = require('./routes/activities');
const staffmaRoutes = require('./routes/staffma');

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

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-refresh-token'],
  exposedHeaders: ['x-new-token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove the global multer middleware since we're handling it in the routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      details: err.message
    });
  }

  // Handle mongoose errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate entry',
        details: 'A record with this information already exists'
      });
    }
    return res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

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

    // Calculate employee metrics
    const totalEmployees = business.employees.length;
    const maxEmployees = 100; // You can adjust this based on your business rules
    const remainingSlots = maxEmployees - totalEmployees;

    // Get current month and year for payroll summary
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Calculate payroll summary
    const payrollSummary = await Payroll.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(req.businessId),
          month: currentMonth,
          year: currentYear
        }
      },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' }
        }
      }
    ]);

    // Get performance review stats
    const performanceReviewsStats = await PerformanceReview.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(req.businessId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert performance review stats to the expected format
    const reviewStats = {
      pendingReviews: 0,
      completedReviews: 0
    };

    performanceReviewsStats.forEach(stat => {
      if (stat._id === 'draft') {
        reviewStats.pendingReviews = stat.count;
      } else if (stat._id === 'submitted' || stat._id === 'acknowledged') {
        reviewStats.completedReviews += stat.count;
      }
    });

    res.json({
      business: {
        id: business._id,
        businessName: business.businessName,
        applicantName: business.applicantName,
        email: business.email,
        businessType: business.businessType,
        contactNumber: business.contactNumber,
        businessAddress: business.businessAddress,
        departments: business.departments
      },
      metrics: {
        employeeCount: {
          total: totalEmployees,
          remaining: remainingSlots
        }
      },
      payrollSummary: payrollSummary[0] || {
        totalGrossSalary: 0,
        totalNetSalary: 0
      },
      performanceReviewsStats: reviewStats,
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
    console.log('Fetching employees for business:', req.businessId);
    
    // Convert businessId to ObjectId
    const businessId = new mongoose.Types.ObjectId(req.businessId);
    
    // Find all employees for this business with all fields
    const employees = await Employee.find({ businessId })
      .select('employeeNumber firstName lastName email department position salary startDate joiningDate status')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${employees.length} employees:`, employees.map(emp => ({
      id: emp._id,
      employeeNumber: emp.employeeNumber,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      department: emp.department,
      position: emp.position
    })));

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
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
    // Get business details to generate employee number
    const business = await Business.findById(req.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    console.log('Creating employee for business:', {
      businessId: req.businessId,
      businessName: business.businessName,
      email: business.email
    });

    // Validate business name
    if (!business.businessName || business.businessName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Business name is required',
        details: 'Please update your business profile with a valid business name'
      });
    }

    // Generate employee number with retry logic
    let employeeNumber;
    let retries = 3;
    
    while (retries > 0) {
      try {
        employeeNumber = await generateEmployeeNumber(business.businessName);
        console.log('Generated employee number:', employeeNumber);
        break;
      } catch (error) {
        retries--;
        console.error(`Employee number generation failed, retries left: ${retries}`, error.message);
        if (retries === 0) {
          return res.status(500).json({ 
            error: 'Failed to generate employee number',
            details: 'Please try again or contact support. Error: ' + error.message
          });
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Validate salary before creating employee
    const basicSalary = Number(req.body.salary?.basic);
    if (isNaN(basicSalary) || basicSalary <= 0) {
      return res.status(400).json({ 
        error: 'Invalid salary amount. Salary must be a positive number.' 
      });
    }

    // Create employee data with businessId
    const employeeData = {
      ...req.body,
      businessId: new mongoose.Types.ObjectId(req.businessId),
      employeeNumber,
      salary: {
        basic: basicSalary,
        allowances: req.body.salary?.allowances || {
          housing: 0,
          transport: 0,
          medical: 0,
          other: 0
        },
        deductions: req.body.salary?.deductions || {
          loans: 0,
          other: 0
        }
      }
    };

    console.log('Creating employee with data:', {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      employeeNumber: employeeData.employeeNumber,
      department: employeeData.department,
      position: employeeData.position,
      salary: employeeData.salary.basic
    });

    const employee = new Employee(employeeData);
    await employee.save();

    console.log('Employee created successfully:', {
      id: employee._id,
      employeeNumber: employee.employeeNumber,
      name: `${employee.firstName} ${employee.lastName}`
    });

    // Update business with new employee
    await Business.findByIdAndUpdate(
      req.businessId,
      { $push: { employees: employee._id } }
    );

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error adding employee:', error);
    if (error.code === 11000) {
      if (error.keyPattern?.employeeNumber) {
        return res.status(400).json({ 
          error: 'Employee number conflict',
          details: 'Please try again. The system will generate a new employee number.'
        });
      }
      return res.status(400).json({ 
        error: 'An employee with this email already exists in your business',
        details: error.message 
      });
    }
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/employees', employeeRoutes); // Commented out due to duplicate endpoints
app.use('/api/payroll', payrollRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/performance-reviews', performanceReviewsRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/staffma', staffmaRoutes);

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

// ==================== BANK ACCOUNTS ROUTES ====================

// Add bank account
app.post('/api/employees/:id/bank-accounts', authenticateBusiness, async (req, res) => {
  try {
    console.log('Adding bank account for employee:', req.params.id);
    console.log('Request body:', req.body);
    
    const { bankName, accountNumber, accountType, branchCode, swiftCode, isPrimary } = req.body;

    // Validate required fields
    if (!bankName || !accountNumber) {
      console.log('Missing required fields:', { bankName, accountNumber });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Bank name and account number are required'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      console.log('Employee not found:', req.params.id);
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Found employee:', employee._id);

    // Check if employee already has a Staffpesa wallet for salary deposits
    if (employee.staffpesaWallet && employee.staffpesaWallet.walletId) {
      console.log('Employee already has Staffpesa wallet');
      return res.status(400).json({ 
        error: 'Payment method already exists',
        details: 'This employee already has a Staffpesa wallet. Please remove it before adding a bank account.'
      });
    }

    // Initialize bankAccounts array if it doesn't exist
    if (!employee.bankAccounts) {
      console.log('Initializing bankAccounts array');
      employee.bankAccounts = [];
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary) {
      employee.bankAccounts.forEach(account => {
        account.isPrimary = false;
      });
    }

    const newBankAccount = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountType: accountType || 'savings',
      branchCode: branchCode ? branchCode.trim() : '',
      swiftCode: swiftCode ? swiftCode.trim() : '',
      isPrimary: isPrimary || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Adding new bank account:', newBankAccount);
    employee.bankAccounts.push(newBankAccount);
    
    // Set payment method type to bank
    employee.paymentMethodType = 'bank';
    employee.paymentMethodUpdatedAt = new Date();
    
    console.log('Saving employee...');
    await employee.save();
    console.log('Employee saved successfully');

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error adding bank account:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add bank account',
      details: error.message 
    });
  }
});

// Update bank account
app.put('/api/employees/:id/bank-accounts/:accountId', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Initialize bankAccounts array if it doesn't exist
    if (!employee.bankAccounts) {
      employee.bankAccounts = [];
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

// Delete specific bank account
app.delete('/api/employees/:id/bank-accounts/:accountId', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
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

// Delete all bank accounts (to switch to Staffpesa wallet)
app.delete('/api/employees/:id/bank-accounts', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Clear all bank accounts
    employee.bankAccounts = [];
    
    // Clear payment method type if no wallet exists
    if (!employee.staffpesaWallet || !employee.staffpesaWallet.walletId) {
      employee.paymentMethodType = null;
      employee.paymentMethodUpdatedAt = new Date();
    }
    
    await employee.save();

    res.json({ 
      message: 'All bank accounts deleted successfully. You can now create a Staffpesa wallet.',
      employee 
    });
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
app.post('/api/employees/:id/staffpesa-wallet', authenticateBusiness, async (req, res) => {
  try {
    const { walletId, phoneNumber, isActive, status, notes } = req.body;

    // Validate required fields
    if (!walletId || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Wallet ID and phone number are required'
      });
    }

    // Validate phone number format and convert to required format
    let formattedPhoneNumber = phoneNumber.trim();
    
    // Remove any non-digit characters
    formattedPhoneNumber = formattedPhoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (formattedPhoneNumber.startsWith('0')) {
      // Convert 07XXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = '254' + formattedPhoneNumber.substring(1);
    } else if (formattedPhoneNumber.startsWith('7')) {
      // Convert 7XXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = '254' + formattedPhoneNumber;
    } else if (formattedPhoneNumber.startsWith('+254')) {
      // Convert +254XXXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = formattedPhoneNumber.substring(1);
    }
    
    // Final validation for 254XXXXXXXXX format
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(formattedPhoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: 'Phone number must be in format 254XXXXXXXXX. You can enter: 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXXX, or 254XXXXXXXXX'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee already has bank accounts for salary deposits
    if (employee.bankAccounts && employee.bankAccounts.length > 0) {
      return res.status(400).json({ 
        error: 'Payment method already exists',
        details: 'This employee already has bank accounts. Please remove them before adding a Staffpesa wallet.'
      });
    }

    // Check if wallet ID already exists for another employee
    const existingWallet = await Employee.findOne({
      'staffpesaWallet.walletId': walletId,
      _id: { $ne: req.params.id },
      businessId: req.businessId
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
      phoneNumber: formattedPhoneNumber,
      isActive: isActive || false,
      status: status || 'pending',
      notes,
      updatedAt: new Date()
    };

    // If wallet doesn't exist, set creation date
    if (!employee.staffpesaWallet || !employee.staffpesaWallet.walletId) {
      walletData.createdAt = new Date();
    }

    // Handle activation/deactivation timestamps
    if (isActive && (!employee.staffpesaWallet || !employee.staffpesaWallet.isActive)) {
      walletData.activatedAt = new Date();
    } else if (!isActive && employee.staffpesaWallet && employee.staffpesaWallet.isActive) {
      walletData.deactivatedAt = new Date();
    }

    employee.staffpesaWallet = walletData;
    
    // Set payment method type to wallet
    employee.paymentMethodType = 'wallet';
    employee.paymentMethodUpdatedAt = new Date();
    
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating staffpesa wallet:', error);
    res.status(500).json({ 
      error: 'Failed to update staffpesa wallet',
      details: error.message 
    });
  }
});

// Create or update staffpesa wallet
app.put('/api/employees/:id/staffpesa-wallet', authenticateBusiness, async (req, res) => {
  try {
    const { walletId, phoneNumber, isActive, status, notes } = req.body;

    // Validate required fields
    if (!walletId || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Wallet ID and phone number are required'
      });
    }

    // Validate phone number format and convert to required format
    let formattedPhoneNumber = phoneNumber.trim();
    
    // Remove any non-digit characters
    formattedPhoneNumber = formattedPhoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (formattedPhoneNumber.startsWith('0')) {
      // Convert 07XXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = '254' + formattedPhoneNumber.substring(1);
    } else if (formattedPhoneNumber.startsWith('7')) {
      // Convert 7XXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = '254' + formattedPhoneNumber;
    } else if (formattedPhoneNumber.startsWith('+254')) {
      // Convert +254XXXXXXXXX to 254XXXXXXXXX
      formattedPhoneNumber = formattedPhoneNumber.substring(1);
    }
    
    // Final validation for 254XXXXXXXXX format
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(formattedPhoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format',
        details: 'Phone number must be in format 254XXXXXXXXX. You can enter: 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXXX, or 254XXXXXXXXX'
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee already has bank accounts for salary deposits
    if (employee.bankAccounts && employee.bankAccounts.length > 0) {
      return res.status(400).json({ 
        error: 'Payment method already exists',
        details: 'This employee already has bank accounts. Please remove them before adding a Staffpesa wallet.'
      });
    }

    // Check if wallet ID already exists for another employee
    const existingWallet = await Employee.findOne({
      'staffpesaWallet.walletId': walletId,
      _id: { $ne: req.params.id },
      businessId: req.businessId
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
      phoneNumber: formattedPhoneNumber,
      isActive: isActive || false,
      status: status || 'pending',
      notes,
      updatedAt: new Date()
    };

    // If wallet doesn't exist, set creation date
    if (!employee.staffpesaWallet || !employee.staffpesaWallet.walletId) {
      walletData.createdAt = new Date();
    }

    // Handle activation/deactivation timestamps
    if (isActive && (!employee.staffpesaWallet || !employee.staffpesaWallet.isActive)) {
      walletData.activatedAt = new Date();
    } else if (!isActive && employee.staffpesaWallet && employee.staffpesaWallet.isActive) {
      walletData.deactivatedAt = new Date();
    }

    employee.staffpesaWallet = walletData;
    
    // Set payment method type to wallet
    employee.paymentMethodType = 'wallet';
    employee.paymentMethodUpdatedAt = new Date();
    
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Error updating staffpesa wallet:', error);
    res.status(500).json({ 
      error: 'Failed to update staffpesa wallet',
      details: error.message 
    });
  }
});

// Get staffpesa wallet details
app.get('/api/employees/:id/staffpesa-wallet', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
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
app.patch('/api/employees/:id/staffpesa-wallet/toggle', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
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

// Delete staffpesa wallet (to switch to bank accounts)
app.delete('/api/employees/:id/staffpesa-wallet', authenticateBusiness, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Clear staffpesa wallet by setting it to undefined
    employee.staffpesaWallet = undefined;
    
    // Clear payment method type if no bank accounts exist
    if (!employee.bankAccounts || employee.bankAccounts.length === 0) {
      employee.paymentMethodType = null;
      employee.paymentMethodUpdatedAt = new Date();
    }
    
    await employee.save();

    res.json({ 
      message: 'Staffpesa wallet deleted successfully. You can now create bank accounts.',
      employee 
    });
  } catch (error) {
    console.error('Error deleting staffpesa wallet:', error);
    res.status(500).json({ 
      error: 'Failed to delete staffpesa wallet',
      details: error.message 
    });
  }
});

// Add registration endpoint
app.post('/api/register', async (req, res) => {
  try {
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
      return res.status(400).json({ error: 'Business name, email and password are required' });
    }

    // Check if business already exists
    const existingBusiness = await Business.findOne({ email: email.toLowerCase() });
    if (existingBusiness) {
      return res.status(400).json({ error: 'A business with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new business
    const business = new Business({
      businessName,
      email: email.toLowerCase(),
      password: hashedPassword,
      businessType: businessType || 'sole',
      applicantName: applicantName || '',
      applicantRole: applicantRole || '',
      businessAddress: businessAddress || '',
      contactNumber: contactNumber || ''
    });

    await business.save();

    // Create JWT token for automatic login
    const token = jwt.sign(
      { 
        businessId: business._id,
        type: 'business'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and business data for automatic login
    res.status(201).json({ 
      message: 'Registration successful',
      token,
      user: {
        id: business._id,
        businessName: business.businessName,
        email: business.email,
        applicantName: business.applicantName,
        type: 'business'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Test bank account route
app.post('/api/employees/:id/bank-accounts-test', authenticateBusiness, async (req, res) => {
  try {
    console.log('Test: Adding bank account for employee:', req.params.id);
    
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Initialize bankAccounts array if it doesn't exist
    if (!employee.bankAccounts) {
      employee.bankAccounts = [];
    }

    const newBankAccount = {
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      accountType: 'savings',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    employee.bankAccounts.push(newBankAccount);
    await employee.save();

    res.status(201).json({ message: 'Test bank account added successfully', employee });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error.message 
    });
  }
});

// Approve payroll for payment processing
app.post('/api/payroll/approve', authenticateBusiness, async (req, res) => {
  try {
    const { month, year, employeeIds, notes } = req.body;

    console.log('=== PAYROLL APPROVAL DEBUG ===');
    console.log('Request body:', { month, year, employeeIds, notes });
    console.log('Business ID:', req.businessId);

    // Validate required fields
    if (!month || !year || !employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Month, year, and employee IDs array are required'
      });
    }

    // First, let's check what payroll records exist
    const existingPayroll = await Payroll.find({
      businessId: req.businessId,
      month: month,
      year: year
    });

    console.log('Existing payroll records:', existingPayroll.map(p => ({
      id: p._id,
      employeeId: p.employeeId,
      status: p.status
    })));

    // Update payroll records to approved status
    // Note: employeeIds actually contains payroll record IDs, not employee IDs
    const updateResult = await Payroll.updateMany(
      {
        _id: { $in: employeeIds },
        businessId: req.businessId,
        month: month,
        year: year,
        status: 'processed'
      },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.businessId,
          reviewNotes: notes || ''
        }
      }
    );

    console.log('Update result:', updateResult);
    console.log('=== END PAYROLL APPROVAL DEBUG ===');

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ 
        error: 'No payroll records found to approve',
        details: 'Make sure payroll has been processed first and you have selected valid records'
      });
    }

    res.json({
      message: `Successfully approved ${updateResult.modifiedCount} payroll records`,
      approvedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    res.status(500).json({ 
      error: 'Failed to approve payroll',
      details: error.message 
    });
  }
});

// Get approved payroll for payment processing
app.get('/api/payroll/approved', authenticateBusiness, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Month and year are required'
      });
    }

    const approvedPayroll = await Payroll.find({
      businessId: req.businessId,
      month: parseInt(month),
      year: parseInt(year),
      status: 'approved'
    }).populate('employeeId');

    res.json(approvedPayroll);
  } catch (error) {
    console.error('Error fetching approved payroll:', error);
    res.status(500).json({ 
      error: 'Failed to fetch approved payroll',
      details: error.message 
    });
  }
});

// Process payments for approved payroll
app.post('/api/payroll/process-payments', authenticateBusiness, async (req, res) => {
  try {
    const { month, year, paymentIds } = req.body;

    // Validate required fields
    if (!month || !year || !paymentIds || !Array.isArray(paymentIds)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Month, year, and payment IDs array are required'
      });
    }

    // Get approved payroll records
    const payrollRecords = await Payroll.find({
      _id: { $in: paymentIds },
      businessId: req.businessId,
      month: parseInt(month),
      year: parseInt(year),
      status: 'approved'
    }).populate('employeeId');

    if (payrollRecords.length === 0) {
      return res.status(400).json({ 
        error: 'No approved payroll records found',
        details: 'Make sure payroll has been approved first'
      });
    }

    const paymentStatus = {};
    let processedCount = 0;
    let failedCount = 0;

    // Process each payment
    for (const record of payrollRecords) {
      try {
        const employee = record.employeeId;
        let paymentResult = null;

        // Check payment method and process accordingly
        if (employee.staffpesaWallet && employee.staffpesaWallet.walletId) {
          // Process Staffpesa wallet payment
          paymentResult = await processWalletPayment(record, employee);
        } else if (employee.bankAccounts && employee.bankAccounts.length > 0) {
          // Process bank account payment
          paymentResult = await processBankPayment(record, employee);
        } else {
          // No payment method available
          paymentStatus[record._id] = 'failed';
          failedCount++;
          continue;
        }

        if (paymentResult.success) {
          // Update payroll record status
          await Payroll.findByIdAndUpdate(record._id, {
            $set: {
              status: 'paid',
              paidAt: new Date(),
              paymentMethod: paymentResult.method,
              paymentReference: paymentResult.reference
            }
          });

          paymentStatus[record._id] = 'completed';
          processedCount++;
        } else {
          paymentStatus[record._id] = 'failed';
          failedCount++;
        }
      } catch (error) {
        console.error(`Error processing payment for employee ${record.employeeId?.firstName} ${record.employeeId?.lastName}:`, error);
        paymentStatus[record._id] = 'failed';
        failedCount++;
      }
    }

    res.json({
      message: `Payment processing completed. ${processedCount} successful, ${failedCount} failed.`,
      processedCount,
      failedCount,
      paymentStatus
    });
  } catch (error) {
    console.error('Error processing payments:', error);
    res.status(500).json({ 
      error: 'Failed to process payments',
      details: error.message 
    });
  }
});

// Helper function to process Staffpesa wallet payments
async function processWalletPayment(payrollRecord, employee) {
  try {
    // Simulate Staffpesa wallet payment processing
    // In a real implementation, this would integrate with the Staffpesa API
    console.log(`Processing wallet payment for ${employee.firstName} ${employee.lastName}`);
    console.log(`Amount: KES ${payrollRecord.netSalary}`);
    console.log(`Wallet ID: ${employee.staffpesaWallet.walletId}`);
    console.log(`Phone: ${employee.staffpesaWallet.phoneNumber}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        method: 'staffpesa_wallet',
        reference: `WAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        method: 'staffpesa_wallet',
        error: 'Wallet payment failed'
      };
    }
  } catch (error) {
    console.error('Wallet payment processing error:', error);
    return {
      success: false,
      method: 'staffpesa_wallet',
      error: error.message
    };
  }
}

// Helper function to process bank account payments
async function processBankPayment(payrollRecord, employee) {
  try {
    // Get primary bank account
    const primaryAccount = employee.bankAccounts.find(acc => acc.isPrimary) || employee.bankAccounts[0];
    
    console.log(`Processing bank payment for ${employee.firstName} ${employee.lastName}`);
    console.log(`Amount: KES ${payrollRecord.netSalary}`);
    console.log(`Bank: ${primaryAccount.bankName}`);
    console.log(`Account: ${primaryAccount.accountNumber}`);

    // Simulate bank transfer processing
    // In a real implementation, this would integrate with bank APIs or payment gateways
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success (95% success rate for demo)
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        method: 'bank_transfer',
        reference: `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        method: 'bank_transfer',
        error: 'Bank transfer failed'
      };
    }
  } catch (error) {
    console.error('Bank payment processing error:', error);
    return {
      success: false,
      method: 'bank_transfer',
      error: error.message
    };
  }
}

// Get payroll status for a specific month/year
app.get('/api/payroll/status/:month/:year', authenticateBusiness, async (req, res) => {
  try {
    const { month, year } = req.params;

    const payrollStatus = await Payroll.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(req.businessId),
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to a more readable format
    const statusSummary = {
      processed: 0,
      approved: 0,
      paid: 0,
      failed: 0
    };

    payrollStatus.forEach(status => {
      statusSummary[status._id] = status.count;
    });

    res.json(statusSummary);
  } catch (error) {
    console.error('Error fetching payroll status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payroll status',
      details: error.message 
    });
  }
});

// Debug endpoint to check payroll status
app.get('/api/payroll/debug-status/:month/:year', authenticateBusiness, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    console.log('=== PAYROLL STATUS DEBUG ===');
    console.log('Business ID:', req.businessId);
    console.log('Month:', month, 'Year:', year);

    const payrollRecords = await Payroll.find({
      businessId: req.businessId,
      month: parseInt(month),
      year: parseInt(year)
    }).populate('employeeId', 'firstName lastName employeeNumber');

    console.log('Found payroll records:', payrollRecords.length);
    payrollRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record._id,
        employeeId: record.employeeId?._id,
        employeeName: `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
        status: record.status,
        netSalary: record.netSalary
      });
    });

    const statusCounts = payrollRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status counts:', statusCounts);
    console.log('=== END PAYROLL STATUS DEBUG ===');

    res.json({
      totalRecords: payrollRecords.length,
      statusCounts,
      records: payrollRecords.map(record => ({
        id: record._id,
        employeeId: record.employeeId?._id,
        employeeName: `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
        status: record.status,
        netSalary: record.netSalary
      }))
    });
  } catch (error) {
    console.error('Error in payroll status debug:', error);
    res.status(500).json({ 
      error: 'Failed to get payroll status debug info',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


