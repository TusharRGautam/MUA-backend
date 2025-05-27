const hybridImageService = require('./src/utils/hybridImageService');
const fs = require('fs');
const path = require('path');

async function testHybridService() {
  try {
    console.log('🚀 Testing Hybrid Image Service...');
    
    // Initialize the service
    await hybridImageService.initialize();
    console.log('✅ Hybrid service initialized');
    
    // Check service status
    const status = hybridImageService.getStatus();
    console.log('📊 Service status:', status);
    
    // Create a test image buffer (simple PNG)
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
    const uploadResult = await hybridImageService.uploadFile(
      testImageBuffer,
      'test-service-image.png',
      'image/png',
      'SERVICE_IMAGES'
    );
    
    console.log('✅ Upload successful:', {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      storageType: uploadResult.storageType,
      publicLink: uploadResult.publicLink
    });
    
    // Test file ID extraction
    const extractedFileId = hybridImageService.extractFileIdFromLink(uploadResult.publicLink);
    console.log('🔍 Extracted file ID:', extractedFileId);
    
    // Test storage type detection
    const detectedStorageType = hybridImageService.detectStorageType(uploadResult.publicLink);
    console.log('🔍 Detected storage type:', detectedStorageType);
    
    // Test file deletion
    console.log('🗑️ Testing file deletion...');
    await hybridImageService.deleteFile(uploadResult.fileId, uploadResult.storageType);
    console.log('✅ File deleted successfully');
    
    console.log('🎉 All tests passed! Hybrid service is working correctly.');
    
    // Show final status
    const finalStatus = hybridImageService.getStatus();
    console.log('📊 Final service status:', finalStatus);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testHybridService(); 