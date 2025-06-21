const axios = require('axios');

// Test data
const testBookingData = {
  bookingId: 'TEST_' + Date.now(),
  items: [
    {
      id: 'service_1',
      name: 'Bridal Makeup',
      price: 5000,
      quantity: 1,
      artistName: 'Test Artist',
      artistId: 'artist_1',
      category: 'bridal',
      type: 'service'
    }
  ],
  selectedDate: '2024-01-25',
  selectedTime: '10:00',
  paymentMethod: 'card',
  totalAmount: 5000,
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '9876543210',
  address: 'Test Address, Test City',
  userId: 'test_user_123'
};

async function testBookingEndpoint() {
  try {
    console.log('🧪 Testing booking endpoint...');
    console.log('📡 Sending request to: http://localhost:3000/api/bookings');
    console.log('📦 Test data:', JSON.stringify(testBookingData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/bookings', testBookingData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Success! Status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('🔥 Error:', error.message);
    
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    } else if (error.request) {
      console.error('📡 No response received');
      console.error('🌐 Request details:', error.request);
    } else {
      console.error('🔧 Error setting up request:', error.message);
    }
  }
}

// Test the endpoint
testBookingEndpoint(); 