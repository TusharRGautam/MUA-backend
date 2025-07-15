const axios = require('axios');

async function testPRPBooking() {
  try {
    console.log('Testing PRP booking API...');
    
    const testData = {
      bookingId: 'PRP_TEST_' + Date.now(),
      userId: 129,
      customUserId: 'CLUB0123',
      planName: 'PRP Hair Restoration Therapy',
      planPrice: '8000',
      totalAmount: 8000,
      finalAmount: 8000,
      startDate: new Date().toISOString(),
      visitDate: new Date().toISOString(),
      staffName: 'Dr. Michael Chen',
      doctorName: 'Dr. Michael Chen',
      staffRole: 'Dermatology & Hair Treatment',
      sessionCount: 6,
      status: 'confirmed',
      paymentMethod: 'upi',
      serviceType: 'prp',
      serviceCategory: 'Hair Restoration',
      serviceGender: 'both',
      userName: 'testuser',
      customerName: 'testuser',
      userEmail: 'test@example.com',
      customerEmail: 'test@example.com',
      userPhone: '+919029158095',
      customerPhone: '+919029158095',
      bookingDate: '2025-07-14',
      bookingTime: '5:00 PM',
      selectedDates: ['2025-07-14', '2025-07-28', '2025-08-11'],
      selectedTimeSlot: '5:00 PM',
      recurringOption: 'biweekly',
      createdAt: new Date().toISOString(),
      paymentId: 'test_payment_123',
      paymentStatus: 'paid',
      treatmentPlan: JSON.stringify({
        planName: 'PRP Hair Restoration Therapy',
        sessionCount: 6,
        recurringPattern: 'biweekly',
        sessionDates: ['2025-07-14', '2025-07-28', '2025-08-11'],
        sessionTime: '5:00 PM'
      })
    };
    
    const response = await axios.post('http://localhost:3000/api/prp/booking', testData);
    
    console.log('✅ PRP booking test SUCCESSFUL!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ PRP booking test FAILED:');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
    
    // Check if it's the session_dates column error
    if (error.response?.data?.error?.includes('session_dates')) {
      console.log('\n🔍 This is the session_dates column error we were trying to fix!');
    } else {
      console.log('\n🔍 This is a different error, not related to session_dates column.');
    }
  }
}

testPRPBooking();