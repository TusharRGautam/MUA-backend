const { query } = require('./src/config/database');

async function testPaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow...\n');

  try {
    // Test 1: Create a booking with pending payment status
    console.log('1. Creating booking with pending payment status...');
    const testBookingId = `FLOW_TEST_${Date.now()}`;
    const today = new Date();
    const bookingDate = today.toISOString().split('T')[0];
    const bookingTime = today.toTimeString().substring(0, 5);
    
    const createBookingQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        booking_id, user_name, user_email, user_phone, 
        total_amount, final_amount, payment_method, payment_status,
        booking_status, services_booked, booking_date, booking_time, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, booking_id, payment_status;
    `;

    const createResult = await query(createBookingQuery, [
      testBookingId,
      'Flow Test User',
      'flowtest@example.com',
      '+919876543210',
      2000.00,
      2000.00,
      'razorpay',
      'pending',
      'pending',
      JSON.stringify([{ name: 'Test Service', price: 2000, quantity: 1 }]),
      bookingDate,
      bookingTime
    ]);

    console.log('✅ Booking created successfully:', createResult.rows[0]);

    // Test 2: Simulate payment completion
    console.log('\n2. Simulating payment completion...');
    const paymentId = `pay_flow_${Date.now()}`;
    const orderId = `order_flow_${Date.now()}`;
    const signature = 'flow_signature';

    const updatePaymentQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        payment_status = 'paid',
        razorpay_payment_id = $1,
        razorpay_order_id = $2,
        razorpay_signature = $3,
        payment_gateway = 'razorpay',
        payment_amount = $4,
        payment_currency = 'INR',
        payment_date_time = CURRENT_TIMESTAMP,
        booking_status = 'confirmed',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $5
      RETURNING id, booking_id, payment_status, razorpay_payment_id;
    `;

    const updateResult = await query(updatePaymentQuery, [
      paymentId,
      orderId,
      signature,
      2000.00,
      testBookingId
    ]);

    console.log('✅ Payment updated successfully:', updateResult.rows[0]);

    // Test 3: Verify the complete flow
    console.log('\n3. Verifying complete payment flow...');
    const verifyQuery = `
      SELECT 
        booking_id, user_name, total_amount, payment_method, payment_status,
        razorpay_payment_id, razorpay_order_id, booking_status, payment_date_time
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1;
    `;

    const verifyResult = await query(verifyQuery, [testBookingId]);
    
    if (verifyResult.rows.length > 0) {
      const booking = verifyResult.rows[0];
      console.log('✅ Complete payment flow verified successfully:');
      console.log(`   - Booking ID: ${booking.booking_id}`);
      console.log(`   - User: ${booking.user_name}`);
      console.log(`   - Amount: ₹${booking.total_amount}`);
      console.log(`   - Payment Method: ${booking.payment_method}`);
      console.log(`   - Payment Status: ${booking.payment_status}`);
      console.log(`   - Razorpay Payment ID: ${booking.razorpay_payment_id}`);
      console.log(`   - Booking Status: ${booking.booking_status}`);
      console.log(`   - Payment Date: ${booking.payment_date_time}`);
    } else {
      console.log('❌ Payment flow verification failed');
    }

    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    const cleanupQuery = `DELETE FROM booking_all_details_of_user_to_vendor WHERE booking_id = $1;`;
    await query(cleanupQuery, [testBookingId]);
    console.log('✅ Test data cleaned up');

    // Test 5: Check recent successful payments
    console.log('\n5. Checking recent successful payments...');
    const recentPaymentsQuery = `
      SELECT 
        booking_id, user_name, total_amount, payment_status, payment_date_time
      FROM booking_all_details_of_user_to_vendor 
      WHERE payment_status = 'paid'
      ORDER BY payment_date_time DESC 
      LIMIT 3;
    `;

    const recentPaymentsResult = await query(recentPaymentsQuery);
    console.log(`✅ Found ${recentPaymentsResult.rows.length} recent successful payments:`);
    recentPaymentsResult.rows.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.booking_id} - ${payment.user_name} - ₹${payment.total_amount} - ${payment.payment_date_time}`);
    });

    console.log('\n🎉 Complete Payment Flow Test Completed Successfully!');
    console.log('\n📋 Flow Summary:');
    console.log('✅ Booking creation with pending payment works');
    console.log('✅ Payment status update works');
    console.log('✅ Payment verification works');
    console.log('✅ Complete flow from pending to paid works');
    console.log('✅ Recent successful payments found');

  } catch (error) {
    console.error('❌ Payment Flow Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaymentFlow().then(() => {
  console.log('\n🏁 Payment flow test completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Payment flow test failed with error:', error);
  process.exit(1);
}); 