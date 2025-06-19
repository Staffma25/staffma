// Default tax bracket templates for different regions and business types

const TAX_BRACKET_TEMPLATES = {
  Kenya: {
    'Small Business': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Corporation': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Non-Profit': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Government': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Startup': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Other': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ]
  },
  Uganda: {
    'Small Business': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ],
    'Corporation': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ],
    'Non-Profit': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ],
    'Government': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ],
    'Startup': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ],
    'Other': [
      { lowerBound: 0, upperBound: 235000, rate: 0, enabled: true },
      { lowerBound: 235001, upperBound: 335000, rate: 10, enabled: true },
      { lowerBound: 335001, upperBound: 410000, rate: 20, enabled: true },
      { lowerBound: 410001, upperBound: 10000000, rate: 30, enabled: true }
    ]
  },
  Tanzania: {
    'Small Business': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ],
    'Corporation': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ],
    'Non-Profit': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ],
    'Government': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ],
    'Startup': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ],
    'Other': [
      { lowerBound: 0, upperBound: 270000, rate: 0, enabled: true },
      { lowerBound: 270001, upperBound: 520000, rate: 8, enabled: true },
      { lowerBound: 520001, upperBound: 760000, rate: 20, enabled: true },
      { lowerBound: 760001, upperBound: 10000000, rate: 25, enabled: true }
    ]
  },
  Rwanda: {
    'Small Business': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ],
    'Corporation': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ],
    'Non-Profit': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ],
    'Government': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ],
    'Startup': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ],
    'Other': [
      { lowerBound: 0, upperBound: 60000, rate: 0, enabled: true },
      { lowerBound: 60001, upperBound: 120000, rate: 20, enabled: true },
      { lowerBound: 120001, upperBound: 1000000, rate: 30, enabled: true }
    ]
  },
  Other: {
    'Small Business': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Corporation': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Non-Profit': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Government': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Startup': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ],
    'Other': [
      { lowerBound: 0, upperBound: 24000, rate: 10, enabled: true },
      { lowerBound: 24001, upperBound: 32333, rate: 25, enabled: true },
      { lowerBound: 32334, upperBound: 500000, rate: 30, enabled: true },
      { lowerBound: 500001, upperBound: 800000, rate: 32.5, enabled: true },
      { lowerBound: 800001, upperBound: 1000000, rate: 35, enabled: true }
    ]
  }
};

/**
 * Get tax bracket template for a specific region and business type
 * @param {string} region - The region (e.g., 'Kenya', 'Uganda', etc.)
 * @param {string} businessType - The business type (e.g., 'Small Business', 'Corporation', etc.)
 * @returns {Array} Array of tax bracket objects
 */
const getTaxBracketTemplate = (region, businessType) => {
  const regionTemplates = TAX_BRACKET_TEMPLATES[region];
  if (!regionTemplates) {
    // Fallback to Kenya template if region not found
    return TAX_BRACKET_TEMPLATES['Kenya']['Small Business'];
  }

  const template = regionTemplates[businessType];
  if (!template) {
    // Fallback to first available business type for the region
    const firstBusinessType = Object.keys(regionTemplates)[0];
    return regionTemplates[firstBusinessType];
  }

  return template;
};

/**
 * Get all available regions
 * @returns {Array} Array of region names
 */
const getAvailableRegions = () => {
  return Object.keys(TAX_BRACKET_TEMPLATES);
};

/**
 * Get all available business types for a region
 * @param {string} region - The region
 * @returns {Array} Array of business type names
 */
const getAvailableBusinessTypes = (region) => {
  const regionTemplates = TAX_BRACKET_TEMPLATES[region];
  if (!regionTemplates) {
    return [];
  }
  return Object.keys(regionTemplates);
};

module.exports = {
  TAX_BRACKET_TEMPLATES,
  getTaxBracketTemplate,
  getAvailableRegions,
  getAvailableBusinessTypes
}; 