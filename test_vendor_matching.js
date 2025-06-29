const http = require('http');

// Test booking data with service categories
const testBookingData = {
  bookingId: 'VM_TEST_' + Date.now(),
  items: [
    {
      id: 'test-service-1',
      name: 'Bridal Makeup',
      price: 5000,
      quantity: 1,
      category: 'bridal', // This should match vendors with 'bridal' category
      serviceType: 'beauty'
    },
    {
      id: 'test-service-2', 
      name: 'Hair Styling',
      price: 2000,
      quantity: 1,
      category: 'haircare', // This should match vendors with 'haircare' category
      serviceType: 'beauty'
    }
  ],
  selectedDate: '2024-01-25',
  selectedTime: '14:00',
  paymentMethod: 'UPI',
  totalAmount: 7000,
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '9876543210',
  address: 'Test Address, Test City',
  customUserId: 'VM_TEST_USER'
};

// Function to test the vendor matching booking endpoint
function testVendorMatchingBooking() {
  const postData = JSON.stringify(testBookingData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🎯 Testing Vendor Matching Booking System...');
  console.log('📤 Sending request to:', `http://localhost:3000/api/bookings`);
  console.log('📋 Test booking data:');
  console.log('   - Services: bridal (₹5000), haircare (₹2000)');
  console.log('   - Total: ₹7000');
  console.log('   - Expected: Should find vendors with bridal/haircare categories');
  console.log('');

  const req = http.request(options, (res) => {
    console.log(`📡 Response Status: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Raw Response:', data);
      console.log('');
      
      try {
        const jsonResponse = JSON.parse(data);
        console.log('✅ Parsed JSON Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));
        
        if (res.statusCode === 201 && jsonResponse.success) {
          console.log('');
          console.log('🎉 SUCCESS: Vendor Matching Booking System is working!');
          
          if (jsonResponse.data && jsonResponse.data.vendorMatchingResult) {
            const vmResult = jsonResponse.data.vendorMatchingResult;
            console.log('📊 Vendor Matching Results:');
            console.log(`   - Success: ${vmResult.success}`);
            console.log(`   - Vendors Notified: ${vmResult.vendorsNotified}`);
            
            if (vmResult.selectedVendor) {
              console.log(`   - Selected Vendor: ${vmResult.selectedVendor.name} (ID: ${vmResult.selectedVendor.id})`);
              console.log(`   - Vendor Email: ${vmResult.selectedVendor.email}`);
              console.log(`   - Vendor Phone: ${vmResult.selectedVendor.phone}`);
            }
            
            console.log('');
            console.log('🔔 Expected Notification Flow:');
            console.log('   1. Vendor should receive push notification');
            console.log('   2. Booking status: pending_vendor_acceptance');
            console.log('   3. Vendor can accept/reject via dashboard');
          }
        } else {
          console.log('⚠️ WARNING: Unexpected response or failure');
          if (jsonResponse.error) {
            console.log('❌ Error:', jsonResponse.error);
          }
        }
      } catch (e) {
        console.log('⚠️ Response is not valid JSON:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure backend server is running on port 3000');
    console.log('   2. Check database connection');
    console.log('   3. Verify ready_services_vendors_data table has test data');
  });

  req.write(postData);
  req.end();
}

// Function to test vendor response endpoint
function testVendorResponse(bookingId, vendorId) {
  const responseData = JSON.stringify({
    vendorId: vendorId,
    action: 'accept',
    vendorNotes: 'Test acceptance from vendor matching test'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/bookings/${bookingId}/vendor-response`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(responseData)
    }
  };

  console.log('');
  console.log('🎯 Testing Vendor Response System...');
  console.log('📤 Sending vendor acceptance for booking:', bookingId);

  const req = http.request(options, (res) => {
    console.log(`📡 Vendor Response Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonResponse = JSON.parse(data);
        console.log('✅ Vendor Response Result:');
        console.log(JSON.stringify(jsonResponse, null, 2));
        
        if (jsonResponse.success) {
          console.log('🎉 SUCCESS: Vendor response system working!');
        }
      } catch (e) {
        console.log('⚠️ Vendor response not valid JSON:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Vendor response request failed:', err.message);
  });

  req.write(responseData);
  req.end();
}

// Run the test
console.log('🚀 Starting Vendor Matching System Test...');
console.log('=====================================');
testVendorMatchingBooking();

// Optional: Test vendor response after 5 seconds (uncomment to test)
// setTimeout(() => {
//   testVendorResponse(testBookingData.bookingId, 35); // Use a test vendor ID
// }, 5000); 