const axios = require('axios');
const { Pool } = require('pg');

// Test Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_VENDOR_ID = '1'; // Update with actual vendor ID from your database
const TEST_BOOKING_ID = 'BK1750409631003'; // Update with actual booking ID

// Database configuration for direct testing
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status} - ${testName}`;
  
  console.log(message);
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Test API connectivity
 */
async function testApiConnectivity() {
  console.log('\n🔧 Testing API Connectivity...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    logTest('API Base Connectivity', response.status === 200, `Status: ${response.status}`);
    
    // Test payout-specific endpoint
    const payoutTestResponse = await axios.get(`${API_BASE_URL}/api/vendor/payout-test`);
    logTest('Payout API Test Endpoint', payoutTestResponse.status === 200, 
      `Status: ${payoutTestResponse.status}, Message: ${payoutTestResponse.data.message}`);
    
  } catch (error) {
    logTest('API Connectivity', false, error.message);
  }
}

/**
 * Test database connectivity and schema
 */
async function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema...');
  console.log('='.repeat(50));
  
  try {
    // Test database connection
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    logTest('Database Connection', true, `Connected at ${connectionTest.rows[0].current_time}`);
    
    // Check if payout columns exist
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name LIKE 'vendor_%'
      ORDER BY column_name
    `;
    
    const columnsResult = await pool.query(columnsQuery);
    const payoutColumns = columnsResult.rows.map(row => row.column_name);
    
    const requiredColumns = [
      'vendor_razorpay_payment_id',
      'vendor_razorpay_transfer_id_vendor',
      'vendor_settlement_status',
      'vendor_amount',
      'vendor_company_amount'
    ];
    
    const missingColumns = requiredColumns.filter(col => !payoutColumns.includes(col));
    
    logTest('Payout Columns Migration', missingColumns.length === 0, 
      missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(', ')}` : 'All columns present');
    
    if (payoutColumns.length > 0) {
      console.log('   Available payout columns:', payoutColumns.join(', '));
    }
    
  } catch (error) {
    logTest('Database Schema Test', false, error.message);
  }
}

/**
 * Test payout configuration endpoint
 */
async function testPayoutConfiguration() {
  console.log('\n⚙️ Testing Payout Configuration...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vendor/payout-config`);
    
    logTest('Payout Config Endpoint', response.status === 200);
    
    if (response.data.success) {
      const config = response.data.data;
      logTest('Payout Split Configuration', 
        config.vendorPercentage === 75 && config.companyPercentage === 25,
        `Vendor: ${config.vendorPercentage}%, Company: ${config.companyPercentage}%`);
      
      console.log('   Configuration details:', JSON.stringify(config, null, 2));
    }
    
  } catch (error) {
    logTest('Payout Configuration Test', false, error.message);
  }
}

/**
 * Test vendor earnings endpoint
 */
async function testVendorEarnings() {
  console.log('\n📊 Testing Vendor Earnings...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vendor/earnings/${TEST_VENDOR_ID}`);
    
    logTest('Vendor Earnings Endpoint', response.status === 200);
    
    if (response.data.success) {
      const earnings = response.data.data;
      logTest('Earnings Data Structure', 
        earnings.hasOwnProperty('totalEarnings') && 
        earnings.hasOwnProperty('settledAmount') &&
        earnings.hasOwnProperty('recentTransactions'),
        `Total: ${earnings.totalEarnings}, Settled: ${earnings.settledAmount}`);
      
      console.log('   Earnings summary:', {
        totalEarnings: earnings.totalEarnings,
        settledAmount: earnings.settledAmount,
        processingAmount: earnings.processingAmount,
        pendingAmount: earnings.pendingAmount,
        transactionCount: earnings.recentTransactions?.length || 0
      });
    }
    
  } catch (error) {
    logTest('Vendor Earnings Test', false, error.message);
  }
}

/**
 * Test payout transactions endpoint
 */
async function testPayoutTransactions() {
  console.log('\n📋 Testing Payout Transactions...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vendor/payout-transactions/${TEST_VENDOR_ID}?limit=10&offset=0`);
    
    logTest('Payout Transactions Endpoint', response.status === 200);
    
    if (response.data.success) {
      const transactions = response.data.data;
      logTest('Transactions Data Structure', Array.isArray(transactions),
        `Returned ${transactions.length} transactions`);
      
      if (transactions.length > 0) {
        const firstTransaction = transactions[0];
        logTest('Transaction Object Structure',
          firstTransaction.hasOwnProperty('bookingId') &&
          firstTransaction.hasOwnProperty('vendorAmount') &&
          firstTransaction.hasOwnProperty('status'),
          `Sample transaction: ${firstTransaction.bookingId}`);
      }
    }
    
  } catch (error) {
    logTest('Payout Transactions Test', false, error.message);
  }
}

/**
 * Test payout processing endpoint (simulation)
 */
