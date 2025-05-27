const PayrollSettings = require('../models/PayrollSettings');

// Helper function to get settings for a business
const getBusinessSettings = async (businessId) => {
  const settings = await PayrollSettings.findOne({ businessId });
  if (!settings) {
    throw new Error('Payroll settings not found for this business');
  }
  return settings;
};

// Calculate PAYE based on flat rate
const calculatePAYE = async (grossSalary, businessId) => {
  const settings = await getBusinessSettings(businessId);
  const payeRate = settings.taxRates.paye.rate;
  return Math.round((grossSalary * payeRate) / 100);
};

// Calculate NHIF based on flat rate
const calculateNHIF = async (grossSalary, businessId) => {
  const settings = await getBusinessSettings(businessId);
  const nhifRate = settings.taxRates.nhif.rate;
  return Math.round((grossSalary * nhifRate) / 100);
};

// Calculate NSSF based on flat rate
const calculateNSSF = async (grossSalary, businessId) => {
  const settings = await getBusinessSettings(businessId);
  const nssfRate = settings.taxRates.nssf.rate;
  return Math.round((grossSalary * nssfRate) / 100);
};

// Calculate custom deductions
const calculateCustomDeductions = async (grossSalary, businessId) => {
  const settings = await getBusinessSettings(businessId);
  const customDeductions = settings.taxRates.customDeductions;
  
  let totalDeductions = 0;
  const deductions = {};
  
  for (const deduction of customDeductions) {
    if (!deduction.enabled) continue;
    
    let amount = 0;
    if (deduction.type === 'percentage') {
      amount = (grossSalary * deduction.value) / 100;
    } else {
      amount = deduction.value;
    }
    
    deductions[deduction.name] = Math.round(amount);
    totalDeductions += amount;
  }
  
  return {
    deductions,
    totalDeductions: Math.round(totalDeductions)
  };
};

// Calculate allowances
const calculateAllowances = async (basicSalary, businessId) => {
  const settings = await getBusinessSettings(businessId);
  const allowances = settings.allowances;
  
  let totalAllowances = 0;
  const allowanceDetails = {};
  
  for (const [type, config] of Object.entries(allowances)) {
    if (!config.enabled) continue;
    
    const amount = (basicSalary * config.rate) / 100;
    allowanceDetails[type] = Math.round(amount);
    totalAllowances += amount;
  }
  
  return {
    allowances: allowanceDetails,
    totalAllowances: Math.round(totalAllowances)
  };
};

// Main payroll calculation function
const calculatePayroll = async (employee, businessId) => {
  try {
    if (!employee.salary?.basic) {
      throw new Error('Employee has no basic salary defined');
    }

    const basicSalary = Number(employee.salary.basic);
    if (isNaN(basicSalary) || basicSalary < 0) {
      throw new Error('Invalid basic salary amount');
    }
    
    // Calculate allowances
    const { allowances, totalAllowances } = await calculateAllowances(basicSalary, businessId);
    
    // Calculate gross salary
    const grossSalary = basicSalary + totalAllowances;
    
    // Calculate all deductions
    const paye = await calculatePAYE(grossSalary, businessId);
    const nhif = await calculateNHIF(grossSalary, businessId);
    const nssf = await calculateNSSF(grossSalary, businessId);
    const { deductions: customDeductions, totalDeductions: totalCustomDeductions } = 
      await calculateCustomDeductions(grossSalary, businessId);
    
    // Calculate total deductions
    const totalDeductions = paye + nhif + nssf + totalCustomDeductions;
    
    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;
    
    return {
      basicSalary,
      grossSalary,
      allowances,
      deductions: {
        paye,
        nhif,
        nssf,
        ...customDeductions,
        totalDeductions
      },
      netSalary
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
  calculateCustomDeductions,
  calculateAllowances,
  calculatePayroll
}; 

