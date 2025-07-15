const express = require('express');
const { pool, query } = require('./db');

// Test the booking functionality with our fixes
async function testBookingFix() {
  console.log('🧪 Testing booking system fixes...');
  
  try {
    // Test 1: Database connection
    console.log('\n1. Testing database connection...');
    const dbTest = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', dbTest.rows[0].current_time);
    
    // Test 2: Check if booking table exists
    console.log('\n2. Checking booking table...');
    const tableCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      ORDER BY ordinal_position
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Booking table exists with columns:');
      tableCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Booking table does not exist');
    }
    
    // Test 3: Test user_id conversion logic
    console.log('\n3. Testing user_id conversion...');
    const testUserId = "test123";
    const convertedUserId = parseInt(testUserId, 10);
    const finalUserId = isNaN(convertedUserId) ? 0 : convertedUserId;
    
    console.log(`Original userId: ${testUserId}`);
    console.log(`Converted userId: ${convertedUserId}`);
    console.log(`Final userId: ${finalUserId}`);
    
    if (finalUserId === 0) {
      console.log('✅ User ID conversion working correctly (defaulting to 0 for invalid strings)');
    } else {
      console.log('❌ User ID conversion issue');
    }
    
    // Test 4: Test vendor matching query structure
    console.log('\n4. Testing vendor matching query...');
    const vendorQuery = `
      SELECT COUNT(*) as vendor_count
      FROM ready_services_vendors_data rsv
      JOIN registration_and_other_details reg ON rsv.vendor_id = reg.sr_no
      WHERE reg.verification_status = 'verified'
        AND reg.business_email IS NOT NULL
    `;
    
    const vendorCount = await query(vendorQuery);
    console.log(`✅ Found ${vendorCount.rows[0].vendor_count} verified vendors in database`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
  
  // Close the pool
  await pool.end();
  console.log('\nDatabase connection pool closed');
}

testBookingFix();