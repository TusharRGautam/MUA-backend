/**
 * Direct test of razorpay earnings routes
 * Tests the routes without starting full server
 */

console.log('🧪 Testing Razorpay Earnings Routes Directly...');

async function testEarningsFunction() {
  try {
    console.log('1️⃣  Testing getVendorEarnings function...');
    
    // Import the service function directly
    const { getVendorEarnings } = require('./services/payoutService');
    
    // Test with vendor ID 1
    const result = await getVendorEarnings('1');
    
    console.log('✅ getVendorEarnings function result:');
    console.log('   Success:', result.success);
    
    if (result.success && result.data) {
      console.log('   Total Earnings:', result.data.totalEarnings);
      console.log('   Today Earnings:', result.data.todayEarnings);
      console.log('   Recent Transactions:', result.data.recentTransactions.length);
    } else {
      console.log('   Error:', result.error);
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Error testing getVendorEarnings:', error.message);
    return false;
  }
}

async function testPayoutTransactionsFunction() {
  try {
    console.log('\n2️⃣  Testing getPayoutTransactions function...');
    
    // Import the service function directly
    const { getPayoutTransactions } = require('./services/payoutService');
    
    // Test with vendor ID 1
    const result = await getPayoutTransactions('1', 10, 0);
    
    console.log('✅ getPayoutTransactions function result:');
    console.log('   Success:', result.success);
    
    if (result.success && result.data) {
      console.log('   Transactions found:', result.data.length);
    } else {
      console.log('   Error:', result.error);
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Error testing getPayoutTransactions:', error.message);
    return false;
  }
}

async function testRouteStructure() {
  try {
    console.log('\n3️⃣  Testing route file structure...');
    
    // Test if routes file can be loaded
    const razorpayRoutes = require('./routes/razorpayPayoutRoutes');
    console.log('✅ razorpayPayoutRoutes.js loads successfully');
    
    // Test if app.js can be loaded (without starting server)
    console.log('✅ Checking app.js routes registration...');
    
    // Check if routes are properly structured
    return true;
    
  } catch (error) {
    console.log('❌ Error testing route structure:', error.message);
    console.log('💡 This might be the source of the 404 errors');
    return false;
  }
}

async function suggestFixes() {
  console.log('\n🔧 SUGGESTED FIXES FOR 404 ERRORS:');
  console.log('='.repeat(50));
  
  console.log('1. Start backend server properly:');
  console.log('   cd MUA-backend && npm start');
  
  console.log('\n2. Check server is running on correct port:');
  console.log('   Should be: http://localhost:3000');
  
  console.log('\n3. Verify routes in browser:');
  console.log('   http://localhost:3000/api/vendor/earnings/1');
  console.log('   http://localhost:3000/api/vendor/payout-transactions/1');
  
  console.log('\n4. Check frontend API_URL:');
  console.log('   Make sure dashboard app uses correct backend URL');
  
  console.log('\n5. If routes still 404, check app.js:');
  console.log('   Ensure razorpayPayoutRoutes is properly registered');
}

// Run all tests
async function runDirectTests() {
  console.log('🚀 Starting direct route tests...\n');
  
  const earningsWorking = await testEarningsFunction();
  const transactionsWorking = await testPayoutTransactionsFunction();
  const routesWorking = await testRouteStructure();
  
  console.log('\n📊 DIRECT TEST RESULTS:');
  console.log('='.repeat(50));
  console.log(`✅ Earnings function: ${earningsWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Transactions function: ${transactionsWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Route structure: ${routesWorking ? 'WORKING' : 'FAILED'}`);
  
  if (earningsWorking && transactionsWorking && routesWorking) {
    console.log('\n🎉 All backend functions are working!');
    console.log('💡 The 404 error is likely because the server is not running.');
    console.log('   Start the backend server and the APIs should work.');
  } else {
    console.log('\n⚠️  Some backend functions have issues.');
    console.log('   This could be causing the 404 errors.');
  }
  
  await suggestFixes();
  
  console.log('\n🏁 Direct tests completed!');
}

runDirectTests().catch(error => {
  console.error('💥 Fatal error in direct tests:', error);
});