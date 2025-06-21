const http = require('http');

// Test data for booking
const testBookingData = {
  bookingId: 'BK' + Date.now(),
  items: [
    {
      id: 'test-service-1',
      name: 'Test Hair Service',
      price: 100,
      quantity: 1,
      artistId: 'test-artist-1',
      artistName: 'Test Artist',
      category: 'hair',
      serviceType: 'hair'
    }
  ],
  selectedDate: '2024-01-15',
  selectedTime: '10:00',
  paymentMethod: 'UPI',
  totalAmount: 100,
  customerName: 'Test Customer',
  customerPhone: '1234567890',
  customUserId: 'CU123456'
};

// Function to test the booking endpoint
function testBookingEndpoint() {
  const postData = JSON.stringify(testBookingData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing booking endpoint...');
  console.log('📤 Sending request to:', `http://localhost:3001/api/bookings`);
  console.log('📋 Test data:', JSON.stringify(testBookingData, null, 2));

  const req = http.request(options, (res) => {
    console.log(`📡 Response status: ${res.statusCode}`);
    console.log(`📋 Response headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response body:', data);
      
      try {
        const jsonResponse = JSON.parse(data);
        console.log('✅ JSON Response:', JSON.stringify(jsonResponse, null, 2));
        
        if (res.statusCode === 201) {
          console.log('🎉 SUCCESS: Booking endpoint is working!');
        } else {
          console.log('⚠️ WARNING: Unexpected status code');
        }
      } catch (e) {
        console.log('⚠️ Response is not valid JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error testing booking endpoint:', e.message);
    if (e.code === 'ECONNREFUSED') {
      console.log('💡 Hint: Make sure the server is running on port 3001');
    }
  });

  req.write(postData);
  req.end();
}

// Test server connectivity first
function testServerConnectivity() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  console.log('🔌 Testing server connectivity...');
  
  const req = http.request(options, (res) => {
    console.log(`✅ Server is running on port 3001 (status: ${res.statusCode})`);
    
    // Wait a moment then test the booking endpoint
    setTimeout(testBookingEndpoint, 1000);
  });

  req.on('error', (e) => {
    console.error('❌ Server connectivity test failed:', e.message);
    if (e.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running on port 3001');
      console.log('💡 Try running: PORT=3001 npm run dev');
    }
  });

  req.end();
}

// Run the test
console.log('🚀 Starting booking endpoint test...');
testServerConnectivity(); 