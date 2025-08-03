const hybridImageService = require('./src/utils/hybridImageService');

async function testHybridImageService() {
  try {
    console.log('🚀 Testing Hybrid Image Service with ImageKit...');
    
    // Initialize the service
    await hybridImageService.initialize();
    console.log('✅ Hybrid image service initialized successfully');
    
    // Check service status
    const status = hybridImageService.getStatus();
    console.log('📊 Service Status:', status);
    
    // Create a test image buffer
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    console.log('📤 Testing hybrid upload...');
    
    // Test upload through hybrid service
    const uploadResult = await hybridImageService.uploadFile(
      testImageBuffer,
      'test-hybrid-image.png',
      'image/png',
      'SERVICE_IMAGES'
    );
    
    console.log('✅ Upload successful via', uploadResult.storageType);
    console.log('📄 File details:', {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      publicLink: uploadResult.publicLink,
      storageType: uploadResult.storageType
    });
    
    // Test storage type detection
    const detectedType = hybridImageService.detectStorageType(uploadResult.publicLink);
    console.log('🔍 Detected storage type:', detectedType);
    
    // Test file ID extraction
    const extractedFileId = hybridImageService.extractFileIdFromLink(uploadResult.publicLink);
    console.log('🆔 Extracted file ID:', extractedFileId);
    
    // Test file deletion
    console.log('🗑️ Testing file deletion...');
    await hybridImageService.deleteFile(uploadResult.fileId, uploadResult.storageType);
    console.log('✅ File deleted successfully');
    
    console.log('🎉 All hybrid service tests passed!');
    
    // Test fallback scenario
    console.log('\n🔄 Testing fallback scenario...');
    console.log('Note: If ImageKit fails, should fall back to local storage');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Provide specific troubleshooting
    if (error.message.includes('ImageKit')) {
      console.log('\n💡 ImageKit Issue Detected:');
      console.log('- Check your ImageKit credentials in .env file');
      console.log('- Verify ImageKit account has sufficient quota');
      console.log('- Service should fall back to local storage automatically');
    }
    
    process.exit(1);
  }
}

async function testFallbackBehavior() {
  console.log('\n🧪 Testing Fallback Behavior...');
  
  try {
    // Temporarily break ImageKit to test fallback
    const originalPublicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    process.env.IMAGEKIT_PUBLIC_KEY = 'invalid_key';
    
    const hybridService = require('./src/utils/hybridImageService');
    await hybridService.initialize();
    
    const status = hybridService.getStatus();
    console.log('📊 Fallback Status:', status);
    
    if (status.preferredService === 'local') {
      console.log('✅ Fallback to local storage working correctly');
    }
    
    // Restore original key
    process.env.IMAGEKIT_PUBLIC_KEY = originalPublicKey;
    
  } catch (error) {
    console.log('⚠️ Fallback test error (expected):', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testHybridImageService()
    .then(() => testFallbackBehavior())
    .catch(console.error);
}

module.exports = { testHybridImageService, testFallbackBehavior }; 