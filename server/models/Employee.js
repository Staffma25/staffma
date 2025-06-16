const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    nhif: {
        number: String,
        url: String,
        uploadDate: Date,
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'inactive'
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
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'inactive'
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
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'inactive'
        }
    }
});

const employeeSchema = new mongoose.Schema({
    employeeNumber: {
        type: String,
        required: true,
        unique: true
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
        lowercase: true,
        set: v => v.toLowerCase().trim()
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
    joiningDate: {
        type: Date,
        required: true
    },
    documents: {
        idCard: {
            url: String,
            uploadedAt: Date
        },
        passport: {
            url: String,
            uploadedAt: Date
        },
        resume: {
            url: String,
            uploadedAt: Date
        },
        contract: {
            url: String,
            uploadedAt: Date
        },
        certificates: {
            url: String,
            uploadedAt: Date
        },
        other: {
            url: String,
            uploadedAt: Date
        }
    },
    insurance: {
        type: insuranceSchema,
        default: () => ({})
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
    }],
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
employeeSchema.index({ businessId: 1 });
employeeSchema.index({ email: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema); 


