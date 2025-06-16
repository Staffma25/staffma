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
      const numericPart = latestEmployee.employeeNumber.replace(/[^0-9]/g, '');
      const currentNumber = parseInt(numericPart, 10);
      
      if (isNaN(currentNumber)) {
        // If parsing fails, start with 0001
        nextNumber = '0001';
      } else {
        // Add a random number between 1-9 to avoid conflicts in concurrent requests
        const randomIncrement = Math.floor(Math.random() * 9) + 1;
        nextNumber = (currentNumber + randomIncrement).toString().padStart(4, '0');
      }
    } else {
      // Start with 0001 if no employees exist
      nextNumber = '0001';
    }

    const employeeNumber = `${initials}${nextNumber}`;
    console.log('Generated employee number:', employeeNumber);

    // Verify the number is unique
    const existingEmployee = await Employee.findOne({ employeeNumber });
    if (existingEmployee) {
      // If number exists, try again with a different random increment
      return generateEmployeeNumber(businessName);
    }

    return employeeNumber;
  } catch (error) {
    console.error('Error generating employee number:', error);
    throw new Error('Failed to generate employee number');
  }
}

module.exports = { generateEmployeeNumber }; 