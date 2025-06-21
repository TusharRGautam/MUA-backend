const http = require('http');

console.log('🧪 Testing Notification System...\n');

// Test vendor bookings API
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/vendor/bookings/35',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Response:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success) {
        console.log('\n✅ API is working!');
        console.log(`📋 Found ${jsonData.bookings?.length || 0} bookings`);
        console.log('📊 Stats:', jsonData.stats);
      } else {
        console.log('\n❌ API returned error:', jsonData.error);
      }
    } catch (error) {
      console.log('\n❌ Failed to parse JSON response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end(); 