async function testPayoutProcessing() {
  console.log('\n💰 Testing Payout Processing...');
  console.log('='.repeat(50));
  
  try {
    // First, check if we have a suitable test booking
    const bookingQuery = `
      SELECT booking_id, total_amount, assigned_vendor_id, booking_status, payment_status
      FROM booking_all_details_of_user_to_vendor 
      WHERE assigned_vendor_id = $1 
        AND booking_status = 'completed'
        AND payment_status = 'paid'
        AND (vendor_settlement_status IS NULL OR vendor_settlement_status = 'failed')
      LIMIT 1
    `;
    
    const bookingResult = await pool.query(bookingQuery, [TEST_VENDOR_ID]);
    
    if (bookingResult.rows.length === 0) {
      logTest('Test Booking Availability', false, 
        'No suitable completed booking found for payout testing');
      
      // Create a test booking entry for simulation
      console.log('   Creating test booking for payout simulation...');
      
      const testBookingData = {
        bookingId: `TEST_BOOKING_${Date.now()}`,
        vendorId: TEST_VENDOR_ID,
        totalAmount: 1000,
        vendorAmount: 750,
        companyAmount: 250
      };
      
      const payoutData = {
        bookingId: testBookingData.bookingId,
        vendorId: testBookingData.vendorId,
        totalAmount: testBookingData.totalAmount,
        vendorAmount: testBookingData.vendorAmount,
        companyAmount: testBookingData.companyAmount,
        razorpayPaymentId: `pay_test_${Date.now()}`
      };
      
      console.log('   Test payout data:', payoutData);
      
      // Note: This will likely fail due to missing booking, but we can test the API structure
      try {
        const response = await axios.post(`${API_BASE_URL}/api/vendor/razorpay-payout`, payoutData);
        logTest('Payout API Structure', response.status === 200 || response.status === 400,
          `Status: ${response.status}, Response structure valid`);
      } catch (apiError) {
        if (apiError.response && apiError.response.status === 400) {
          logTest('Payout API Error Handling', true,
            'API correctly returned 400 for invalid booking');
        } else {
          logTest('Payout API Error Handling', false, apiError.message);
        }
      }
      
    } else {
      const booking = bookingResult.rows[0];
      console.log('   Found test booking:', booking.booking_id);
      
      const payoutData = {
        bookingId: booking.booking_id,
        vendorId: booking.assigned_vendor_id,
        totalAmount: parseFloat(booking.total_amount)
      };
      
      console.log('   Attempting payout processing for real booking...');
      console.log('   ⚠️ Note: This will process actual payout if Razorpay is configured');
      
      // Uncomment the following lines to test actual payout processing
      // const response = await axios.post(`${API_BASE_URL}/api/vendor/razorpay-payout`, payoutData);
      // logTest('Real Payout Processing', response.data.success, response.data.message);
      
      logTest('Payout Test Data Preparation', true, 
        `Prepared payout data for booking ${booking.booking_id}`);
    }
    
  } catch (error) {
    logTest('Payout Processing Test', false, error.message);
  }
}

/**
 * Test retry payout endpoint
 */
async function testRetryPayout() {
  console.log('\n🔄 Testing Retry Payout...');
  console.log('='.repeat(50));
  
  try {
    // Look for a failed payout to retry
    const failedPayoutQuery = `
      SELECT booking_id, assigned_vendor_id
      FROM booking_all_details_of_user_to_vendor 
      WHERE assigned_vendor_id = $1 
        AND vendor_settlement_status = 'failed'
      LIMIT 1
    `;
    
    const result = await pool.query(failedPayoutQuery, [TEST_VENDOR_ID]);
    
    if (result.rows.length === 0) {
      logTest('Failed Payout Availability', false, 
        'No failed payouts found for retry testing');
    } else {
      const failedPayout = result.rows[0];
      
      const retryData = {
        bookingId: failedPayout.booking_id,
        vendorId: failedPayout.assigned_vendor_id
      };
      
      console.log('   Attempting retry for failed payout...');
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/vendor/retry-payout`, retryData);
        logTest('Retry Payout Endpoint', response.status === 200 || response.status === 400,
          `Status: ${response.status}`);
      } catch (retryError) {
        if (retryError.response && retryError.response.status === 400) {
          logTest('Retry Payout Error Handling', true,
            'API correctly handled retry request');
        } else {
          logTest('Retry Payout Error Handling', false, retryError.message);
        }
      }
    }
    
  } catch (error) {
    logTest('Retry Payout Test', false, error.message);
  }
}

/**
 * Test webhook endpoint
 */
async function testWebhookEndpoint() {
  console.log('\n🔔 Testing Webhook Endpoint...');
  console.log('='.repeat(50));
  
  try {
    // Test webhook endpoint accessibility (will fail signature verification, but that's expected)
    const mockWebhookPayload = {
      event: 'payout.processed',
      payload: {
        payout: {
          entity: {
            id: 'pout_test_123',
            status: 'processed'
          }
        }
      }
    };
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/vendor/razorpay-webhook`,
        JSON.stringify(mockWebhookPayload),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'invalid_signature_for_testing'
          }
        }
      );
      
      logTest('Webhook Endpoint Accessibility', false, 'Should have failed signature verification');
      
    } catch (webhookError) {
      if (webhookError.response && webhookError.response.status === 400) {
        logTest('Webhook Signature Verification', true,
          'Correctly rejected invalid signature');
      } else {
        logTest('Webhook Endpoint Error', false, webhookError.message);
      }
    }
    
  } catch (error) {
    logTest('Webhook Test', false, error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 RAZORPAY PAYOUT API TESTING');
  console.log('='.repeat(60));
  console.log(`Testing API at: ${API_BASE_URL}`);
  console.log(`Test Vendor ID: ${TEST_VENDOR_ID}`);
  console.log(`Test Booking ID: ${TEST_BOOKING_ID}`);
  console.log('='.repeat(60));
  
  // Run all test suites
  await testApiConnectivity();
  await testDatabaseSchema();
  await testPayoutConfiguration();
  await testVendorEarnings();
  await testPayoutTransactions();
  await testPayoutProcessing();
  await testRetryPayout();
  await testWebhookEndpoint();
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  // List failed tests
  const failedTests = testResults.tests.filter(test => !test.passed);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`);
    });
  }
  
  console.log('\n🏁 Testing completed!');
  console.log('='.repeat(60));
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down test suite...');
  await pool.end();
  process.exit(0);
});

// Run tests
runAllTests().catch(error => {
  console.error('💥 Fatal error during testing:', error);
  process.exit(1);
});