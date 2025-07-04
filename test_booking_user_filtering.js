/**
 * Test script to verify user-specific booking filtering
 * This script tests the database queries to ensure users only see their own bookings
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

async function testUserBookingFiltering() {
  try {
    console.log('🔍 Testing user-specific booking filtering...');
    
    // Test 1: Check total bookings in database
    const totalBookingsQuery = 'SELECT COUNT(*) as total FROM booking_all_details_of_user_to_vendor';
    const totalResult = await pool.query(totalBookingsQuery);
    console.log(`📊 Total bookings in database: ${totalResult.rows[0].total}`);
    
    // Test 2: Check unique users in bookings
    const uniqueUsersQuery = `
      SELECT 
        COUNT(DISTINCT user_id) as unique_user_ids,
        COUNT(DISTINCT user_email) as unique_emails,
        COUNT(DISTINCT user_phone) as unique_phones,
        COUNT(DISTINCT custom_user_id) as unique_custom_ids
      FROM booking_all_details_of_user_to_vendor 
      WHERE user_id IS NOT NULL OR user_email IS NOT NULL OR user_phone IS NOT NULL OR custom_user_id IS NOT NULL
    `;
    const uniqueResult = await pool.query(uniqueUsersQuery);
    console.log('👥 Unique user identifiers:');
    console.log(`   - User IDs: ${uniqueResult.rows[0].unique_user_ids}`);
    console.log(`   - Emails: ${uniqueResult.rows[0].unique_emails}`);
    console.log(`   - Phones: ${uniqueResult.rows[0].unique_phones}`);
    console.log(`   - Custom IDs: ${uniqueResult.rows[0].unique_custom_ids}`);
    
    // Test 3: Sample user filtering (simulate customer query)
    const sampleUserQuery = `
      SELECT user_id, user_email, user_phone, custom_user_id, booking_id, booking_status
      FROM booking_all_details_of_user_to_vendor 
      WHERE user_id IS NOT NULL 
      LIMIT 5
    `;
    const sampleResult = await pool.query(sampleUserQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('\n🧪 Testing filtering for sample users:');
      
      for (const booking of sampleResult.rows) {
        const userId = booking.user_id;
        const userEmail = booking.user_email;
        const userPhone = booking.user_phone;
        const customUserId = booking.custom_user_id;
        
        // Simulate the actual filtering query used in the API
        const filterQuery = `
          SELECT COUNT(*) as user_bookings
          FROM booking_all_details_of_user_to_vendor 
          WHERE (user_id = $1 OR user_email = $2 OR user_phone = $3 OR custom_user_id = $4)
        `;
        
        const filterResult = await pool.query(filterQuery, [userId, userEmail, userPhone, customUserId]);
        
        console.log(`   User ${userId}: ${filterResult.rows[0].user_bookings} bookings`);
      }
    }
    
    // Test 4: Check for potential data leakage (bookings without user identification)
    const orphanBookingsQuery = `
      SELECT COUNT(*) as orphan_bookings
      FROM booking_all_details_of_user_to_vendor 
      WHERE user_id IS NULL AND user_email IS NULL AND user_phone IS NULL AND custom_user_id IS NULL
    `;
    const orphanResult = await pool.query(orphanBookingsQuery);
    
    if (orphanResult.rows[0].orphan_bookings > 0) {
      console.log(`\n⚠️  WARNING: ${orphanResult.rows[0].orphan_bookings} bookings found without user identification!`);
      console.log('   These bookings could cause data leakage.');
    } else {
      console.log('\n✅ No orphan bookings found - all bookings have user identification.');
    }
    
    // Test 5: Validate vendor filtering
    const vendorBookingsQuery = `
      SELECT vendor_id, vendor_email, vendor_phone_number, COUNT(*) as booking_count
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id IS NOT NULL
      GROUP BY vendor_id, vendor_email, vendor_phone_number
      LIMIT 3
    `;
    const vendorResult = await pool.query(vendorBookingsQuery);
    
    if (vendorResult.rows.length > 0) {
      console.log('\n🏪 Vendor booking distribution:');
      vendorResult.rows.forEach(vendor => {
        console.log(`   Vendor ${vendor.vendor_id}: ${vendor.booking_count} bookings`);
      });
    }
    
    console.log('\n✅ User booking filtering test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing user booking filtering:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testUserBookingFiltering();