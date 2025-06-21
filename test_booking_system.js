const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testBookingSystem() {
  console.log('🧪 Testing Booking System...');
  console.log('='.repeat(50));

  // Test data matching the structure from the logs
  const testBookingData = {
    items: [
      {
        artistId: "service-provider",
        artistName: "Service Provider",
        category: "Haircut",
        description: "Professional classic bob cut service with expert styling and finishing touches.",
        duration: 35,
        id: "1",
        image: "https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC",
        name: "Classic Bob Cut",
        price: 703,
        quantity: 1,
        salonId: null,
        salonName: null,
        serviceType: "service"
      },
      {
        artistId: "service-provider",
        artistName: "Service Provider",
        category: "Haircut",
        description: "Professional layered haircut service with expert styling and finishing touches.",
        duration: 146,
        id: "2",
        image: "https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC",
        name: "Layered Haircut",
        price: 1573,
        quantity: 1,
        salonId: null,
        salonName: null,
        serviceType: "service"
      },
      {
        artistId: "service-provider",
        artistName: "Service Provider",
        category: "Haircut",
        description: "Professional pixie cut service with expert styling and finishing touches.",
        duration: 171,
        id: "3",
        image: "https://drive.usercontent.google.com/download?id=1zf1Qlt7UAnq3xubeTQKPg9WDHrhRsSdC",
        name: "Pixie Cut",
        price: 900,
        quantity: 1,
        salonId: null,
        salonName: null,
        serviceType: "service"
      }
    ],
    selectedDate: "2025-06-21",
    selectedTime: "09:30",
    paymentMethod: "upi",
    totalAmount: 3384.8,
    customerName: "Test User",
    customerEmail: "test@gmail.com",
    customerPhone: "8169151456",
    userId: 1,
    customUserId: "CLUB0101",
    address: "Test Address"
  };

  try {
    console.log('📤 Creating test booking...');
    
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBookingData),
    });

    console.log('📡 Response status:', response.status);

    const result = await response.json();
    console.log('📋 Response data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Booking creation successful!');
      console.log(`📝 Booking ID: ${result.bookingId}`);
      console.log(`💾 Storage method: ${result.storageMethod || result.data?.storageMethod || 'unknown'}`);
      
      // Test fetching the booking
      if (result.bookingId) {
        console.log('\n🔍 Testing booking retrieval...');
        
        const fetchResponse = await fetch(`${API_BASE_URL}/bookings/${result.bookingId}`);
        const fetchResult = await fetchResponse.json();
        
        console.log('📋 Fetch response:', JSON.stringify(fetchResult, null, 2));
        
        if (fetchResponse.ok) {
          console.log('✅ Booking retrieval successful!');
        } else {
          console.log('❌ Booking retrieval failed');
        }
      }
      
    } else {
      console.log('❌ Booking creation failed');
    }

  } catch (error) {
    console.error('🔥 Test error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧪 Test completed');
}

// Run the test
if (require.main === module) {
  testBookingSystem();
}

module.exports = { testBookingSystem }; 