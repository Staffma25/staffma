const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testGrossSalaryCalculation() {
  try {
    console.log('🧪 Testing Gross Salary Calculation Fix...\n');

    // Test 1: Check if payroll processing now includes allowances in gross salary
    console.log('1. Testing payroll processing with allowances...');
    
    const testData = {
      month: 12,
      year: 2024
    };

    const response = await axios.post(`${API_BASE_URL}/payroll/process`, testData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('✅ Payroll processing successful');
      
      // Test 2: Check the generated payroll records
      console.log('\n2. Checking payroll records for correct gross salary...');
      
      const historyResponse = await axios.get(`${API_BASE_URL}/payroll/history?month=12&year=2024`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`
        }
      });

      if (historyResponse.status === 200) {
        const payrollRecords = historyResponse.data;
        console.log(`Found ${payrollRecords.length} payroll records`);
        
        let allCorrect = true;
        payrollRecords.forEach((record, index) => {
          const basicSalary = record.basicSalary || 0;
          const totalAllowances = record.allowances?.total || 0;
          const grossSalary = record.grossSalary || 0;
          const expectedGross = basicSalary + totalAllowances;
          
          console.log(`\nRecord ${index + 1}: ${record.employeeId?.firstName} ${record.employeeId?.lastName}`);
          console.log(`  Basic Salary: ${basicSalary.toLocaleString()}`);
          console.log(`  Total Allowances: ${totalAllowances.toLocaleString()}`);
          console.log(`  Gross Salary: ${grossSalary.toLocaleString()}`);
          console.log(`  Expected Gross: ${expectedGross.toLocaleString()}`);
          
          if (Math.abs(grossSalary - expectedGross) > 1) { // Allow for small rounding differences
            console.log(`  ❌ GROSS SALARY MISMATCH! Expected ${expectedGross.toLocaleString()}, got ${grossSalary.toLocaleString()}`);
            allCorrect = false;
          } else {
            console.log(`  ✅ Gross salary calculation correct`);
          }
        });
        
        if (allCorrect) {
          console.log('\n🎉 All payroll records have correct gross salary calculations!');
        } else {
          console.log('\n❌ Some payroll records have incorrect gross salary calculations');
        }
      }
    }

    // Test 3: Check dashboard payroll summary
    console.log('\n3. Checking dashboard payroll summary...');
    
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token-here'}`
      }
    });

    if (dashboardResponse.status === 200) {
      const dashboardData = dashboardResponse.data;
      const payrollSummary = dashboardData.payrollSummary;
      
      console.log('Dashboard Payroll Summary:');
      console.log(`  Total Gross Salary: ${payrollSummary.totalGrossSalary?.toLocaleString() || 0}`);
      console.log(`  Total Net Salary: ${payrollSummary.totalNetSalary?.toLocaleString() || 0}`);
      console.log(`  Total Allowances: ${payrollSummary.totalAllowances?.toLocaleString() || 0}`);
      console.log(`  Total Deductions: ${payrollSummary.totalDeductions?.toLocaleString() || 0}`);
      
      // Verify that gross salary is greater than net salary (should be after deductions)
      if (payrollSummary.totalGrossSalary > payrollSummary.totalNetSalary) {
        console.log('✅ Dashboard shows correct relationship: Gross > Net');
      } else {
        console.log('❌ Dashboard shows incorrect relationship: Gross should be > Net');
      }
    }

    console.log('\n✅ Gross salary calculation fix test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testGrossSalaryCalculation(); 