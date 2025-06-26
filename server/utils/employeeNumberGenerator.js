const Employee = require('../models/Employee');

async function generateEmployeeNumber(businessName, retryCount = 0) {
  try {
    // Prevent infinite recursion
    if (retryCount > 5) {
      // Fallback: use timestamp-based numbering
      console.log('Using fallback timestamp-based numbering');
      return generateTimestampBasedNumber(businessName);
    }

    // Validate business name
    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      throw new Error('Invalid business name provided');
    }

    // Extract initials from business name
    const initials = businessName
      .trim()
      .split(' ')
      .filter(word => word.length > 0) // Filter out empty strings
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();

    // Ensure we have at least one initial
    if (initials.length === 0) {
      throw new Error('Could not extract initials from business name');
    }

    console.log('Generating employee number for business:', businessName);
    console.log('Business initials:', initials);

    // Find all existing employee numbers with these initials
    const existingEmployees = await Employee.find({
      employeeNumber: new RegExp(`^${initials}`)
    }).sort({ employeeNumber: 1 });

    console.log(`Found ${existingEmployees.length} existing employees with initials ${initials}`);

    let nextNumber = 1;
    
    if (existingEmployees.length > 0) {
      // Find the highest number used
      const numbers = existingEmployees.map(emp => {
        const numericPart = emp.employeeNumber.replace(/[^0-9]/g, '');
        return parseInt(numericPart, 10) || 0;
      });
      
      const maxNumber = Math.max(...numbers);
      nextNumber = maxNumber + 1;
      
      console.log('Highest existing number:', maxNumber, 'Next number will be:', nextNumber);
    }

    // Format the number with leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const employeeNumber = `${initials}${formattedNumber}`;
    
    console.log('Generated employee number:', employeeNumber);

    // Double-check that this number doesn't exist (race condition protection)
    const existingEmployee = await Employee.findOne({ employeeNumber });
    if (existingEmployee) {
      console.log('Employee number already exists, retrying with incremented number...');
      // Instead of recursion, try the next number directly
      return generateEmployeeNumber(businessName, retryCount + 1);
    }

    return employeeNumber;
  } catch (error) {
    console.error('Error generating employee number:', error);
    throw new Error(`Failed to generate employee number: ${error.message}`);
  }
}

// Fallback function using timestamp-based numbering
async function generateTimestampBasedNumber(businessName) {
  try {
    // Extract initials from business name
    const initials = businessName
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();

    // Use timestamp to ensure uniqueness
    const timestamp = Date.now();
    const lastFourDigits = timestamp.toString().slice(-4);
    
    const employeeNumber = `${initials}${lastFourDigits}`;
    
    console.log('Generated timestamp-based employee number:', employeeNumber);
    
    // Final check for uniqueness
    const existingEmployee = await Employee.findOne({ employeeNumber });
    if (existingEmployee) {
      // If even timestamp-based number exists, add a random suffix
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const finalEmployeeNumber = `${employeeNumber}${randomSuffix}`;
      console.log('Generated final employee number with random suffix:', finalEmployeeNumber);
      return finalEmployeeNumber;
    }
    
    return employeeNumber;
  } catch (error) {
    console.error('Error in timestamp-based numbering:', error);
    throw new Error('Failed to generate employee number with fallback method');
  }
}

module.exports = { generateEmployeeNumber }; 