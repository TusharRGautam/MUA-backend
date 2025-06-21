const http = require('http');

const testBookingAPI = () => {
  const bookingData = JSON.stringify({
    items: [
      {
        id: "test-service",
        name: "Test Service",
        price: 100,
        quantity: 1,
        artistId: "artist-1",
        artistName: "Test Artist",
        category: "Test Category"
      }
    ],
    selectedDate: "2025-06-21",
    selectedTime: "10:00",
    paymentMethod: "cash",
    totalAmount: 100,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    userId: 1,
    customUserId: "TEST123"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bookingData)
    }
  };

  console.log('🧪 Testing live booking API...');
  
  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        console.log('✅ API Response:', JSON.stringify(response, null, 2));
        console.log(`💾 Storage Method: ${response.storageMethod}`);
        console.log(`🎯 Booking ID: ${response.bookingId}`);
        
        if (response.storageMethod === 'fallback') {
          console.log('📱 System is working correctly with fallback storage!');
        } else if (response.storageMethod === 'database') {
          console.log('🗄️ System is working correctly with database storage!');
        }
      } catch (error) {
        console.log('📋 Raw Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('💡 Make sure the server is running with: npm start');
  });

  req.write(bookingData);
  req.end();
};

testBookingAPI(); 