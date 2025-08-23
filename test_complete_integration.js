const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Integration Test
 * Tests all Razorpay payout and bank details implementations
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_VENDOR_ID = '1';

console.log('🧪 COMPREHENSIVE RAZORPAY INTEGRATION TEST');
console.log('='.repeat(60));
console.log(`🌐 API Base URL: ${API_BASE_URL}`);
console.log(`👤 Test Vendor ID: ${TEST_VENDOR_ID}`);
console.log('='.repeat(60));

/**
 * Test 1: Database Structure Verification
 */
async function testDatabaseStructure() {
  console.log('\n🗄️  1. TESTING DATABASE STRUCTURE');
  console.log('-'.repeat(40));
  
  try {
    const { query } = require('./db');
    
    // Test payout columns
    console.log('📊 Checking payout columns...');
    const payoutColumns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_amount', 'company_commission', 'payout_status', 'payout_id', 'payout_reference', 'payout_date')
      ORDER BY column_name
    `);
    
    console.log('✅ Payout columns found:');
    payoutColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Test bank details columns
    console.log('\n🏦 Checking bank details columns...');
    const bankColumns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'registration_and_other_details' 
      AND column_name IN ('account_holder_name', 'account_number', 'ifsc_code', 'razorpay_contact_id', 'razorpay_fund_account_id')
      ORDER BY column_name
    `);
    
    console.log('✅ Bank details columns found:');
    bankColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    return { payoutColumns: payoutColumns.rows.length, bankColumns: bankColumns.rows.length };
    
  } catch (error) {
    console.log('❌ Database structure test failed:', error.message);
    return { payoutColumns: 0, bankColumns: 0 };
  }
}

/**
 * Test 2: API Connectivity
 */
async function testAPIConnectivity() {
  console.log('\n🔗 2. TESTING API CONNECTIVITY');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Backend server is running');
    console.log(`   Response: ${response.data.message || 'Server online'}`);
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running');
    console.log('💡 Start server: cd MUA-backend && npm start');
    return false;
  }
}

/**
 * Test 3: Vendor Earnings API
 */
async function testVendorEarningsAPI() {
  console.log('\n💰 3. TESTING VENDOR EARNINGS API');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vendor/earnings/${TEST_VENDOR_ID}`);
    
    if (response.data.success) {
      const earnings = response.data.data;
      console.log('✅ Vendor earnings API working');
      console.log(`   Total Earnings: ₹${earnings.totalEarnings || 0}`);
      console.log(`   Today's Earnings: ₹${earnings.todayEarnings || 0}`);
      console.log(`   Settled Amount: ₹${earnings.settledAmount || 0}`);
      console.log(`   Recent Transactions: ${earnings.recentTransactions.length}`);
      
      // Test if transaction structure is correct
      if (earnings.recentTransactions.length > 0) {
        const tx = earnings.recentTransactions[0];
        console.log('📋 Sample transaction structure:');
        console.log(`   - Has vendorAmount: ${tx.vendorAmount !== undefined}`);
        console.log(`   - Has companyCommission: ${tx.companyCommission !== undefined}`);
        console.log(`   - Has payoutId: ${tx.payoutId !== undefined}`);
        console.log(`   - Has payoutStatus: ${tx.status !== undefined}`);
      }
      
      return earnings;
    } else {
      console.log('❌ Earnings API returned error:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Earnings API test failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error || error.response.data.message}`);
    }
    return null;
  }
}

/**
 * Test 4: Payout Configuration API
 */
