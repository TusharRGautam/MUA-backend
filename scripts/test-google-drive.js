/**
 * Test script for Google Drive integration
 * 
 * This script tests the Google Drive integration by:
 * 1. Initializing the Google Drive client
 * 2. Creating a test gallery folder
 * 3. Uploading a test image to the folder
 * 
 * Run with: node scripts/test-google-drive.js
 */

require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');
const { 
  initializeDriveClient, 
  createTestGalleryFolder,
  uploadFile,
  PARENT_FOLDER_ID
} = require('../utils/googleDriveService');

// Create a temporary test image
const createTestImage = async () => {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const testImagePath = path.join(tempDir, 'test-image.webp');
  
  // Copy a sample image from the Google services directory or create a blank one
  try {
    // Try to copy from Android resources if available
    const androidResourcePath = path.join(__dirname, '..', 'google-services', 'Android', 'res', 'mipmap-xxxhdpi', 'ic_launcher.png');
    
    if (fs.existsSync(androidResourcePath)) {
      fs.copyFileSync(androidResourcePath, testImagePath);
      console.log(`Copied test image from: ${androidResourcePath}`);
    } else {
      // Create a blank image (1x1 pixel PNG)
      const blankImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      fs.writeFileSync(testImagePath, Buffer.from(blankImageBase64, 'base64'));
      console.log('Created blank test image');
    }
    
    return testImagePath;
  } catch (error) {
    console.error('Error creating test image:', error);
    throw error;
  }
};

// Main test function
const testGoogleDriveIntegration = async () => {
  try {
    console.log('Starting Google Drive integration test...');
    console.log(`Using parent folder ID: ${PARENT_FOLDER_ID}`);
    
    // Step 1: Initialize the Google Drive client
    console.log('\nStep 1: Initializing Google Drive client...');
    const driveClient = initializeDriveClient();
    console.log('✅ Google Drive client initialized successfully');
    
    // Step 2: Create a test gallery folder
    console.log('\nStep 2: Creating test gallery folder...');
    const folderId = await createTestGalleryFolder();
    console.log(`✅ Test gallery folder created/found with ID: ${folderId}`);
    
    // Step 3: Upload a test image to the folder
    console.log('\nStep 3: Uploading test image to the folder...');
    const testImagePath = await createTestImage();
    const fileName = `test-image-${Date.now()}.webp`;
    
    const uploadedFile = await uploadFile(
      testImagePath,
      fileName,
      'image/webp',
      folderId
    );
    
    console.log(`✅ Test image uploaded successfully`);
    console.log(`   File ID: ${uploadedFile.id}`);
    console.log(`   File Name: ${uploadedFile.name}`);
    console.log(`   Web View Link: ${uploadedFile.webViewLink}`);
    console.log(`   Web Content Link: ${uploadedFile.webContentLink}`);
    
    // Clean up the test image
    fs.unlinkSync(testImagePath);
    console.log('\nTest image cleaned up');
    
    console.log('\n✅ Google Drive integration test completed successfully!');
    console.log('\nYou can view your folder in Google Drive at:');
    console.log(`https://drive.google.com/drive/folders/${PARENT_FOLDER_ID}`);
    
  } catch (error) {
    console.error('\n❌ Google Drive integration test failed:', error);
    process.exit(1);
  }
};

// Run the test
testGoogleDriveIntegration(); 