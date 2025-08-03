const axios = require('axios');

async function testBookingAPI() {
  const BASE_URL = 'http://localhost:3001';
  
  console.log('=== Testing Booking API Endpoints ===\n');
  
  // Test endpoints we created
  const endpoints = [
    '/api/bookings/all-details',
    '/api/bookings/booking_all_details_of_user_to_vendor',
    '/api/booking_all_details_of_user_to_vendor/all-details',
    '/api/booking_all_details_of_user_to_vendor/booking_all_details_of_user_to_vendor',
    '/api/bookings/stats/summary'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${BASE_URL}${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response keys: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`📈 Data count: ${response.data.data.length}`);
        if (response.data.data.length > 0) {
          console.log(`🔍 Sample fields: ${Object.keys(response.data.data[0]).slice(0, 10).join(', ')}...`);
        }
      } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
        console.log(`📈 Bookings count: ${response.data.bookings.length}`);
        if (response.data.bookings.length > 0) {
          console.log(`🔍 Sample fields: ${Object.keys(response.data.bookings[0]).slice(0, 10).join(', ')}...`);
        }
      } else if (response.data.stats) {
        console.log(`📊 Stats: ${JSON.stringify(response.data.stats, null, 2)}`);
      }
      
      console.log('✅ SUCCESS\n');
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.response?.status || error.code} - ${error.message}`);
      if (error.response?.data) {
        console.log(`Error details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log('');
    }
  }
  
  // Test individual booking fetch
  try {
    console.log('Testing individual booking fetch...');
    const response = await axios.get(`${BASE_URL}/api/bookings/99`); // Using ID from sample data
    console.log(`✅ Individual booking fetch successful: ${response.data.success}`);
    if (response.data.data) {
      console.log(`📋 Booking ID: ${response.data.data.id}, User: ${response.data.data.user_name}`);
    }
  } catch (error) {
    console.log(`❌ Individual booking fetch failed: ${error.message}`);
  }
  
  console.log('\n=== API Testing Completed ===');
}

// Run the test
testBookingAPI().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});