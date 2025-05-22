const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    businessType: { type: String, enum: ['limited', 'sole'], required: true },
    applicantName: { type: String, required: true },
    applicantRole: { type: String, required: true },
    businessAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
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