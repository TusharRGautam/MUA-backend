const googleDriveService = require('./src/utils/googleDriveService');

async function testSimpleUpload() {
  try {
    console.log('🚀 Testing simple Google Drive upload...');
    
    // Initialize the service
    await googleDriveService.initialize();
    console.log('✅ Service initialized');
    console.log('📁 Available folder IDs:', googleDriveService.folderIds);
    
    // Create a simple test buffer
    const testBuffer = Buffer.from('Hello World Test Image');
    
    console.log('📤 Testing upload to SERVICE_IMAGES folder...');
    
    // Test upload
    const result = await googleDriveService.uploadFile(
      testBuffer,
      'test-upload.txt',
      'text/plain',
      'SERVICE_IMAGES'
    );
    
    console.log('✅ Upload successful!');
    console.log('📄 File ID:', result.fileId);
    console.log('🔗 Public link:', result.publicLink);
    
    // Test deletion
    console.log('🗑️ Testing file deletion...');
    await googleDriveService.deleteFile(result.fileId);
    console.log('✅ File deleted successfully');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSimpleUpload(); 