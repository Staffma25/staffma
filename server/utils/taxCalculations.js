// Kenyan Tax Calculation Helper Functions
const calculatePAYE = (grossSalary) => {
  // Monthly PAYE tax bands for Kenya (2023)
  if (grossSalary <= 24000) {
    return 0;
  } else if (grossSalary <= 32333) {
    return (grossSalary - 24000) * 0.25;
  } else if (grossSalary <= 500000) {
    return ((grossSalary - 32333) * 0.30) + (8333 * 0.25);
  } else if (grossSalary <= 800000) {
    return ((grossSalary - 500000) * 0.325) + (467667 * 0.30) + (8333 * 0.25);
  } else {
    return ((grossSalary - 800000) * 0.35) + (300000 * 0.325) + (467667 * 0.30) + (8333 * 0.25);
  }
};

const calculateNHIF = (grossSalary) => {
  // NHIF rates for Kenya (2023)
  if (grossSalary <= 5999) return 150;
  if (grossSalary <= 7999) return 300;
  if (grossSalary <= 11999) return 400;
  if (grossSalary <= 14999) return 500;
  if (grossSalary <= 19999) return 600;
  if (grossSalary <= 24999) return 750;
  if (grossSalary <= 29999) return 850;
  if (grossSalary <= 34999) return 900;
  if (grossSalary <= 39999) return 950;
  if (grossSalary <= 44999) return 1000;
  if (grossSalary <= 49999) return 1100;
  if (grossSalary <= 59999) return 1200;
  if (grossSalary <= 69999) return 1300;
  if (grossSalary <= 79999) return 1400;
  if (grossSalary <= 89999) return 1500;
  if (grossSalary <= 99999) return 1600;
  return 1700;
};

const calculateNSSF = (grossSalary) => {
  // NSSF Tier I and II calculations (2023)
  const tier1Limit = 6000;
  const tier2Limit = 18000;
  let nssf = 0;

  // Tier I (6% up to 6,000)
  nssf += Math.min(grossSalary, tier1Limit) * 0.06;

  // Tier II (6% from 6,001 to 18,000)
  if (grossSalary > tier1Limit) {
    nssf += Math.min(grossSalary - tier1Limit, tier2Limit - tier1Limit) * 0.06;
  }

  return nssf;
};

const calculatePayroll = (employee) => {
  // Ensure basic salary is a number
  const basicSalary = Number(employee.salary.basic) || 0;
  
  // Sum up allowances
  const allowances = Object.values(employee.salary.allowances || {})
    .reduce((sum, val) => sum + (Number(val) || 0), 0);
  
  // Calculate gross salary
  const grossSalary = basicSalary + allowances;

  // Calculate statutory deductions
  const paye = calculatePAYE(grossSalary);
  const nhif = calculateNHIF(grossSalary);
  const nssf = calculateNSSF(grossSalary);
  
  // Sum up other deductions
  const otherDeductions = Object.values(employee.salary.deductions || {})
    .reduce((sum, val) => sum + (Number(val) || 0), 0);

  // Calculate total deductions
  const totalDeductions = paye + nhif + nssf + otherDeductions;

  // Calculate net salary
  const netSalary = grossSalary - totalDeductions;

  return {
    earnings: {
      basicSalary,
      allowances,
      grossSalary
    },
    deductions: {
      paye,
      nhif,
      nssf,
      other: otherDeductions,
      totalDeductions
    },
    netSalary
  };
};

module.exports = {
  calculatePAYE,
  calculateNHIF,
  calculateNSSF,
  calculatePayroll
}; 

