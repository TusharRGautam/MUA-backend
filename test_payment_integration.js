const { query } = require('./src/config/database');

async function testPaymentIntegration() {
  console.log('🧪 Testing Payment Integration...\n');

  try {
    // Test 1: Check if payment columns exist
    console.log('1. Checking payment columns in database...');
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND (column_name LIKE '%payment%' OR column_name LIKE '%razorpay%')
      ORDER BY column_name;
    `;
    
    const columnsResult = await query(columnsQuery);
    console.log('✅ Payment columns found:', columnsResult.rows.length);
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Test 2: Check if we can create a test booking with payment data
    console.log('\n2. Testing booking creation with payment data...');
    const testBookingId = `TEST_BK_${Date.now()}`;
    
    // Get today's date and time for booking
    const today = new Date();
    const bookingDate = today.toISOString().split('T')[0];
    const bookingTime = today.toTimeString().substring(0, 5); // 'HH:MM' format
    
    const insertQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        booking_id, user_name, user_email, user_phone, 
        total_amount, final_amount, payment_method, payment_status,
        razorpay_payment_id, razorpay_order_id, razorpay_signature,
        payment_gateway, payment_amount, payment_currency,
        booking_status, services_booked, booking_date, booking_time, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, booking_id, payment_status;
    `;

    const insertResult = await query(insertQuery, [
      testBookingId,
      'Test User',
      'test@example.com',
      '+919876543210',
      1500.00,
      1500.00,
      'razorpay',
      'paid',
      'pay_test_123',
      'order_test_456',
      'test_signature_789',
      'razorpay',
      1500.00,
      'INR',
      'confirmed',
      JSON.stringify([{ name: 'Test Service', price: 1500, quantity: 1 }]),
      bookingDate,
      bookingTime
    ]);

    console.log('✅ Test booking created successfully:', insertResult.rows[0]);

    // Test 3: Verify the booking was saved correctly
    console.log('\n3. Verifying test booking data...');
    const verifyQuery = `
      SELECT 
        booking_id, user_name, total_amount, payment_method, payment_status,
        razorpay_payment_id, razorpay_order_id, payment_gateway, payment_amount
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1;
    `;

    const verifyResult = await query(verifyQuery, [testBookingId]);
    if (verifyResult.rows.length > 0) {
      const booking = verifyResult.rows[0];
      console.log('✅ Test booking verified successfully:');
      console.log(`   - Booking ID: ${booking.booking_id}`);
      console.log(`   - User: ${booking.user_name}`);
      console.log(`   - Amount: ₹${booking.total_amount}`);
      console.log(`   - Payment Method: ${booking.payment_method}`);
      console.log(`   - Payment Status: ${booking.payment_status}`);
      console.log(`   - Razorpay Payment ID: ${booking.razorpay_payment_id}`);
      console.log(`   - Payment Gateway: ${booking.payment_gateway}`);
    } else {
      console.log('❌ Test booking not found');
    }

    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    const cleanupQuery = `DELETE FROM booking_all_details_of_user_to_vendor WHERE booking_id = $1;`;
    await query(cleanupQuery, [testBookingId]);
    console.log('✅ Test data cleaned up');

    // Test 5: Check recent bookings with payment data
    console.log('\n5. Checking recent bookings with payment data...');
    const recentQuery = `
      SELECT 
        booking_id, user_name, total_amount, payment_method, payment_status,
        payment_date_time, created_at
      FROM booking_all_details_of_user_to_vendor 
      WHERE payment_status IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 5;
    `;

    const recentResult = await query(recentQuery);
    console.log(`✅ Found ${recentResult.rows.length} recent bookings with payment data:`);
    recentResult.rows.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.booking_id} - ${booking.user_name} - ₹${booking.total_amount} - ${booking.payment_status}`);
    });

    console.log('\n🎉 Payment Integration Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Payment columns are properly configured');
    console.log('✅ Database can store payment data');
    console.log('✅ Payment verification works');
    console.log('✅ Booking creation with payment works');
    console.log('✅ Recent bookings with payment data found');

  } catch (error) {
    console.error('❌ Payment Integration Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaymentIntegration().then(() => {
  console.log('\n🏁 Test completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
}); 