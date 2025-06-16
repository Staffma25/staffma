const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const nodemailer = require('nodemailer');
const Business = require('../models/Business');
const { generateEmployeeNumber } = require('../utils/employeeNumberGenerator');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Submit new leave request
router.post('/', auth, upload.array('attachments'), async (req, res) => {
  try {
    console.log('Received leave request:', req.body);
    console.log('Files:', req.files);
    
    const { type, startDate, endDate, reason, employeeId } = req.body;
    
    // Get the current user's employee record
    const currentEmployee = await Employee.findOne({ email: req.user.email });
    if (!currentEmployee) {
      // Create a new employee record if it doesn't exist
      const business = await Business.findById(req.user.businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const employeeNumber = await generateEmployeeNumber(business.businessName);
      const newEmployee = new Employee({
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        department: req.user.department || 'General',
        position: req.user.position || 'Employee',
        salary: {
          basic: 0,
          allowances: { housing: 0, transport: 0, medical: 0, other: 0 },
          deductions: { loans: 0, other: 0 }
        },
        startDate: new Date(),
        joiningDate: new Date(),
        businessId: req.user.businessId,
        employeeNumber
      });

      await newEmployee.save();
      currentEmployee = newEmployee;
    }

    // If employee exists but is missing businessId, update it
    if (!currentEmployee.businessId) {
      currentEmployee.businessId = req.user.businessId;
      await currentEmployee.save();
    }

    // If employeeId is provided, verify the user has permission to submit on behalf of others
    let targetEmployeeId = currentEmployee._id;
    if (employeeId) {
      // Check if user is department head or has viewAllLeaves permission
      if (!req.user.permissions?.leaveManagement?.viewAllLeaves && req.user.type !== 'department_head') {
        return res.status(403).json({ error: 'You do not have permission to submit leave requests for other employees' });
      }

      // If user is department head, verify the employee is in their department
      if (req.user.type === 'department_head') {
        const employee = await Employee.findById(employeeId);
        if (!employee || employee.department !== currentEmployee.department) {
          return res.status(403).json({ error: 'You can only submit leave requests for employees in your department' });
        }
      }

      targetEmployeeId = employeeId;
    }

    // Get employee details for department
    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Upload attachments to S3 if any
    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        attachmentUrls = await Promise.all(
          req.files.map(async (file) => {
            const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `leave-attachments/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype
            };

            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            return {
              name: file.originalname,
              url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
              uploadedAt: new Date()
            };
          })
        );
      } catch (uploadError) {
        console.error('Error uploading attachments:', uploadError);
        return res.status(500).json({ error: 'Failed to upload attachments' });
      }
    }

    // Create new leave request
    const leave = new Leave({
      employeeId: targetEmployeeId,
      businessId: employee.businessId || req.user.businessId, // Use employee's businessId or fallback to user's
      department: employee.department,
      type,
      startDate,
      endDate,
      duration: Number(req.body.duration),
      reason,
      attachments: attachmentUrls,
      status: 'pending'
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ 
      error: 'Failed to submit leave request',
      details: error.message 
    });
  }
});

// Get all leave requests for the current user
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const currentEmployee = await Employee.findOne({ email: req.user.email });
    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee record not found. Please ensure you have an employee profile.' });
    }

    const leaves = await Leave.find({ employeeId: currentEmployee._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'firstName lastName email');

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      error: 'Failed to fetch leave requests',
      details: error.message,
    });
  }
});

// Get all leave requests (for managers/admins) or department leaves (for department heads)
router.get('/', auth, async (req, res) => {
  try {
    const currentEmployee = await Employee.findOne({ email: req.user.email });
    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee record not found. Please ensure you have an employee profile.' });
    }

    let leaves;
    
    // If user has viewAllLeaves permission, show all leaves in the business
    if (req.user.permissions?.leaveManagement?.viewAllLeaves) {
      leaves = await Leave.find({ businessId: currentEmployee.businessId })
        .sort({ createdAt: -1 })
        .populate('employeeId', 'firstName lastName email department')
        .populate('approvedBy', 'firstName lastName email');
    } else if (req.user.type === 'department_head') {
      // Department heads can only see leaves from their department
      leaves = await Leave.find({ 
        businessId: currentEmployee.businessId,
        department: currentEmployee.department
      })
        .sort({ createdAt: -1 })
        .populate('employeeId', 'firstName lastName email department')
        .populate('approvedBy', 'firstName lastName email');
    } else {
      // Regular users can only see their own leaves
      leaves = await Leave.find({ 
        businessId: currentEmployee.businessId,
        employeeId: currentEmployee._id 
      })
        .sort({ createdAt: -1 })
        .populate('employeeId', 'firstName lastName email department')
        .populate('approvedBy', 'firstName lastName email');
    }

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      error: 'Failed to fetch leave requests',
      details: error.message,
    });
  }
});

// Get single leave request
router.get('/:id', auth, async (req, res) => {
  try {
    const currentEmployee = await Employee.findOne({ email: req.user.email });
    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee record not found. Please ensure you have an employee profile.' });
    }

    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department')
      .populate('approvedBy', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check if user has permission to view this leave request
    if (
      leave.employeeId._id.toString() !== currentEmployee._id.toString() &&
      !req.user.permissions?.leaveManagement?.viewAllLeaves &&
      req.user.type !== 'department_head'
    ) {
      return res.status(403).json({ error: 'Not authorized to view this leave request' });
    }

    res.json(leave);
  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({
      error: 'Failed to fetch leave request',
      details: error.message
    });
  }
});

// Approve/Reject a leave request
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const currentEmployee = await Employee.findOne({ email: req.user.email });
    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee record not found. Please ensure you have an employee profile.' });
    }

    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check if user has permission to approve leaves
    if (!req.user.permissions?.leaveManagement?.approveLeave) {
      return res.status(403).json({ error: 'You do not have permission to approve leaves' });
    }

    // Check if user is from the same department or has viewAllLeaves permission
    if (!req.user.permissions?.leaveManagement?.viewAllLeaves && 
        currentEmployee.department !== leave.department) {
      return res.status(403).json({ error: 'You can only approve leaves from your department' });
    }

    leave.status = status;
    leave.approvedBy = currentEmployee._id;
    leave.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // Try to send email notification, but don't fail if it doesn't work
    try {
      const emailSubject = `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const emailContent = `
        Dear ${leave.employeeId.firstName} ${leave.employeeId.lastName},

        Your leave request has been ${status}.

        Leave Details:
        - Type: ${leave.type}
        - Start Date: ${new Date(leave.startDate).toLocaleDateString()}
        - End Date: ${new Date(leave.endDate).toLocaleDateString()}
        - Duration: ${leave.duration} days
        - Reason: ${leave.reason}
        ${status === 'rejected' ? `\nRejection Reason: ${rejectionReason}` : ''}

        ${status === 'approved' ? 'Your leave request has been approved. Please make necessary arrangements for your absence.' : 
        'Your leave request has been rejected. Please contact your department head for more information.'}

        Best regards,
        ${currentEmployee.firstName} ${currentEmployee.lastName}
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: leave.employeeId.email,
        subject: emailSubject,
        text: emailContent
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue with the response even if email fails
    }

    res.json({
      message: `Leave request ${status} successfully`,
      leave,
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({
      error: 'Failed to update leave request',
      details: error.message,
    });
  }
});

// Add a comment to a leave request
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check if user is the employee or has permission to view all leaves
    if (
      leave.employeeId.toString() !== req.user._id.toString() &&
      !req.user.permissions.leaveManagement.viewAllLeaves
    ) {
      return res.status(403).json({ error: 'Not authorized to comment on this leave request' });
    }

    leave.comments.push({
      user: req.user._id,
      text,
    });

    await leave.save();

    res.json({
      message: 'Comment added successfully',
      leave,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      details: error.message,
    });
  }
});

module.exports = router; 