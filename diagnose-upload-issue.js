/**
 * Diagnostic script to identify upload issues
 * Run: node diagnose-upload-issue.js
 */

const axios = require('axios');

async function diagnoseUploadIssue() {
  console.log('🔍 Diagnosing Upload Issue...\n');

  const BASE_URL = 'http://localhost:3000';
  const VENDOR_EMAIL = 'solo@gmail.com';

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const pingResponse = await axios.get(`${BASE_URL}/api/imagekit/status`, { timeout: 5000 });
      console.log('✅ Server is running');
      console.log('ImageKit Status:', pingResponse.data.message);
      console.log('ImageKit Configured:', pingResponse.data.configured);
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      console.log('🔧 Please ensure the server is running with: node src/index.js');
      return;
    }

    // Test 2: Check vendor existence
    console.log('\n2. Testing vendor existence...');
    try {
      const vendorResponse = await axios.get(`${BASE_URL}/api/vendor-identity/test-vendor/${VENDOR_EMAIL}`, { timeout: 5000 });
      console.log('✅ Vendor test endpoint working');
      console.log('Vendor exists:', vendorResponse.data.vendor.exists);
      console.log('ImageKit ready:', vendorResponse.data.imagekit.ready);
      console.log('Message:', vendorResponse.data.message);
      
      if (vendorResponse.data.vendor.exists) {
        console.log('Vendor data:', vendorResponse.data.vendor.data);
      } else {
        console.log('❌ Vendor not found in database!');
        console.log('🔧 The vendor email "solo@gmail.com" needs to be registered first');
        return;
      }

      if (!vendorResponse.data.imagekit.configured) {
        console.log('❌ ImageKit not configured!');
        console.log('🔧 Please check IMAGEKIT_PRIVATE_KEY in .env file');
        return;
      }

    } catch (error) {
      console.log('❌ Vendor test failed:', error.response?.data || error.message);
    }

    // Test 3: Test ImageKit service directly
    console.log('\n3. Testing ImageKit service...');
    try {
      const imagekitService = require('./utils/imagekitService');
      console.log('ImageKit configured:', imagekitService.isConfigured());
      console.log('ImageKit ready:', imagekitService.isImageKitReady());
    } catch (error) {
      console.log('❌ ImageKit service error:', error.message);
    }

    // Test 4: Test upload endpoint with minimal data
    console.log('\n4. Testing upload endpoint...');
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      
      // Create a minimal test file
      const testContent = 'test content';
      fs.writeFileSync('test-file.txt', testContent);
      
      const formData = new FormData();
      formData.append('document', fs.createReadStream('test-file.txt'));
      formData.append('documentType', 'aadhaar');
      formData.append('vendorEmail', VENDOR_EMAIL);
      formData.append('vendorName', 'solo');

      const uploadResponse = await axios.post(
        `${BASE_URL}/api/vendor-identity/upload-document`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      console.log('✅ Upload successful!');
      console.log('Response:', uploadResponse.data);

      // Cleanup
      fs.unlinkSync('test-file.txt');

    } catch (error) {
      console.log('❌ Upload failed!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      
      // Cleanup
      try { fs.unlinkSync('test-file.txt'); } catch {}
      
      if (error.response?.status === 500) {
        console.log('\n🔧 500 Error Analysis:');
        console.log('- This is a server-side error');
        console.log('- Check server console logs for detailed error');
        console.log('- Possible causes:');
        console.log('  • ImageKit private key invalid/missing');
        console.log('  • Database connection issue');
        console.log('  • File processing error');
      }
    }

    console.log('\n🎯 Diagnosis Complete!');
    console.log('\nNext steps:');
    console.log('1. Check the server console logs for detailed errors');
    console.log('2. Verify ImageKit private key is correct');
    console.log('3. Ensure vendor is registered in database');

  } catch (error) {
    console.error('\n💥 Diagnosis failed:', error.message);
  }
}

// Run diagnosis
diagnoseUploadIssue(); 