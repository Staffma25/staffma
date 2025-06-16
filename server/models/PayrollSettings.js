const mongoose = require('mongoose');

const payrollSettingsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  taxRates: {
    customDeductions: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 0
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    allowances: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 0
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    taxBrackets: {
      region: {
        type: String,
        required: true,
        trim: true
      },
      businessType: {
        type: String,
        required: true,
        trim: true
      },
      source: {
        type: String,
        enum: ['upload', 'template', 'manual'],
        required: true
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      brackets: [{
        lowerBound: {
          type: Number,
          required: true,
          min: 0
        },
        upperBound: {
          type: Number,
          required: true,
          min: 0
        },
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        enabled: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

payrollSettingsSchema.index({ businessId: 1 });

payrollSettingsSchema.pre('save', function(next) {
  const validatePercentage = (item) => {
    if (item.type === 'percentage' && item.value > 100) {
      throw new Error('Percentage value cannot exceed 100%');
    }
  };

  if (this.taxRates) {
    if (this.taxRates.allowances) {
      this.taxRates.allowances.forEach(validatePercentage);
    }
    if (this.taxRates.customDeductions) {
      this.taxRates.customDeductions.forEach(validatePercentage);
    }
  }
  next();
});

// Add findOrCreate static method
payrollSettingsSchema.statics.findOrCreate = async function(businessId) {
  try {
    let settings = await this.findOne({ businessId });
    
    if (!settings) {
      settings = new this({
        businessId,
        taxRates: {
          allowances: [],
          customDeductions: [],
          taxBrackets: {
            region: '',
            businessType: '',
            source: '',
            brackets: []
          }
        }
      });
      await settings.save();
    }
    
    return settings;
  } catch (error) {
    console.error('Error in findOrCreate:', error);
    throw error;
  }
};

const PayrollSettings = mongoose.model('PayrollSettings', payrollSettingsSchema);

module.exports = PayrollSettings; 



