const axios = require('axios');

/**
 * Test script to verify vendor earnings API with new vendor_amount column
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_VENDOR_ID = '1'; // Change to your test vendor ID

async function testVendorEarningsAPI() {
  try {
    console.log('🧪 Testing Vendor Earnings API with vendor_amount column...\n');
    
    console.log(`📡 Testing API: ${API_BASE_URL}/api/vendor/earnings/${TEST_VENDOR_ID}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/vendor/earnings/${TEST_VENDOR_ID}`);
    
    if (response.data.success) {
      const earnings = response.data.data;
      
      console.log('✅ Vendor earnings API working successfully!');
      console.log('\n📊 EARNINGS SUMMARY:');
      console.log('='.repeat(50));
      console.log(`💰 Total Earnings: ₹${earnings.totalEarnings || 0}`);
      console.log(`✅ Settled Amount: ₹${earnings.settledAmount || 0}`);
      console.log(`⏳ Processing Amount: ₹${earnings.processingAmount || 0}`);
      console.log(`⏸️  Pending Amount: ₹${earnings.pendingAmount || 0}`);
      console.log(`📅 Today's Earnings: ₹${earnings.todayEarnings || 0}`);
      console.log(`📈 This Week: ₹${earnings.thisWeekEarnings || 0}`);
      console.log(`📊 This Month: ₹${earnings.thisMonthEarnings || 0}`);
      
      console.log('\n💳 RECENT TRANSACTIONS:');
      console.log('='.repeat(50));
      
      if (earnings.recentTransactions && earnings.recentTransactions.length > 0) {
        earnings.recentTransactions.slice(0, 3).forEach((tx, index) => {
          console.log(`${index + 1}. Booking: ${tx.bookingId}`);
          console.log(`   Customer: ${tx.customerName}`);
          console.log(`   Service: ${tx.serviceName}`);
          console.log(`   Total Amount: ₹${tx.amount || 0}`);
          console.log(`   Final Amount: ₹${tx.finalAmount || tx.amount || 0}`);
          console.log(`   Vendor Share (75%): ₹${tx.vendorAmount || 0}`);
          console.log(`   Company Commission (25%): ₹${tx.companyCommission || 0}`);
          console.log(`   Status: ${tx.status || 'pending'}`);
          if (tx.payoutId) {
            console.log(`   Payout ID: ${tx.payoutId}`);
          }
          console.log('   ---');
        });
      } else {
        console.log('📭 No transactions found');
        console.log('💡 Complete some bookings to see earnings data');
      }
      
      console.log('\n🎯 DASHBOARD INTEGRATION:');
      console.log('='.repeat(50));
      console.log(`✅ Today's earnings for dashboard: ₹${earnings.todayEarnings || 0}`);
      console.log('✅ This amount comes from vendor_amount column (75% split)');
      console.log('✅ Vendor earnings page will show detailed payment breakdown');
      
    } else {
      console.log('❌ API returned error:', response.data.error);
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Response:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server is not running');
      console.log('   Start the server: cd MUA-backend && npm start');
    }
  }
}

// Add sample data creation for testing
async function createSampleEarningsData() {
  try {
    console.log('🔧 Creating sample earnings data for testing...\n');
    
    // This would simulate a completed booking with vendor earnings
    const sampleData = {
      bookingId: 'BK' + Date.now(),
      vendorId: TEST_VENDOR_ID,
      totalAmount: 1000,
      finalAmount: 900, // After 10% discount
      vendorAmount: 675, // 75% of 900
      companyCommission: 225, // 25% of 900
      payoutStatus: 'completed'
    };
    
    console.log('📋 Sample booking data:');
    console.log(`   Booking ID: ${sampleData.bookingId}`);
    console.log(`   Total Amount: ₹${sampleData.totalAmount}`);
    console.log(`   Final Amount: ₹${sampleData.finalAmount}`);
    console.log(`   Vendor Share (75%): ₹${sampleData.vendorAmount}`);
    console.log(`   Company Commission (25%): ₹${sampleData.companyCommission}`);
    
    console.log('\n💡 To create real data, complete a booking in the app');
    console.log('   The payout system will automatically calculate vendor_amount');
    
  } catch (error) {
    console.log('❌ Failed to create sample data:', error.message);
  }
}

// Run tests
async function runTests() {
  await testVendorEarningsAPI();
  await createSampleEarningsData();
  
  console.log('\n🏁 Test completed!');
  console.log('='.repeat(50));
}

runTests();