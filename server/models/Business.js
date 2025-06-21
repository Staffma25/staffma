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
    maxEmployees: { type: Number, default: 100 },
    departments: [String],
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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema); 