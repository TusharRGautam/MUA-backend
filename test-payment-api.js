const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testPaymentAPI() {
  console.log('🧪 Testing Payment API Endpoints...\n');

  // Test 1: Test endpoint
  try {
    console.log('1️⃣ Testing /api/payments/test...');
    const testResponse = await fetch(`${API_BASE_URL}/api/payments/test`);
    const testData = await testResponse.json();
    console.log('✅ Test endpoint response:', testData);
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
  }

  // Test 2: Mock payment endpoint
  try {
    console.log('\n2️⃣ Testing /api/payments/mock-payment...');
    const mockPaymentResponse = await fetch(`${API_BASE_URL}/api/payments/mock-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: 'TEST_BK_123',
        amount: 1000
      }),
    });
    
    console.log('📡 Mock payment response status:', mockPaymentResponse.status);
    const mockPaymentData = await mockPaymentResponse.json();
    console.log('✅ Mock payment response:', mockPaymentData);
  } catch (error) {
    console.error('❌ Mock payment endpoint failed:', error.message);
  }

  // Test 3: Update booking payment endpoint
  try {
    console.log('\n3️⃣ Testing /api/payments/update-booking-payment...');
    const updateResponse = await fetch(`${API_BASE_URL}/api/payments/update-booking-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: 'TEST_BK_123',
        razorpayPaymentId: 'pay_test_123',
        razorpayOrderId: 'order_test_123',
        razorpaySignature: 'test_signature',
        amount: 1000,
        paymentMethod: 'razorpay'
      }),
    });
    
    console.log('📡 Update payment response status:', updateResponse.status);
    const updateData = await updateResponse.json();
    console.log('✅ Update payment response:', updateData);
  } catch (error) {
    console.error('❌ Update payment endpoint failed:', error.message);
  }

  console.log('\n🏁 Payment API testing completed!');
}

// Run the test
testPaymentAPI().catch(console.error); 