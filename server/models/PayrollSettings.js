const mongoose = require('mongoose');

const payrollSettingsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  taxRates: {
    paye: {
      rate: {
        type: Number,
        default: 30, // Default 30% flat rate
        min: 0,
        max: 100
      }
    },
    nhif: {
      rate: {
        type: Number,
        default: 1.7, // Default 1.7% flat rate
        min: 0,
        max: 100
      }
    },
    nssf: {
      rate: {
        type: Number,
        default: 6, // Default 6% flat rate
        min: 0,
        max: 100
      }
    },
    customDeductions: [{
      name: String,
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      value: Number,
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  allowances: {
    housing: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 15, // Default 15% of basic salary
        min: 0,
        max: 100
      }
    },
    transport: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 10, // Default 10% of basic salary
        min: 0,
        max: 100
      }
    },
    medical: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 5, // Default 5% of basic salary
        min: 0,
        max: 100
      }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
payrollSettingsSchema.index({ businessId: 1 });

const PayrollSettings = mongoose.model('PayrollSettings', payrollSettingsSchema);

module.exports = PayrollSettings; 