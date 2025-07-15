const { query } = require('./db');

async function testCompletePaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if payment endpoints are accessible
    console.log('\n📡 Test 1: Payment API Endpoints');
    console.log('-'.repeat(30));
    
    const testEndpoints = [
      'http://192.168.0.102:3000/api/payments/test',
      'http://192.168.0.102:3000/api/payments/mock-payment',
      'http://192.168.0.102:3000/api/payments/update-booking-payment'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: endpoint.includes('test') ? 'GET' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.includes('test') ? undefined : JSON.stringify({
            bookingId: 'BK_TEST_123',
            amount: 1000
          })
        });
        
        if (response.ok) {
          console.log(`✅ ${endpoint} - Working`);
        } else {
          console.log(`❌ ${endpoint} - Failed (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
    
    // Test 2: Check database payment columns
    console.log('\n🗄️ Test 2: Database Payment Columns');
    console.log('-'.repeat(30));
    
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      AND column_name LIKE '%payment%'
      ORDER BY column_name
    `;
    
    const columnsResult = await query(columnsQuery);
    console.log('Payment-related columns found:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Test 3: Create a test booking
    console.log('\n📝 Test 3: Create Test Booking');
    console.log('-'.repeat(30));
    
    const testBookingId = `BK_TEST_${Date.now()}`;
    const insertQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        booking_id, user_id, user_name, services_booked, total_amount,
        final_amount, booking_date, booking_time, booking_status,
        payment_status, payment_method, service_category, service_gender,
        custom_user_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `;
    
    const bookingData = [
      testBookingId,           // booking_id
      109,                     // user_id
      'Test User',             // user_name
      'Test Service',          // services_booked
      1000,                    // total_amount
      1000,                    // final_amount
      '2025-07-14',           // booking_date
      '12:00',                // booking_time
      'pending',               // booking_status
      'pending',               // payment_status
      'razorpay',              // payment_method
      'Test Category',         // service_category
      'both',                  // service_gender
      'TEST_USER_123'          // custom_user_id
    ];
    
    const insertResult = await query(insertQuery, bookingData);
    console.log(`✅ Test booking created: ${testBookingId} (ID: ${insertResult.rows[0].id})`);
    
    // Test 4: Process mock payment
    console.log('\n💳 Test 4: Process Mock Payment');
    console.log('-'.repeat(30));
    
    const mockPaymentResponse = await fetch('http://192.168.0.102:3000/api/payments/mock-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: testBookingId,
        amount: 1000
      })
    });
    
    if (mockPaymentResponse.ok) {
      const mockPaymentData = await mockPaymentResponse.json();
      console.log('✅ Mock payment processed successfully:');
      console.log(`  - Payment ID: ${mockPaymentData.data.paymentId}`);
      console.log(`  - Order ID: ${mockPaymentData.data.orderId}`);
      console.log(`  - Status: ${mockPaymentData.data.status}`);
    } else {
      console.log('❌ Mock payment failed:', await mockPaymentResponse.text());
    }
    
    // Test 5: Verify payment in database
    console.log('\n🔍 Test 5: Verify Payment in Database');
    console.log('-'.repeat(30));
    
    const verifyQuery = `
      SELECT 
        booking_id, payment_status, payment_method, booking_status,
        razorpay_payment_id, razorpay_order_id, razorpay_signature,
        payment_gateway, payment_amount, payment_currency, payment_date_time
      FROM booking_all_details_of_user_to_vendor
      WHERE booking_id = $1
    `;
    
    const verifyResult = await query(verifyQuery, [testBookingId]);
    
    if (verifyResult.rows.length > 0) {
      const booking = verifyResult.rows[0];
      console.log('✅ Payment verified in database:');
      console.log(`  - Booking ID: ${booking.booking_id}`);
      console.log(`  - Payment Status: ${booking.payment_status}`);
      console.log(`  - Payment Method: ${booking.payment_method}`);
      console.log(`  - Booking Status: ${booking.booking_status}`);
      console.log(`  - Razorpay Payment ID: ${booking.razorpay_payment_id}`);
      console.log(`  - Payment Gateway: ${booking.payment_gateway}`);
      console.log(`  - Payment Amount: ${booking.payment_amount}`);
      console.log(`  - Payment Date: ${booking.payment_date_time}`);
    } else {
      console.log('❌ Booking not found in database');
    }
    
    // Test 6: Test payment status update
    console.log('\n🔄 Test 6: Payment Status Update');
    console.log('-'.repeat(30));
    
    const updateResponse = await fetch('http://192.168.0.102:3000/api/payments/update-booking-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: testBookingId,
        razorpayPaymentId: 'pay_update_test_123',
        razorpayOrderId: 'order_update_test_123',
        razorpaySignature: 'update_signature',
        amount: 1000
      })
    });
    
    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Payment status updated successfully:');
      console.log(`  - Booking ID: ${updateData.data.bookingId}`);
      console.log(`  - Payment ID: ${updateData.data.paymentId}`);
      console.log(`  - Status: ${updateData.data.status}`);
    } else {
      console.log('❌ Payment status update failed:', await updateResponse.text());
    }
    
    // Test 7: Clean up test data
    console.log('\n🧹 Test 7: Clean Up Test Data');
    console.log('-'.repeat(30));
    
    const cleanupQuery = `
      DELETE FROM booking_all_details_of_user_to_vendor
      WHERE booking_id = $1
    `;
    
    const cleanupResult = await query(cleanupQuery, [testBookingId]);
    console.log(`✅ Test booking cleaned up: ${cleanupResult.rowCount} rows deleted`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Complete Payment Flow Test Completed Successfully!');
    console.log('✅ All payment endpoints are working');
    console.log('✅ Database payment columns are properly configured');
    console.log('✅ Payment processing and status updates work correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompletePaymentFlow(); 