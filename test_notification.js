const http = require('http');

// Test push token registration and notification
async function testNotificationFlow() {
  console.log('🧪 Testing Complete Notification Flow for Vendor 35...\n');

  // Step 1: Register push token
  console.log('1. Registering push token for vendor 35...');
  
  const registerData = JSON.stringify({
    vendorId: '35',
    pushToken: 'ExponentPushToken[TEST_TOKEN_FOR_VENDOR_35]',
    deviceInfo: {
      platform: 'android',
      deviceName: 'Test Android Device',
      appVersion: '1.0.0'
    }
  });

  const registerOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/vendor/push-token/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(registerData)
    }
  };

  const registerRequest = http.request(registerOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Registration Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        if (result.success) {
          console.log('✅ Push token registered successfully!');
          
          // Step 2: Test notification
          setTimeout(() => testNotification(), 1000);
        } else {
          console.log('❌ Registration failed:', result.error);
        }
      } catch (e) {
        console.log('❌ Registration response:', data);
      }
    });
  });

  registerRequest.on('error', (error) => {
    console.error('❌ Registration request failed:', error.message);
  });

  registerRequest.write(registerData);
  registerRequest.end();
}

function testNotification() {
  console.log('\n2. Sending test notification...');
  
  const testData = JSON.stringify({
    vendorId: '35',
    message: '🔔 Test notification! You have a new booking from the API test.'
  });

  const testOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/vendor/push-token/test',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  const testRequest = http.request(testOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Test Notification Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        if (result.success) {
          console.log('✅ Test notification sent successfully!');
          
          // Step 3: Check vendor bookings
          setTimeout(() => checkBookings(), 1000);
        } else {
          console.log('❌ Test notification failed:', result.error);
        }
      } catch (e) {
        console.log('❌ Test notification response:', data);
      }
    });
  });

  testRequest.on('error', (error) => {
    console.error('❌ Test notification request failed:', error.message);
  });

  testRequest.write(testData);
  testRequest.end();
}

function checkBookings() {
  console.log('\n3. Checking vendor bookings...');
  
  const bookingOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/vendor/bookings/35',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const bookingRequest = http.request(bookingOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Bookings API Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        if (result.success) {
          console.log('✅ Bookings API working!');
          console.log(`📋 Found ${result.bookings?.length || 0} bookings`);
          console.log('📊 Stats:', result.stats);
          
          if (result.bookings && result.bookings.length > 0) {
            console.log('\n📝 Latest booking:');
            const latest = result.bookings[0];
            console.log(`  - ID: ${latest.id}`);
            console.log(`  - Customer: ${latest.customer_name}`);
            console.log(`  - Service: ${latest.service_name}`);
            console.log(`  - Status: ${latest.booking_status}`);
            console.log(`  - Amount: ${latest.total_amount}`);
          }
        } else {
          console.log('❌ Bookings API failed:', result.error);
        }
      } catch (e) {
        console.log('❌ Bookings API response:', data);
      }
      
      console.log('\n🏁 Test completed!');
    });
  });

  bookingRequest.on('error', (error) => {
    console.error('❌ Bookings request failed:', error.message);
  });

  bookingRequest.end();
}

// Start the test
testNotificationFlow(); 