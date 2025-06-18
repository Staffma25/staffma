const mongoose = require('mongoose');
const PayrollSettings = require('../models/PayrollSettings');

// Helper function to get settings for a business
const getBusinessSettings = async (businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings) {
      throw new Error('Payroll settings not found');
    }
    return settings;
  } catch (error) {
    console.error('Error getting business settings:', error);
    throw error;
  }
};

// Calculate PAYE using tax brackets
const calculatePAYE = (taxableIncome, taxBrackets) => {
  // Default Kenya tax brackets if none provided
  const brackets = taxBrackets || [
    { lowerBound: 0, upperBound: 24000, rate: 10 },
    { lowerBound: 24001, upperBound: 32333, rate: 25 },
    { lowerBound: 32334, upperBound: 500000, rate: 30 },
    { lowerBound: 500001, upperBound: 800000, rate: 32.5 },
    { lowerBound: 800001, upperBound: Infinity, rate: 35 }
  ];

  console.log('Calculating PAYE for taxable income:', taxableIncome);
  console.log('Using tax brackets:', brackets);

  // Sort brackets by lower bound
  brackets.sort((a, b) => a.lowerBound - b.lowerBound);

  let remainingIncome = taxableIncome;
  let totalTax = 0;
  let bracketBreakdown = [];

  // Calculate tax for each bracket
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const bracketWidth = bracket.upperBound - bracket.lowerBound;
    
    // Calculate taxable amount for this bracket
    const taxableInBracket = Math.min(
      remainingIncome,
      bracketWidth
    );

    if (taxableInBracket > 0) {
      const taxForBracket = Math.round(taxableInBracket * (bracket.rate / 100));
      totalTax += taxForBracket;
      remainingIncome -= taxableInBracket;

      bracketBreakdown.push({
        bracket: i + 1,
        range: `${bracket.lowerBound.toLocaleString()} - ${bracket.upperBound.toLocaleString()}`,
        rate: `${bracket.rate}%`,
        taxableAmount: taxableInBracket,
        tax: taxForBracket
      });

      console.log(`Bucket ${i + 1} (${bracket.rate}%):`, {
        range: `${bracket.lowerBound.toLocaleString()} - ${bracket.upperBound.toLocaleString()}`,
        taxableAmount: taxableInBracket,
        tax: taxForBracket
      });
    }

    if (remainingIncome <= 0) break;
  }

  // Apply personal relief (KSh 2,400 per month)
  const personalRelief = 2400;
  const finalPAYE = Math.max(0, totalTax - personalRelief);

  console.log('PAYE calculation breakdown:', {
    totalTaxBeforeRelief: totalTax,
    personalRelief,
    finalPAYE
  });

  return Math.round(finalPAYE);
};

// Calculate NHIF
const calculateNHIF = (grossSalary) => {
  return Math.round(grossSalary * 0.0275); // 2.75%
};

// Calculate NSSF
const calculateNSSF = (grossSalary) => {
  return Math.min(Math.round(grossSalary * 0.06), 1080); // 6% capped at 1,080
};

// Calculate Housing Levy
const calculateHousingLevy = (grossSalary) => {
  return Math.round(grossSalary * 0.015); // 1.5%
};

// Calculate allowances
const calculateAllowances = async (basicSalary, businessId) => {
  try {
    const settings = await getBusinessSettings(businessId);
    const allowances = settings.taxRates.allowances || [];
    let totalAllowances = 0;
    const allowanceDetails = {};

    for (const allowance of allowances) {
      if (allowance.enabled) {
        let amount = 0;
        if (allowance.type === 'percentage') {
          amount = Math.round(basicSalary * (allowance.value / 100));
        } else {
          amount = allowance.value;
        }
        allowanceDetails[allowance.name] = amount;
        totalAllowances += amount;
      }
    }

    return { totalAllowances, allowanceDetails };
  } catch (error) {
    console.error('Error calculating allowances:', error);
    throw error;
  }
};
  
// Calculate custom deductions
const calculateDeductions = async (grossSalary, businessId) => {
  try {
    const settings = await getBusinessSettings(businessId);
    const deductions = settings.taxRates.customDeductions || [];
    let totalDeductions = 0;
    const deductionDetails = {};

    for (const deduction of deductions) {
      if (deduction.enabled) {
        let amount = 0;
        if (deduction.type === 'percentage') {
          amount = Math.round(grossSalary * (deduction.value / 100));
        } else {
          amount = deduction.value;
        }
        deductionDetails[deduction.name] = amount;
        totalDeductions += amount;
      }
    }

    return { totalDeductions, deductionDetails };
  } catch (error) {
    console.error('Error calculating deductions:', error);
    throw error;
  }
};

// Main payroll calculation function
const calculatePayroll = async (employee, businessId) => {
  try {
    const settings = await PayrollSettings.findOne({ businessId });
    if (!settings) {
      throw new Error('Payroll settings not found');
    }

    console.log('Starting payroll calculation for employee:', {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      basicSalary: employee.salary.basic
    });

    const basicSalary = employee.salary.basic;

    // 1. Calculate Pre-Tax Deductions (Statutory)
    const shif = Math.round(basicSalary * 0.0275); // 2.75%
    const nssf = Math.min(Math.round(basicSalary * 0.06), 1080); // 6% capped at 1,080
    const housingLevy = Math.round(basicSalary * 0.015); // 1.5%
    const totalPreTaxDeductions = shif + nssf + housingLevy;

    console.log('Pre-tax deductions calculated:', {
      shif,
      nssf,
      housingLevy,
      totalPreTaxDeductions
    });

    // 2. Calculate Taxable Income
    const taxableIncome = basicSalary - totalPreTaxDeductions;
    console.log('Taxable income calculated:', taxableIncome);

    // 3. Calculate PAYE using progressive tax brackets
    const paye = calculatePAYE(taxableIncome, settings.taxRates.taxBrackets.brackets);
    console.log('PAYE calculated:', paye);

    // 4. Calculate Custom Deductions
    const { totalDeductions, deductionDetails } = await calculateDeductions(basicSalary, businessId);
    console.log('Custom deductions calculated:', {
      totalDeductions,
      deductionDetails
    });

    // 5. Calculate Total Deductions
    const totalDeductionsAmount = totalPreTaxDeductions + paye + totalDeductions;

    // 6. Calculate Net Salary
    const netSalary = basicSalary - totalDeductionsAmount;

    console.log('Final calculations:', {
      basicSalary,
      totalPreTaxDeductions,
      taxableIncome,
      paye,
      totalCustomDeductions: totalDeductions,
      totalDeductionsAmount,
      netSalary
    });

    return {
      employeeId: employee._id,
      employeeNumber: employee.employeeNumber,
      basicSalary,
      taxableIncome,
      deductions: {
        items: [
          // Pre-tax deductions first
          { name: 'SHIF', amount: shif },
          { name: 'NSSF', amount: nssf },
          { name: 'Housing Levy', amount: housingLevy },
          // Custom deductions
          ...Object.entries(deductionDetails).map(([name, amount]) => ({
            name,
            amount
          })),
          // PAYE last
          { name: 'PAYE', amount: paye }
        ],
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
  calculateHousingLevy,
  calculateAllowances,
  calculateDeductions,
  calculatePayroll
}; 

