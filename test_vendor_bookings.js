/**
 * Test script to verify vendor booking dashboard functionality
 * This script simulates the frontend request to check if all bookings are returned properly
 */

const fetch = require('node-fetch');

async function testVendorBookings() {
  try {
    console.log('🧪 Testing Vendor Booking Dashboard Fix...\n');
    
    // Test with a sample vendor ID
    const vendorId = '1'; // You can change this to your actual vendor ID
    const apiUrl = 'http://localhost:3000/api/vendor/bookings/' + vendorId + '?debug=true&limit=100';
    
    console.log(`📡 Testing API endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n📊 API Response Summary:');
    console.log(`✅ Success: ${data.success}`);
    console.log(`📈 Total bookings returned: ${data.bookings?.length || 0}`);
    console.log(`📊 Stats: ${JSON.stringify(data.stats, null, 2)}`);
    
    if (data.bookings && data.bookings.length > 0) {
      console.log('\n📋 First 5 bookings:');
      data.bookings.slice(0, 5).forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id} | Ref: ${booking.booking_reference} | Customer: ${booking.customer_name} | Status: ${booking.booking_status}`);
      });
      
      // Check for duplicate IDs
      const ids = data.bookings.map(b => b.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length !== uniqueIds.length) {
        console.log('\n❌ DUPLICATE IDs DETECTED:');
        console.log(`   Total bookings: ${ids.length}`);
        console.log(`   Unique IDs: ${uniqueIds.length}`);
        
        // Find duplicates
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.log(`   Duplicate IDs: ${[...new Set(duplicates)]}`);
      } else {
        console.log('\n✅ All booking IDs are unique');
      }
      
      // Check for valid data
      const invalidBookings = data.bookings.filter(b => !b.id || !b.customer_name);
      if (invalidBookings.length > 0) {
        console.log(`\n⚠️  Found ${invalidBookings.length} bookings with missing data`);
      } else {
        console.log('\n✅ All bookings have valid required data');
      }
      
    } else {
      console.log('\n⚠️  No bookings returned from API');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Make sure the backend server is running on port 3000');
  }
}

// Run the test
testVendorBookings(); 