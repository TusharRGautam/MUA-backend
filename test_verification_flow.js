/**
 * Test script for vendor verification flow
 * Run with: node test_verification_flow.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';

async function testVerificationFlow() {
  console.log('🚀 Testing Vendor Verification Flow...\n');

  try {
    // Test 1: Check if routes are working
    console.log('1. Testing API routes...');
    const testResponse = await axios.get(`${API_BASE}/vendor-identity/test`);
    console.log('✅ Routes working:', testResponse.data.message);

    // Test 2: Check documents for a test email
    console.log('\n2. Checking documents for test email...');
    try {
      const docsResponse = await axios.get(`${API_BASE}/vendor-identity/documents-by-email?email=${TEST_EMAIL}`);
      console.log('✅ Documents found:', {
        aadhaar: !!docsResponse.data.data.aadhaar_card,
        pan: !!docsResponse.data.data.pan_card
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️  No documents found for test email (expected for new vendor)');
      } else {
        console.log('❌ Error checking documents:', error.message);
      }
    }

    // Test 3: Validate document formats
    console.log('\n3. Testing document validation...');
    const validationTests = [
      { aadhaarCard: '123456789012', panCard: 'ABCDE1234F', expected: true },
      { aadhaarCard: '12345', panCard: 'ABCDE1234F', expected: false },
      { aadhaarCard: '123456789012', panCard: 'INVALID', expected: false }
    ];

    for (const test of validationTests) {
      try {
        const validationResponse = await axios.post(`${API_BASE}/vendor-identity/validate`, test);
        console.log(`✅ Validation test passed:`, test);
      } catch (error) {
        if (error.response?.status === 400 && !test.expected) {
          console.log(`✅ Validation correctly rejected:`, test);
        } else {
          console.log(`❌ Unexpected validation result:`, test, error.response?.data);
        }
      }
    }

    console.log('\n🎉 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Start the frontend app');
    console.log('2. Try to toggle business status without documents');
    console.log('3. Verification modal should appear');
    console.log('4. Upload test documents');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testVerificationFlow(); 