const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    businessType: { type: String, enum: ['limited', 'sole'], required: true },
    applicantName: { type: String, required: false },
    applicantRole: { type: String, required: false },
    businessAddress: { type: String, required: false },
    contactNumber: { type: String, required: false },
    maxEmployees: { type: Number, default: 10 },
    departments: [String],
    isSuspended: { type: Boolean, default: false },
    currency: { 
        type: String, 
        enum: ['KES', 'USD', 'EUR', 'GBP', 'INR', 'UGX', 'TZS', 'RWF'], 
        default: 'KES' 
    },
    kycDocuments: {
        companyPin: { type: String, required: false },
        cr12: { type: String, required: false },
        businessCertificate: { type: String, required: false }
    },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    subscription: {
        type: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        expiryDate: Date
    },
    payment: {
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        plan: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
        amount: { type: Number, default: 0 },
        transactionId: { type: String, default: null },
        paymentMethod: { type: String, enum: ['card', 'mpesa'], default: null },
        firstPaymentDate: { type: Date, default: null },
        lastPaymentDate: { type: Date, default: null }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema); 