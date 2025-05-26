const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    documents: {
        employmentContract: {
            url: String,
            uploadDate: Date,
            expiryDate: Date
        },
        idDocument: {
            type: String,
            url: String,
            uploadDate: Date,
            expiryDate: Date
        },
        taxPin: {
            number: String,
            url: String,
            uploadDate: Date,
            expiryDate: Date
        }
    },
    insurance: {
        nhif: {
            number: String,
            url: String,
            uploadDate: Date,
            expiryDate: Date,
            status: {
                type: String,
                enum: ['active', 'inactive', 'pending'],
                default: 'pending'
            }
        },
        medical: {
            provider: String,
            policyNumber: String,
            coverage: {
                type: String,
                enum: ['basic', 'standard', 'premium'],
                default: 'basic'
            },
            url: String,
            uploadDate: Date,
            expiryDate: Date,
            status: {
                type: String,
                enum: ['active', 'inactive', 'pending'],
                default: 'pending'
            }
        },
        life: {
            provider: String,
            policyNumber: String,
            coverage: {
                type: String,
                enum: ['basic', 'standard', 'premium'],
                default: 'basic'
            },
            url: String,
            uploadDate: Date,
            expiryDate: Date,
            status: {
                type: String,
                enum: ['active', 'inactive', 'pending'],
                default: 'pending'
            }
        }
    },
    salary: {
        basic: {
            type: Number,
            required: true
        },
        allowances: {
            housing: {
                type: Number,
                default: 0
            },
            transport: {
                type: Number,
                default: 0
            },
            medical: {
                type: Number,
                default: 0
            },
            other: {
                type: Number,
                default: 0
            }
        },
        deductions: {
            loans: {
                type: Number,
                default: 0
            },
            other: {
                type: Number,
                default: 0
            }
        }
    },
    bankDetails: {
        bankName: String,
        accountNumber: String,
        branchCode: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    performanceReviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PerformanceReview'
    }]
}, {
    timestamps: true
});

// Index for faster queries
employeeSchema.index({ businessId: 1 });
employeeSchema.index({ email: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema); 


