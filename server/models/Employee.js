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

const customDeductionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['salary_advance', 'loan', 'other'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    monthlyAmount: {
        type: Number,
        required: true,
        min: 0
    },
    remainingAmount: {
        type: Number,
        default: function() {
            return this.amount;
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const bankAccountSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    accountType: {
        type: String,
        enum: ['savings', 'current', 'salary'],
        default: 'savings'
    },
    branchCode: {
        type: String,
        trim: true
    },
    swiftCode: {
        type: String,
        trim: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const staffpesaWalletSchema = new mongoose.Schema({
    walletId: {
        type: String,
        trim: true
    },
    employeeId: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'closed'],
        default: 'pending'
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    lastTransactionDate: {
        type: Date
    },
    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    kycDocuments: {
        idCard: {
            url: String,
            uploadedAt: Date,
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        },
        selfie: {
            url: String,
            uploadedAt: Date,
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        }
    },
    securitySettings: {
        pinEnabled: {
            type: Boolean,
            default: false
        },
        biometricEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false
        }
    },
    preferences: {
        notifications: {
            sms: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        language: {
            type: String,
            enum: ['en', 'sw'],
            default: 'en'
        },
        currency: {
            type: String,
            default: 'KES'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    activatedAt: {
        type: Date
    },
    deactivatedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
});

// Add custom validation to only require fields when walletId exists
staffpesaWalletSchema.pre('validate', function(next) {
    if (this.walletId) {
        // If walletId exists, then employeeId and phoneNumber are required
        if (!this.employeeId) {
            this.invalidate('employeeId', 'Employee ID is required when wallet ID is provided');
        }
        if (!this.phoneNumber) {
            this.invalidate('phoneNumber', 'Phone number is required when wallet ID is provided');
        }
    }
    next();
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
    customDeductions: [customDeductionSchema],
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
    bankAccounts: [bankAccountSchema],
    staffpesaWallet: {
        type: staffpesaWalletSchema
    },
    paymentMethodType: {
        type: String,
        enum: ['bank', 'wallet', null],
        default: null
    },
    paymentMethodUpdatedAt: {
        type: Date
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


