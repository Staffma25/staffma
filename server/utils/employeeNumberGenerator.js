const Employee = require('../models/Employee');

async function generateEmployeeNumber(businessName) {
  try {
    // Extract initials from business name
    const initials = businessName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();

    console.log('Generating employee number for business:', businessName);
    console.log('Business initials:', initials);

    // Find the latest employee number with these initials
    const latestEmployee = await Employee.findOne({
      employeeNumber: new RegExp(`^${initials}`)
    }).sort({ employeeNumber: -1 });

    console.log('Latest employee found:', latestEmployee);

    let nextNumber;
    if (latestEmployee && latestEmployee.employeeNumber) {
      // Extract the numeric part and increment
      const currentNumber = parseInt(latestEmployee.employeeNumber.replace(initials, ''));
      nextNumber = (currentNumber + 1).toString().padStart(4, '0');
    } else {
      // Start with 0001 if no employees exist
      nextNumber = '0001';
    }

    const employeeNumber = `${initials}${nextNumber}`;
    console.log('Generated employee number:', employeeNumber);

    return employeeNumber;
  } catch (error) {
    console.error('Error generating employee number:', error);
    throw new Error('Failed to generate employee number');
  }
}

module.exports = { generateEmployeeNumber }; 