const axios = require('axios');

// Test data for offline booking
const testBookingData = {
  items: [
    {
      id: "1",
      name: "Classic Bob Cut",
      price: 703,
      quantity: 1,
      duration: 35,
      category: "Haircut",
      description: "Professional classic bob cut service",
      artistId: "service-provider",
      artistName: "Service Provider",
      serviceType: "service"
    },
    {
      id: "2", 
      name: "Layered Haircut",
      price: 1573,
      quantity: 1,
      duration: 146,
      category: "Haircut",
      description: "Professional layered haircut service",
      artistId: "service-provider",
      artistName: "Service Provider",
      serviceType: "service"
    }
  ],
  selectedDate: "2025-06-21",
  selectedTime: "09:30",
  paymentMethod: "upi",
  totalAmount: 2276,
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  customerPhone: "1234567890",
  userId: 1,
  customUserId: "TEST123"
};

async function testOfflineBooking() {
  try {
    console.log('🧪 Testing offline booking system...');
    console.log('📤 Sending booking data to /api/bookings');
    
    const response = await axios.post('http://localhost:3000/api/bookings', testBookingData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Booking created successfully!');
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
    // Test getting the booking back
    if (response.data.bookingId) {
      console.log('\n🔍 Testing booking retrieval...');
      const getResponse = await axios.get(`http://localhost:3000/api/bookings/${response.data.bookingId}`);
      console.log('✅ Booking retrieved successfully!');
      console.log('📄 Retrieved booking data:', JSON.stringify(getResponse.data, null, 2));
    }
    
    // Test getting all bookings
    console.log('\n📋 Testing all bookings retrieval...');
    const allResponse = await axios.get('http://localhost:3000/api/bookings');
    console.log('✅ All bookings retrieved successfully!');
    console.log('📄 Total bookings:', allResponse.data.total);
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testOfflineBooking(); 