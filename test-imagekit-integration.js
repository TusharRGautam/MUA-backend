/**
 * Test script for ImageKit.io integration
 * Run with: node test-imagekit-integration.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_VENDOR_NAME = 'Test Vendor';

async function testImageKitIntegration() {
  console.log('🚀 Testing ImageKit.io Integration...\n');

  try {
    // Test 1: Check ImageKit service status
    console.log('1. Testing ImageKit service status...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/imagekit/status`);
      console.log('✅ Service Status:', statusResponse.data.message);
      
      if (!statusResponse.data.configured) {
        console.log('⚠️  Warning: ImageKit service is not fully configured');
        console.log('   Please add IMAGEKIT_PRIVATE_KEY to your .env file');
        return;
      }
    } catch (error) {
      console.log('❌ Service status check failed:', error.message);
      console.log('   Make sure the backend server is running');
      return;
    }

    // Test 2: Check authentication parameters
    console.log('\n2. Testing authentication parameters...');
    try {
      const authResponse = await axios.get(`${API_BASE}/imagekit/auth`);
      console.log('✅ Authentication parameters retrieved successfully');
      console.log('   Token expires at:', new Date(authResponse.data.expire * 1000).toISOString());
    } catch (error) {
      console.log('❌ Authentication test failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Create a test image for upload
    console.log('\n3. Creating test image...');
    const testImagePath = await createTestImage();
    if (!testImagePath) {
      console.log('❌ Failed to create test image');
      return;
    }
    console.log('✅ Test image created:', testImagePath);

    // Test 4: Test document upload
    console.log('\n4. Testing document upload...');
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('document', fs.createReadStream(testImagePath));
      formData.append('documentType', 'aadhaar');
      formData.append('vendorEmail', TEST_EMAIL);
      formData.append('vendorName', TEST_VENDOR_NAME);

      const uploadResponse = await axios.post(
        `${API_BASE}/imagekit/upload-verification`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        }
      );

      if (uploadResponse.data.success) {
        console.log('✅ Document upload successful!');
        console.log('   ImageKit URL:', uploadResponse.data.data.cdnUrl);
        console.log('   File ID:', uploadResponse.data.data.fileId);
        console.log('   File Size:', uploadResponse.data.data.size, 'bytes');
      } else {
        console.log('❌ Upload failed:', uploadResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Upload test failed:', error.response?.data?.error || error.message);
      
      if (error.response?.data?.details) {
        console.log('   Details:', error.response.data.details);
      }
    }

    // Test 5: Test base64 upload (alternative method)
    console.log('\n5. Testing base64 upload...');
    try {
      const imageBuffer = fs.readFileSync(testImagePath);
      const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;

      const base64Response = await axios.post(
        `${API_BASE}/imagekit/upload-verification-base64`,
        {
          documentType: 'pan',
          vendorEmail: TEST_EMAIL,
          vendorName: TEST_VENDOR_NAME,
          imageData: base64Data
        },
        {
          timeout: 30000,
        }
      );

      if (base64Response.data.success) {
        console.log('✅ Base64 upload successful!');
        console.log('   ImageKit URL:', base64Response.data.data.cdnUrl);
      } else {
        console.log('❌ Base64 upload failed:', base64Response.data.error);
      }
    } catch (error) {
      console.log('❌ Base64 upload test failed:', error.response?.data?.error || error.message);
    }

    // Cleanup
    console.log('\n6. Cleaning up...');
    try {
      fs.unlinkSync(testImagePath);
      console.log('✅ Test files cleaned up');
    } catch (error) {
      console.log('⚠️  Warning: Could not clean up test files');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

/**
 * Create a simple test image for upload testing
 */
async function createTestImage() {
  try {
    const testDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testImagePath = path.join(testDir, 'test-document.png');
    
    // Create a simple 1x1 pixel PNG (smallest valid image)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    return testImagePath;
  } catch (error) {
    console.error('Error creating test image:', error);
    return null;
  }
}

// Run the test
if (require.main === module) {
  testImageKitIntegration()
    .then(() => {
      console.log('\n🎉 ImageKit integration test completed!');
      console.log('\nNext steps:');
      console.log('1. Add IMAGEKIT_PRIVATE_KEY to your .env file if not already done');
      console.log('2. Test the VendorVerificationModal in your app');
      console.log('3. Check your ImageKit.io dashboard for uploaded files');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testImageKitIntegration }; 