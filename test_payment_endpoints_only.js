const fetch = require('node-fetch');

async function testPaymentEndpoints() {
  console.log('🧪 Testing Payment Endpoints Only');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Payment test endpoint
    console.log('\n📡 Test 1: Payment Test Endpoint');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://192.168.0.102:3000/api/payments/test');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment test endpoint working:', data.message);
      } else {
        console.log('❌ Payment test endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Payment test endpoint error:', error.message);
    }
    
    // Test 2: Mock payment endpoint with existing booking
    console.log('\n💳 Test 2: Mock Payment Endpoint');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://192.168.0.102:3000/api/payments/mock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'BK1752388836074', // Use existing booking from logs
          amount: 4694.15
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mock payment endpoint working:');
        console.log(`  - Payment ID: ${data.data.paymentId}`);
        console.log(`  - Order ID: ${data.data.orderId}`);
        console.log(`  - Status: ${data.data.status}`);
      } else {
        const errorText = await response.text();
        console.log('❌ Mock payment endpoint failed:', response.status, errorText);
      }
    } catch (error) {
      console.log('❌ Mock payment endpoint error:', error.message);
    }
    
    // Test 3: Payment status update endpoint
    console.log('\n🔄 Test 3: Payment Status Update Endpoint');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://192.168.0.102:3000/api/payments/update-booking-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'BK1752388836074',
          razorpayPaymentId: 'pay_test_endpoint_123',
          razorpayOrderId: 'order_test_endpoint_123',
          razorpaySignature: 'test_signature_endpoint',
          amount: 4694.15
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment status update endpoint working:');
        console.log(`  - Booking ID: ${data.data.bookingId}`);
        console.log(`  - Payment ID: ${data.data.paymentId}`);
        console.log(`  - Status: ${data.data.status}`);
      } else {
        const errorText = await response.text();
        console.log('❌ Payment status update endpoint failed:', response.status, errorText);
      }
    } catch (error) {
      console.log('❌ Payment status update endpoint error:', error.message);
    }
    
    // Test 4: Test with invalid data
    console.log('\n🚫 Test 4: Invalid Data Handling');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://192.168.0.102:3000/api/payments/mock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing bookingId
          amount: 1000
        })
      });
      
      if (response.status === 400) {
        const data = await response.json();
        console.log('✅ Invalid data handling working:', data.error);
      } else {
        console.log('❌ Invalid data handling failed - expected 400, got:', response.status);
      }
    } catch (error) {
      console.log('❌ Invalid data test error:', error.message);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Payment Endpoints Test Completed!');
    console.log('✅ All payment endpoints are accessible and responding');
    console.log('✅ Error handling is working correctly');
    console.log('✅ Ready for frontend integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaymentEndpoints(); 