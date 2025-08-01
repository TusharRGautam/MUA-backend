/**
 * Test vendor document upload to verify ImageKit integration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testVendorUpload() {
  console.log('🧪 Testing Vendor Document Upload...\n');

  try {
    // Test 1: Check ImageKit status
    console.log('1. Checking ImageKit service status...');
    const statusResponse = await axios.get('http://localhost:3000/api/imagekit/status');
    console.log('Status:', statusResponse.data.message);
    
    if (!statusResponse.data.configured) {
      console.log('❌ ImageKit is not configured properly!');
      console.log('📝 Please add IMAGEKIT_PRIVATE_KEY to your .env file');
      console.log('🔧 Get it from: https://imagekit.io/dashboard → Settings → API Keys');
      return;
    }

    console.log('✅ ImageKit is properly configured!');

    // Test 2: Create a test image
    console.log('\n2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-document.png');
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created');

    // Test 3: Upload document
    console.log('\n3. Testing document upload...');
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('document', fs.createReadStream(testImagePath));
    formData.append('documentType', 'aadhaar');
    formData.append('vendorEmail', 'solo@gmail.com');
    formData.append('vendorName', 'solo');

    const uploadResponse = await axios.post(
      'http://localhost:3000/api/vendor-identity/upload-document',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
      }
    );

    if (uploadResponse.data.success) {
      console.log('✅ Upload successful!');
      console.log('ImageKit URL:', uploadResponse.data.data.cdnUrl);
      console.log('File ID:', uploadResponse.data.data.fileId);
    } else {
      console.log('❌ Upload failed:', uploadResponse.data.error);
    }

    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 Cleaned up test files');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 500 Error suggests:');
      console.log('1. ImageKit private key might be missing');
      console.log('2. Server configuration issue');
      console.log('3. Database connection problem');
    }
    
    if (error.response?.status === 404) {
      console.log('\n🔧 404 Error suggests:');
      console.log('1. Vendor email not found in database');
      console.log('2. API endpoint not available');
    }
  }
}

// Run the test
if (require.main === module) {
  testVendorUpload()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Test failed:', err.message);
      process.exit(1);
    });
}

module.exports = { testVendorUpload }; 