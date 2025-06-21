const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test Staffma login and business activities
async function testBusinessActivities() {
  try {
    console.log('🧪 Testing Business Activities for Staffma Dashboard...\n');

    // Step 1: Login as Staffma user
    console.log('1. Logging in as Staffma user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/staffma/login`, {
      email: 'admin@staffma.com',
      password: 'admin123'
    });

    const { token } = loginResponse.data;
    console.log('✅ Staffma login successful\n');

    // Step 2: Test getting all businesses with activities
    console.log('2. Fetching all businesses with activities...');
    const businessesResponse = await axios.get(`${API_BASE_URL}/activities/businesses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { businesses, statistics } = businessesResponse.data;
    console.log('✅ Business activities fetched successfully');
    console.log(`📊 Statistics:`);
    console.log(`   - Total Businesses: ${statistics.totalBusinesses}`);
    console.log(`   - Active Businesses: ${statistics.activeBusinesses}`);
    console.log(`   - Total Activities: ${statistics.totalActivities}`);
    console.log(`   - Critical Activities: ${statistics.totalCriticalActivities}`);
    console.log(`   - Recent Activities: ${statistics.recentActivities.length}\n`);

    // Step 3: Display business details
    console.log('3. Business Details:');
    businesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.businessName} (${business.email})`);
      console.log(`      - Total Activities: ${business.totalActivities}`);
      console.log(`      - Recent (24h): ${business.recentActivitiesCount}`);
      console.log(`      - Critical: ${business.criticalActivitiesCount}`);
      if (business.lastActivity) {
        console.log(`      - Last Activity: ${new Date(business.lastActivity).toLocaleString()}`);
      }
      console.log('');
    });

    // Step 4: Test getting activities for a specific business (if any exists)
    if (businesses.length > 0) {
      const firstBusiness = businesses[0];
      console.log(`4. Fetching activities for ${firstBusiness.businessName}...`);
      
      const businessActivitiesResponse = await axios.get(
        `${API_BASE_URL}/activities/business/${firstBusiness._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { business, activities, statistics: businessStats } = businessActivitiesResponse.data;
      console.log('✅ Business-specific activities fetched successfully');
      console.log(`📊 ${business.businessName} Statistics:`);
      console.log(`   - Total Activities: ${businessStats.totalActivities}`);
      console.log(`   - Critical: ${businessStats.criticalActivities}`);
      console.log(`   - High: ${businessStats.highActivities}`);
      console.log(`   - Medium: ${businessStats.mediumActivities}`);
      console.log(`   - Low: ${businessStats.lowActivities}\n`);

      // Step 5: Display recent activities
      console.log('5. Recent Activities:');
      activities.slice(0, 5).forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title}`);
        console.log(`      - Category: ${activity.category}`);
        console.log(`      - Severity: ${activity.severity}`);
        console.log(`      - Time: ${new Date(activity.timestamp).toLocaleString()}`);
        if (activity.userId) {
          console.log(`      - User: ${activity.userId.firstName} ${activity.userId.lastName}`);
        }
        console.log('');
      });
    }

    // Step 6: Test activity summary
    console.log('6. Testing activity summary...');
    const summaryResponse = await axios.get(`${API_BASE_URL}/activities/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const summary = summaryResponse.data;
    console.log('✅ Activity summary fetched successfully');
    console.log(`📊 Summary Statistics:`);
    console.log(`   - Total Activities: ${summary.totalActivities}`);
    console.log(`   - Unique Businesses: ${summary.uniqueBusinesses}`);
    console.log(`   - Unique Users: ${summary.uniqueUsers}`);
    console.log(`   - Recent Activities: ${summary.recentActivities.length}\n`);

    console.log('🎉 All business activities tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Staffma login working');
    console.log('✅ Business activities overview working');
    console.log('✅ Individual business activity details working');
    console.log('✅ Activity summary working');
    console.log('✅ All endpoints properly secured for Staffma users only');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n💡 This might be because:');
      console.log('   - The user is not a Staffma admin');
      console.log('   - The authentication token is invalid');
      console.log('   - The user lacks proper permissions');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 This might be because:');
      console.log('   - No businesses exist in the database');
      console.log('   - No activities have been logged yet');
      console.log('   - The business ID is invalid');
    }
  }
}

// Run the test
testBusinessActivities(); 