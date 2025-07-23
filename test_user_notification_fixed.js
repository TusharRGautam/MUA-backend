/**
 * Test User Notification System (Fixed Version)
 * Tests the complete flow with database lookup
 */

const { sendBookingAcceptanceNotification } = require('./services/userNotificationService');
const { query } = require('./db');

async function createTestUser() {
  try {
    console.log('📝 Creating test user in database...');
    
    // Insert a test user with push token
    const insertUserQuery = `
      INSERT INTO Customer_Table_Details (
        full_name, 
        email, 
        phone_number, 
        password,
        push_token,
        device_info,
        custom_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        push_token = EXCLUDED.push_token,
        device_info = EXCLUDED.device_info
      RETURNING id, custom_user_id, full_name, push_token
    `;
    
    const testUserData = [
      'Test User',
      'testuser@example.com',
      '+919876543210',
      'hashedpassword',
      'ExponentPushToken[AAAA-BBBB-CCCC-DDDD]', // Valid format for testing
      JSON.stringify({
        platform: 'android',
        deviceName: 'Test Device',
        appVersion: '1.0.0'
      }),
      'CLUB0199' // Test custom user ID
    ];
    
    const result = await query(insertUserQuery, testUserData);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Test user created/updated:`, {
        id: user.id,
        customUserId: user.custom_user_id,
        fullName: user.full_name,
        hasToken: !!user.push_token
      });
      return user;
    } else {
      throw new Error('Failed to create test user');
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function testUserNotificationWithDatabase() {
  console.log('🧪 Testing User Notification System (Fixed Version)');
  console.log('=======================================================\n');

  try {
    // Step 1: Create test user in database
    const testUser = await createTestUser();
    
    // Step 2: Test booking data
    const testBookingData = {
      userId: testUser.id.toString(),
      customUserId: testUser.custom_user_id,
      userEmail: 'testuser@example.com',
      userPhone: '+919876543210',
      vendorName: 'Amazing Beauty Salon',
      bookingId: 'BK' + Date.now()
    };

    console.log('📱 Testing notification with booking data:', testBookingData);

    // Step 3: Test the notification sending
    console.log('\n📱 Sending booking acceptance notification...');
    const result = await sendBookingAcceptanceNotification(testBookingData);
    
    console.log('\n📋 Notification Result:', {
      success: result.success,
      error: result.error || 'None',
      skipped: result.skipped || false
    });

    if (result.success && !result.skipped) {
      console.log('\n✅ SUCCESS: User notification system is working correctly!');
      console.log(`📱 Notification sent with message: "Hurray! ${testBookingData.vendorName} has accepted your booking."`);
    } else if (result.skipped) {
      console.log('\n⚠️ SKIPPED: Notification was skipped');
      console.log('📝 Reason:', result.error);
    } else {
      console.log('\n❌ FAILED: User notification failed');
      console.log('Error:', result.error);
    }

    // Step 4: Test with different identifier types
    console.log('\n📝 Testing with different user identifiers...');
    
    // Test with custom user ID
    const customIdResult = await sendBookingAcceptanceNotification({
      ...testBookingData,
      userId: null,
      customUserId: testUser.custom_user_id
    });
    console.log(`Custom ID lookup: ${customIdResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // Test with email
    const emailResult = await sendBookingAcceptanceNotification({
      ...testBookingData,
      userId: null,
      customUserId: null,
      userEmail: 'testuser@example.com'
    });
    console.log(`Email lookup: ${emailResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // Test with phone
    const phoneResult = await sendBookingAcceptanceNotification({
      ...testBookingData,
      userId: null,
      customUserId: null,
      userEmail: null,
      userPhone: '+919876543210'
    });
    console.log(`Phone lookup: ${phoneResult.success ? '✅ Success' : '❌ Failed'}`);

    // Step 5: Test with non-existent user
    console.log('\n📝 Testing with non-existent user...');
    const nonExistentUserData = {
      userId: '99999',
      customUserId: 'CLUB9999',
      userEmail: 'nonexistent@example.com',
      userPhone: '+919999999999',
      vendorName: 'Test Vendor',
      bookingId: 'BK999999'
    };
    
    const noUserResult = await sendBookingAcceptanceNotification(nonExistentUserData);
    
    if (noUserResult.skipped) {
      console.log('✅ Correctly handled non-existent user (skipped notification)');
    } else {
      console.log('⚠️ Unexpected result for non-existent user:', noUserResult);
    }

    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`✅ Database user creation: Success`);
    console.log(`${result.success ? '✅' : '❌'} Main notification test: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`${customIdResult.success ? '✅' : '❌'} Custom ID lookup: ${customIdResult.success ? 'Success' : 'Failed'}`);
    console.log(`${emailResult.success ? '✅' : '❌'} Email lookup: ${emailResult.success ? 'Success' : 'Failed'}`);
    console.log(`${phoneResult.success ? '✅' : '❌'} Phone lookup: ${phoneResult.success ? 'Success' : 'Failed'}`);
    console.log(`${noUserResult.skipped ? '✅' : '❌'} Non-existent user handling: ${noUserResult.skipped ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🏁 Test completed');
}

// Run the test if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting Fixed User Notification Test...\n');
  testUserNotificationWithDatabase()
    .then(() => {
      console.log('\n✨ Test script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testUserNotificationWithDatabase,
  createTestUser
}; 