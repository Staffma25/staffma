const nodemailer = require('nodemailer');

// Log environment variables (excluding sensitive data)
console.log('Email Service Configuration:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  frontendUrl: process.env.FRONTEND_URL
});

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Configuration Error:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const mailOptions = {
      from: `"Stafma HR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Stafma HR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Stafma HR!</h2>
          <p>Hello ${firstName},</p>
          <p>Welcome to Stafma HR! Your account has been created successfully.</p>
          <p>You can now access the platform and start managing your HR tasks.</p>
          <p>For security reasons, please make sure to:</p>
          <ol>
            <li>Verify your email address using the link in the verification email</li>
            <li>Set up your password using the link in the password reset email</li>
          </ol>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>Stafma HR Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Ensure FRONTEND_URL is set and has no trailing slash
    const baseUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
    console.log('Generating password reset link:', {
      baseUrl,
      resetToken,
      fullUrl: resetUrl
    });

    const mailOptions = {
      from: `"Stafma HR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Set Up Your Stafma HR Account Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Set Up Your Account Password</h2>
            
            <p style="color: #34495e; font-size: 16px; line-height: 1.5;">
              Welcome to Stafma HR! To complete your account setup, please set up your password by clicking the button below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3498db; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        display: inline-block;
                        font-weight: bold;">
                Set Up Password
              </a>
            </div>

            <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #7f8c8d; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #7f8c8d; font-size: 14px;">
                <strong>Important:</strong>
              </p>
              <ul style="color: #7f8c8d; font-size: 14px; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>Your password must be at least 8 characters long</li>
                <li>Include at least one letter, one number, and one special character</li>
              </ul>
            </div>

            <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
              If you didn't request this password setup, please contact our support team immediately.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #7f8c8d; font-size: 14px;">
                Best regards,<br>
                Stafma HR Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password setup email sent:', {
      messageId: info.messageId,
      to: email,
      resetUrl
    });
    return true;
  } catch (error) {
    console.error('Error sending password setup email:', error);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: `"Stafma HR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Stafma HR Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Verify Your Email Address</h2>
          <p>Hello,</p>
          <p>Welcome to Stafma HR! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please contact our support team immediately.</p>
          <p>Best regards,<br>Stafma HR Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
}; 