const imagekitService = require('./src/utils/imagekitService');
const fs = require('fs');
const path = require('path');

async function testImageKitService() {
  try {
    console.log('🚀 Testing ImageKit Service...');
    
    // Initialize the service
    await imagekitService.initialize();
    console.log('✅ ImageKit service initialized successfully');
    
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
    const uploadResult = await imagekitService.uploadFile(
      testImageBuffer,
      'test-service-image.png',
      'image/png',
      'SERVICE_IMAGES'
    );
    
    console.log('✅ Upload successful:', {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      publicLink: uploadResult.publicLink
    });
    console.log('🔗 Public link:', uploadResult.publicLink);
    
    // Test file deletion
    console.log('🗑️ Testing file deletion...');
    await imagekitService.deleteFile(uploadResult.fileId);
    console.log('✅ File deleted successfully');
    
    console.log('🎉 All tests passed! ImageKit service is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Missing required ImageKit credentials')) {
      console.log('\n📝 Setup Instructions:');
      console.log('1. Sign up at https://imagekit.io/');
      console.log('2. Get your API credentials from Developer → API Keys');
      console.log('3. Add to your .env file:');
      console.log('   IMAGEKIT_PUBLIC_KEY=your_public_key');
      console.log('   IMAGEKIT_PRIVATE_KEY=your_private_key');
      console.log('   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testImageKitService();
}

module.exports = testImageKitService; 