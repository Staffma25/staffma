const PayrollSettings = require('../models/PayrollSettings');

// Helper function to get settings for a business
const getBusinessSettings = async (businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings) {
      throw new Error('Payroll settings not found for this business');
    }
    console.log('Found settings:', settings);
    return settings;
  } catch (error) {
    console.error('Error fetching business settings:', error);
    throw error;
  }
};

// Calculate PAYE based on rate
const calculatePAYE = (taxableIncome, settings) => {
  try {
    const rates = settings.taxRates.paye.rates;
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of rates) {
      if (remainingIncome <= 0) break;

      const bracketSize = bracket.max - bracket.min;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      tax += (taxableInBracket * bracket.rate) / 100;
      remainingIncome -= taxableInBracket;
    }

    // Apply reliefs
    const reliefs = 
      settings.taxRates.paye.personalRelief +
      settings.taxRates.paye.insuranceRelief +
      settings.taxRates.paye.housingRelief;

    tax = Math.max(0, tax - reliefs);
    return Math.round(tax);
  } catch (error) {
    console.error('Error calculating PAYE:', error);
    return 0;
  }
};

// Calculate NHIF based on rate
const calculateNHIF = (grossSalary, settings) => {
  try {
    const rates = settings.taxRates.nhif.rates;
    for (const bracket of rates) {
      if (grossSalary >= bracket.min && grossSalary <= bracket.max) {
        return bracket.amount;
      }
    }
    return rates[rates.length - 1].amount; // Return highest bracket if salary exceeds all brackets
  } catch (error) {
    console.error('Error calculating NHIF:', error);
    return 0;
  }
};

// Calculate NSSF based on rate
const calculateNSSF = (grossSalary, settings) => {
  try {
    const { employeeRate, maxContribution, tier1Limit, tier2Limit } = settings.taxRates.nssf;
    
    // Calculate tier 1 contribution
    const tier1Amount = Math.min(grossSalary, tier1Limit);
    const tier1Contribution = (tier1Amount * employeeRate) / 100;
    
    // Calculate tier 2 contribution if applicable
    let tier2Contribution = 0;
    if (grossSalary > tier1Limit) {
      const tier2Amount = Math.min(grossSalary - tier1Limit, tier2Limit - tier1Limit);
      tier2Contribution = (tier2Amount * employeeRate) / 100;
    }
    
    const totalContribution = tier1Contribution + tier2Contribution;
    return Math.min(totalContribution, maxContribution);
  } catch (error) {
    console.error('Error calculating NSSF:', error);
    return 0;
  }
};

// Calculate allowances
const calculateAllowances = async (basicSalary, businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings || !settings.taxRates.allowances) {
      return { totalAllowances: 0, allowanceDetails: {} };
    }

    let totalAllowances = 0;
    const allowanceDetails = {};

    // Process each allowance from settings
    for (const allowance of settings.taxRates.allowances) {
      if (!allowance.enabled) continue;

      let amount = 0;
      if (allowance.type === 'percentage') {
        amount = (basicSalary * allowance.value) / 100;
      } else {
        amount = allowance.value;
      }

      allowanceDetails[allowance.name] = Math.round(amount);
      totalAllowances += amount;
    }

    return {
      totalAllowances: Math.round(totalAllowances),
      allowanceDetails
    };
  } catch (error) {
    console.error('Error calculating allowances:', error);
    return { totalAllowances: 0, allowanceDetails: {} };
  }
};

// Calculate custom deductions
const calculateDeductions = async (grossSalary, businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings || !settings.taxRates.customDeductions) {
      return { totalDeductions: 0, deductionDetails: {} };
    }

    let totalDeductions = 0;
    const deductionDetails = {};

    for (const deduction of settings.taxRates.customDeductions) {
      if (!deduction.enabled) continue;

      let amount = 0;
      if (deduction.type === 'percentage') {
        amount = (grossSalary * deduction.value) / 100;
      } else {
        amount = deduction.value;
      }

      deductionDetails[deduction.name] = amount;
      totalDeductions += amount;
    }

    return {
      totalDeductions: Math.round(totalDeductions),
      deductionDetails
    };
  } catch (error) {
    console.error('Error calculating deductions:', error);
    return { totalDeductions: 0, deductionDetails: {} };
  }
};

// Main payroll calculation function
const calculatePayroll = async (employee, businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings) {
      throw new Error('Payroll settings not found');
    }

    const basicSalary = employee.salary.basic;

    // Calculate allowances
    const { totalAllowances, allowanceDetails } = await calculateAllowances(basicSalary, businessId);
    
    // Calculate gross salary
    const grossSalary = basicSalary + totalAllowances;

    // Calculate statutory deductions only if enabled in settings
    const statutoryDeductions = {};
    let totalStatutoryDeductions = 0;

    if (settings.taxRates.paye?.enabled) {
      const paye = calculatePAYE(grossSalary, settings);
      statutoryDeductions.paye = paye;
      totalStatutoryDeductions += paye;
    }

    if (settings.taxRates.nhif?.enabled) {
      const nhif = calculateNHIF(grossSalary, settings);
      statutoryDeductions.nhif = nhif;
      totalStatutoryDeductions += nhif;
    }

    if (settings.taxRates.nssf?.enabled) {
      const nssf = calculateNSSF(grossSalary, settings);
      statutoryDeductions.nssf = nssf;
      totalStatutoryDeductions += nssf;
    }

    // Calculate custom deductions
    const { totalDeductions, deductionDetails } = await calculateDeductions(grossSalary, businessId);

    // Combine all deductions
    const allDeductions = {
      ...statutoryDeductions,
      ...deductionDetails
    };

    // Calculate net salary
    const totalDeductionsAmount = totalStatutoryDeductions + totalDeductions;
    const netSalary = grossSalary - totalDeductionsAmount;

    return {
      employeeId: employee._id,
      employeeNumber: employee.employeeNumber,
      basicSalary,
      grossSalary,
      allowances: {
        items: Object.entries(allowanceDetails).map(([name, amount]) => ({
          name,
          amount
        })),
        total: totalAllowances
      },
      deductions: {
        items: Object.entries(allDeductions).map(([name, amount]) => ({
          name,
          amount
        })),
        total: totalDeductionsAmount
      },
      netSalary: Math.round(netSalary)
    };
  } catch (error) {
    console.error('Error calculating payroll:', error);
    throw error;
  }
};

module.exports = {
  calculatePAYE,
  calculateNHIF,
  calculateNSSF,
  calculateAllowances,
  calculateDeductions,
  calculatePayroll
}; 

