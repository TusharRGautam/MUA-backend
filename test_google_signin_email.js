/**
 * Test script to verify Google Sign-In email saving functionality
 * This script tests the Firebase registration endpoint to ensure emails are properly saved
 */

const { query } = require('./db');

// Test data for Google Sign-In
const testGoogleUsers = [
  {
    firebaseUid: 'google_test_uid_1',
    fullName: 'John Google User',
    email: 'john.google@example.com',
    authProvider: 'google',
    deviceId: 'test_device_001',
    deviceInfo: {
      platform: 'web',
      userAgent: 'Chrome Test',
      version: '1.0.0'
    }
  },
  {
    firebaseUid: 'google_test_uid_2', 
    fullName: 'Jane Google User',
    email: 'jane.google@example.com',
    authProvider: 'google',
    deviceId: 'test_device_002',
    deviceInfo: {
      platform: 'android',
      userAgent: 'Mobile Test',
      version: '1.0.0'
    }
  },
  {
    firebaseUid: 'google_test_uid_3',
    fullName: 'Bob Google User', 
    email: 'bob.google@example.com',
    authProvider: 'google'
    // No deviceId or deviceInfo to test optional fields
  }
];

async function testGoogleSignInEmailSaving() {
  console.log('🧪 Testing Google Sign-In Email Saving Functionality');
  console.log('=' .repeat(60));
  
  try {
    // Clean up any existing test users first
    console.log('🧹 Cleaning up existing test users...');
    for (const testUser of testGoogleUsers) {
      await query('DELETE FROM Customer_Table_Details WHERE firebase_uid = $1', [testUser.firebaseUid]);
      await query('DELETE FROM Customer_Table_Details WHERE email = $1', [testUser.email]);
    }
    console.log('✅ Cleanup completed');
    
    const results = [];
    
    // Test each Google user
    for (let i = 0; i < testGoogleUsers.length; i++) {
      const testUser = testGoogleUsers[i];
      console.log(`\n📧 Test ${i + 1}: Testing Google Sign-In for ${testUser.email}`);
      
      try {
        // Simulate the Firebase registration API call
        const response = await fetch('http://localhost:3000/api/customers/firebase-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testUser)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          console.log(`✅ Registration successful for ${testUser.email}`);
          console.log(`   User ID: ${responseData.user.id}`);
          console.log(`   Custom User ID: ${responseData.user.custom_user_id}`);
          console.log(`   Firebase UID: ${responseData.user.firebase_uid}`);
          console.log(`   Email in response: ${responseData.user.email}`);
          
          // Verify in database
          const dbUser = await query(
            'SELECT id, custom_user_id, full_name, email, firebase_uid, phone_number, created_at FROM Customer_Table_Details WHERE firebase_uid = $1',
            [testUser.firebaseUid]
          );
          
          if (dbUser.rows.length > 0) {
            const savedUser = dbUser.rows[0];
            console.log(`   📊 Database verification:`);
            console.log(`     - ID: ${savedUser.id}`);
            console.log(`     - Custom User ID: ${savedUser.custom_user_id}`);
            console.log(`     - Full Name: ${savedUser.full_name}`);
            console.log(`     - Email: ${savedUser.email}`);
            console.log(`     - Firebase UID: ${savedUser.firebase_uid}`);
            console.log(`     - Phone Number: ${savedUser.phone_number}`);
            console.log(`     - Created At: ${savedUser.created_at}`);
            
            // Check if email was saved correctly
            const emailSavedCorrectly = savedUser.email === testUser.email;
            
            results.push({
              testNumber: i + 1,
              email: testUser.email,
              success: true,
              emailSavedCorrectly: emailSavedCorrectly,
              savedEmail: savedUser.email,
              expectedEmail: testUser.email,
              userId: savedUser.id,
              customUserId: savedUser.custom_user_id
            });
            
            if (emailSavedCorrectly) {
              console.log(`     ✅ Email saved correctly: ${savedUser.email}`);
            } else {
              console.log(`     ❌ Email NOT saved correctly!`);
              console.log(`       Expected: ${testUser.email}`);
              console.log(`       Got: ${savedUser.email}`);
            }
          } else {
            console.log(`   ❌ User not found in database after creation!`);
            results.push({
              testNumber: i + 1,
              email: testUser.email,
              success: false,
              emailSavedCorrectly: false,
              error: 'User not found in database'
            });
          }
          
        } else {
          console.log(`❌ Registration failed for ${testUser.email}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${responseData.error}`);
          
          results.push({
            testNumber: i + 1,
            email: testUser.email,
            success: false,
            emailSavedCorrectly: false,
            error: responseData.error,
            status: response.status
          });
        }
        
      } catch (error) {
        console.log(`❌ Test failed for ${testUser.email}: ${error.message}`);
        results.push({
          testNumber: i + 1,
          email: testUser.email,
          success: false,
          emailSavedCorrectly: false,
          error: error.message
        });
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test duplicate email handling
    console.log(`\n🔄 Test 4: Testing duplicate email handling`);
    try {
      const duplicateUser = {
        ...testGoogleUsers[0],
        firebaseUid: 'google_test_uid_duplicate',
        fullName: 'Duplicate Email User'
      };
      
      const response = await fetch('http://localhost:3000/api/customers/firebase-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateUser)
      });
      
      const responseData = await response.json();
      
      if (!response.ok && responseData.error && responseData.error.includes('already in use')) {
        console.log(`✅ Duplicate email properly rejected: ${responseData.error}`);
        results.push({
          testNumber: 4,
          email: duplicateUser.email,
          success: true,
          emailSavedCorrectly: true,
          note: 'Duplicate email properly rejected'
        });
      } else {
        console.log(`❌ Duplicate email should have been rejected but wasn't`);
        results.push({
          testNumber: 4,
          email: duplicateUser.email,
          success: false,
          emailSavedCorrectly: false,
          error: 'Duplicate email not properly rejected'
        });
      }
    } catch (error) {
      console.log(`❌ Duplicate email test failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const successfulTests = results.filter(r => r.success).length;
    const emailsSavedCorrectly = results.filter(r => r.emailSavedCorrectly).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`Successful Registrations: ${successfulTests}`);
    console.log(`Emails Saved Correctly: ${emailsSavedCorrectly}`);
    console.log(`Overall Success Rate: ${((emailsSavedCorrectly / results.length) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    results.forEach((result, index) => {
      const status = result.emailSavedCorrectly ? '✅' : '❌';
      console.log(`  ${status} Test ${result.testNumber}: ${result.email}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.savedEmail !== undefined) {
        console.log(`      Saved Email: ${result.savedEmail}`);
      }
      if (result.customUserId) {
        console.log(`      Custom User ID: ${result.customUserId}`);
      }
    });
    
    if (emailsSavedCorrectly === results.length) {
      console.log('\n🎉 ALL TESTS PASSED! Google Sign-In email saving is working correctly.');
    } else {
      console.log(`\n⚠️  ${results.length - emailsSavedCorrectly} test(s) failed. Email saving needs attention.`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    for (const testUser of testGoogleUsers) {
      await query('DELETE FROM Customer_Table_Details WHERE firebase_uid = $1', [testUser.firebaseUid]);
    }
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Check if script is run directly
if (require.main === module) {
  testGoogleSignInEmailSaving()
    .then(() => {
      console.log('\n📝 Test completed. Check the results above.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testGoogleSignInEmailSaving };