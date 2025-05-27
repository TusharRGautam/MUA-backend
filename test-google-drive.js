const googleDriveService = require('./src/utils/googleDriveService');
const fs = require('fs');
const path = require('path');

async function testGoogleDriveService() {
  try {
    console.log('🚀 Testing Google Drive Service...');
    
    // Initialize the service
    await googleDriveService.initialize();
    console.log('✅ Google Drive service initialized successfully');
    
    // Test folder structure
    console.log('📁 Folder IDs:', googleDriveService.folderIds);
    
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    console.log('📤 Testing file upload...');
    
    // Test upload to service images folder
    const uploadResult = await googleDriveService.uploadFile(
      testImageBuffer,
      'test-service-image.png',
      'image/png',
      'SERVICE_IMAGES'
    );
    
    console.log('✅ Upload successful:', uploadResult);
    console.log('🔗 Public link:', uploadResult.publicLink);
    
    // Test file deletion
    console.log('🗑️ Testing file deletion...');
    await googleDriveService.deleteFile(uploadResult.fileId);
    console.log('✅ File deleted successfully');
    
    console.log('🎉 All tests passed! Google Drive service is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGoogleDriveService(); 