async function testPayoutConfigAPI() {
  console.log('\n⚙️  4. TESTING PAYOUT CONFIGURATION API');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vendor/payout-config`);
    
    if (response.data.success) {
      const config = response.data.data;
      console.log('✅ Payout config API working');
      console.log(`   Vendor Percentage: ${config.vendorPercentage}%`);
      console.log(`   Company Percentage: ${config.companyPercentage}%`);
      console.log(`   Split correct: ${config.vendorPercentage === 75 && config.companyPercentage === 25 ? 'Yes' : 'No'}`);
      return config;
    } else {
      console.log('❌ Payout config API error:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Payout config API test failed:', error.message);
    return null;
  }
}

/**
 * Test 5: Frontend Integration Files
 */
function testFrontendIntegration() {
  console.log('\n📱 5. TESTING FRONTEND INTEGRATION');
  console.log('-'.repeat(40));
  
  const requiredFiles = [
    'dashboard-app/app/business-dashboard.tsx',
    'dashboard-app/components/VendorEarningsDashboard.tsx',
    'dashboard-app/app/vendor-earnings.tsx',
    'dashboard-app/services/razorpayPayoutService.ts'
  ];
  
  let passedTests = 0;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
      
      // Check for specific implementations
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (file.includes('business-dashboard.tsx')) {
        const hasBankDetails = content.includes('bankDetails') && content.includes('Account Holder Name');
        const hasEarningsAPI = content.includes('/api/vendor/earnings');
        console.log(`   - Bank details form: ${hasBankDetails ? '✅' : '❌'}`);
        console.log(`   - Earnings API call: ${hasEarningsAPI ? '✅' : '❌'}`);
        if (hasBankDetails && hasEarningsAPI) passedTests++;
      }
      
      if (file.includes('VendorEarningsDashboard.tsx')) {
        const hasPaymentBreakdown = content.includes('companyCommission') && content.includes('vendor_amount');
        const hasPayoutInfo = content.includes('payoutId') && content.includes('payoutReference');
        console.log(`   - Payment breakdown: ${hasPaymentBreakdown ? '✅' : '❌'}`);
        console.log(`   - Payout information: ${hasPayoutInfo ? '✅' : '❌'}`);
        if (hasPaymentBreakdown && hasPayoutInfo) passedTests++;
      }
      
      if (file.includes('vendor-earnings.tsx')) {
        const hasNavigation = content.includes('VendorEarningsDashboard');
        console.log(`   - Earnings page setup: ${hasNavigation ? '✅' : '❌'}`);
        if (hasNavigation) passedTests++;
      }
      
      if (file.includes('razorpayPayoutService.ts')) {
        const hasUpdatedTypes = content.includes('finalAmount') && content.includes('companyCommission');
        console.log(`   - Updated TypeScript types: ${hasUpdatedTypes ? '✅' : '❌'}`);
        if (hasUpdatedTypes) passedTests++;
      }
      
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
  return passedTests;
}

/**
 * Test 6: Configuration Check
 */
function testConfiguration() {
  console.log('\n🔧 6. TESTING CONFIGURATION');
  console.log('-'.repeat(40));
  
  try {
    const razorpayConfig = require('./config/razorpayPayout');
    console.log('✅ Razorpay payout config loaded');
    console.log(`   Key ID: ${razorpayConfig.RAZORPAY_CONFIG.key_id ? 'Present' : 'Missing'}`);
    console.log(`   Vendor split: ${razorpayConfig.PAYOUT_SPLIT.VENDOR_PERCENTAGE * 100}%`);
    console.log(`   Company split: ${razorpayConfig.PAYOUT_SPLIT.COMPANY_PERCENTAGE * 100}%`);
    
    const envExample = fs.existsSync('.env.example');
    console.log(`   .env.example file: ${envExample ? '✅ Present' : '❌ Missing'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runCompleteTest() {
  console.log('🚀 Starting comprehensive integration test...\n');
  
  const results = {
    database: await testDatabaseStructure(),
    apiConnectivity: await testAPIConnectivity(),
    earnings: null,
    payoutConfig: null,
    frontend: 0,
    configuration: false
  };
  
  // Only test APIs if server is running
  if (results.apiConnectivity) {
    results.earnings = await testVendorEarningsAPI();
    results.payoutConfig = await testPayoutConfigAPI();
  }
  
  results.frontend = testFrontendIntegration();
  results.configuration = testConfiguration();
  
  // Print comprehensive summary
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('🗄️  Database Structure:');
  console.log(`   Payout columns: ${results.database.payoutColumns}/6 ✅`);
  console.log(`   Bank details columns: ${results.database.bankColumns}/5 ✅`);
  
  console.log('\n🔗 Backend APIs:');
  console.log(`   Server connectivity: ${results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Vendor earnings API: ${results.earnings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Payout config API: ${results.payoutConfig ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📱 Frontend Integration:');
  console.log(`   Component files: ${results.frontend}/4 ✅`);
  
  console.log('\n🔧 Configuration:');
  console.log(`   Razorpay setup: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`);
  
  // Calculate overall score
  const totalTests = 8;
  let passedTests = 0;
  
  if (results.database.payoutColumns >= 6 && results.database.bankColumns >= 5) passedTests++;
  if (results.apiConnectivity) passedTests++;
  if (results.earnings) passedTests++;
  if (results.payoutConfig) passedTests++;
  if (results.frontend >= 3) passedTests++;
  if (results.configuration) passedTests++;
  
  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
  
  // Provide actionable next steps
  console.log('\n📋 NEXT STEPS:');
  
  if (!results.apiConnectivity) {
    console.log('❗ Start backend server: cd MUA-backend && npm start');
  } else if (results.apiConnectivity && results.earnings && results.payoutConfig) {
    console.log('✅ Backend is ready!');
  }
  
  if (results.frontend >= 3) {
    console.log('✅ Frontend integration is ready!');
  }
  
  if (passedTests >= 6) {
    console.log('🎉 INTEGRATION IS READY FOR TESTING!');
    console.log('   1. Start the backend server');
    console.log('   2. Test bank details form in activation modal');
    console.log('   3. Complete a booking to see vendor earnings');
    console.log('   4. Check earnings in dashboard and earnings page');
  } else {
    console.log('⚠️  Some components need attention - check failed tests above');
  }
  
  console.log('\n🏁 Comprehensive test completed!');
  console.log('='.repeat(60));
}

// Run the comprehensive test
runCompleteTest().catch(error => {
  console.error('💥 Fatal error during testing:', error);
  process.exit(1);
});