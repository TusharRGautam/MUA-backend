const axios = require('axios');

// Test data with guest user (null userId)
const testBookingData = {
  bookingId: 'AUTOFIX_' + Date.now(),
  items: [
    {
      id: '33',
      name: 'Hair',
      price: 100,
      quantity: 1,
      duration: 30,
      image: 'stylist-background.jpg',
      artistId: '22',
      artistName: 'Kunal Gautam',
      serviceType: 'artist',
      category: 'Haircut',
      description: 'Hair',
      salonId: null,
      salonName: null
    }
  ],
  selectedDate: '2025-06-21',
  selectedTime: '09:30',
  paymentMethod: 'upi',
  totalAmount: 155,
  customerName: 'Guest User',
  customerEmail: '',
  customerPhone: '',
  address: '',
  userId: null  // This should work after auto-fix
};

async function testBookingWithAutoFix() {
  try {
    console.log('🧪 Testing booking endpoint with auto-fix...');
    console.log('📡 Sending request to: http://localhost:3000/api/bookings');
    console.log('📦 Test data:', JSON.stringify(testBookingData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/bookings', testBookingData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout to allow for migration
    });
    
    console.log('✅ SUCCESS! Booking created with auto-fix');
    console.log('📡 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Database structure automatically fixed and booking created!');
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('🔥 Error:', error.message);
    
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    } else if (error.request) {
      console.error('📡 No response received - is the server running?');
    } else {
      console.error('🔧 Error setting up request:', error.message);
    }
  }
}

// Test the endpoint with auto-fix
testBookingWithAutoFix(); 