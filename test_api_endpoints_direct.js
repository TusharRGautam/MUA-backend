/**
 * Test API endpoints directly via HTTP calls
 * This simulates what the frontend would do
 */

const http = require('http');

console.log('🔍 Testing API endpoints directly...\n');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Success: ${response.success || 'N/A'}`);
          
          if (response.data && response.data.message) {
            console.log(`   Message: ${response.data.message}`);
          }
          
          if (response.error) {
            console.log(`   Error: ${response.error}`);
          }
          
          resolve({ success: res.statusCode === 200 && !response.error, response });
        } catch (e) {
          console.log(`❌ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Raw response: ${data}`);
          resolve({ success: false, response: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}`);
      console.log(`   Connection Error: ${err.message}`);
      resolve({ success: false, response: null });
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${description}`);
      console.log(`   Timeout after 5 seconds`);
      req.destroy();
      resolve({ success: false, response: null });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing API endpoints on http://localhost:3000\n');
  
  // Test 1: Vendor Earnings API
  const earningsTest = await testEndpoint('/api/vendor/earnings/1', 'Vendor Earnings API (vendor ID: 1)');
  
  console.log('');
  
  // Test 2: Payout Transactions API  
  const transactionsTest = await testEndpoint('/api/vendor/payout-transactions/1', 'Payout Transactions API (vendor ID: 1)');
  
  console.log('\n📊 API ENDPOINT TEST RESULTS:');
  console.log('=' .repeat(50));
  console.log(`🔹 Vendor Earnings: ${earningsTest.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`🔹 Payout Transactions: ${transactionsTest.success ? '✅ WORKING' : '❌ FAILED'}`);
  
  const allWorking = earningsTest.success && transactionsTest.success;
  
  if (allWorking) {
    console.log('\n🎉 ALL API ENDPOINTS ARE WORKING!');
    console.log('The 404 errors should be resolved.');
  } else {
    console.log('\n⚠️  SOME ENDPOINTS ARE NOT WORKING');
    console.log('This suggests the server needs to be restarted to load the fixed routes.');
    console.log('\n💡 SOLUTION:');
    console.log('1. Stop the backend server (Ctrl+C)');
    console.log('2. Start it again: cd MUA-backend && npm start');
    console.log('3. The fixed routes should then work properly');
  }
  
  console.log('\n🏁 API endpoint tests completed!');
}

runTests().catch(error => {
  console.error('💥 Test failed:', error);
});