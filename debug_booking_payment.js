const { query } = require('./db');

/**
 * Debug script to check booking and payment issues
 */
async function debugBookingPayment() {
  try {
    console.log('🔍 Debugging booking and payment issues...');
    console.log('=' .repeat(60));
    
    // Check recent bookings
    console.log('\n📋 Recent bookings in database:');
    const recentBookings = await query(`
      SELECT 
        id,
        booking_id,
        user_name,
        vendor_name,
        total_amount,
        booking_status,
        payment_status,
        created_at
      FROM booking_all_details_of_user_to_vendor 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.table(recentBookings.rows);
    
    // Check for any bookings with payment issues
    console.log('\n💳 Bookings with payment status pending:');
    const pendingPayments = await query(`
      SELECT 
        id,
        booking_id,
        user_name,
        total_amount,
        booking_status,
        payment_status,
        payment_method,
        razorpay_payment_id
      FROM booking_all_details_of_user_to_vendor 
      WHERE payment_status = 'pending' OR payment_status IS NULL
      ORDER BY created_at DESC
    `);
    
    console.table(pendingPayments.rows);
    
    // Check booking ID formats
    console.log('\n🔢 Booking ID formats analysis:');
    const bookingIdFormats = await query(`
      SELECT 
        booking_id,
        LENGTH(booking_id) as id_length,
        CASE 
          WHEN booking_id ~ '^[0-9]+$' THEN 'numeric'
          WHEN booking_id ~ '^[A-Za-z0-9_-]+$' THEN 'alphanumeric'
          ELSE 'other'
        END as id_type
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.table(bookingIdFormats.rows);
    
    // Test a specific booking ID update
    if (recentBookings.rows.length > 0) {
      const testBookingId = recentBookings.rows[0].booking_id;
      console.log(`\n🧪 Testing payment update for booking ID: ${testBookingId}`);
      
      const testUpdate = await query(`
        UPDATE booking_all_details_of_user_to_vendor 
        SET 
          payment_status = 'test_update',
          updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $1
        RETURNING id, booking_id
      `, [testBookingId]);
      
      if (testUpdate.rows.length > 0) {
        console.log('✅ Test update successful:', testUpdate.rows[0]);
        
        // Revert the test update
        await query(`
          UPDATE booking_all_details_of_user_to_vendor 
          SET 
            payment_status = 'pending',
            updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = $1
        `, [testBookingId]);
        
        console.log('🔄 Reverted test update');
      } else {
        console.log('❌ Test update failed - booking not found');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Booking payment debug completed');
    
  } catch (error) {
    console.error('❌ Error in booking payment debug:', error.message);
    console.error('Full error:', error);
  }
}

// Run the debug function
debugBookingPayment().then(() => {
  console.log('\n🏁 Debug script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});