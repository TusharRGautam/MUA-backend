async function testImageUploadFix() {
  console.log('🧪 Testing Image Upload Fix for Salon Services');
  console.log('=====================================');

  try {
    // Sample base64 image (tiny 1x1 pixel transparent GIF for testing)
    const sampleImageBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Test 1: Upload image with salon folder structure
    console.log('\n📝 Test 1: Uploading image to salon/bridal folder...');
    
    const imageResponse = await fetch('http://localhost:3001/api/upload/salon-service-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sampleImageBase64,
        folderPath: 'salon/bridal',
        serviceType: 'Package',
        imageType: 'package_test',
        filename: 'test_bridal_service.gif'
      })
    });
    
    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      console.log('✅ Image uploaded successfully!');
      console.log(`🔗 Image URL: ${imageResult.imageUrl}`);
      console.log(`📁 Folder Path: ${imageResult.folderPath}`);
      console.log(`🆔 File ID: ${imageResult.fileId}`);
    } else {
      const errorText = await imageResponse.text();
      console.log('❌ Image upload failed:', errorText);
    }

    // Test 2: Upload image with different category
    console.log('\n📝 Test 2: Uploading image to salon/haircut_styling folder...');
    
    const imageResponse2 = await fetch('http://localhost:3001/api/upload/salon-service-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sampleImageBase64,
        folderPath: 'salon/haircut_styling',
        serviceType: 'Combo',
        imageType: 'combo_test',
        filename: 'test_haircut_service.gif'
      })
    });
    
    if (imageResponse2.ok) {
      const imageResult2 = await imageResponse2.json();
      console.log('✅ Image uploaded successfully!');
      console.log(`🔗 Image URL: ${imageResult2.imageUrl}`);
      console.log(`📁 Folder Path: ${imageResult2.folderPath}`);
      console.log(`🆔 File ID: ${imageResult2.fileId}`);
    } else {
      const errorText2 = await imageResponse2.text();
      console.log('❌ Image upload failed:', errorText2);
    }

    // Test 3: Test fallback to default folder
    console.log('\n📝 Test 3: Testing fallback to default folder...');
    
    const imageResponse3 = await fetch('http://localhost:3001/api/upload/salon-service-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sampleImageBase64,
        folderPath: '', // Empty folder path should use default
        serviceType: 'Single',
        imageType: 'single_test',
        filename: 'test_default_service.gif'
      })
    });
    
    if (imageResponse3.ok) {
      const imageResult3 = await imageResponse3.json();
      console.log('✅ Image uploaded successfully to default folder!');
      console.log(`🔗 Image URL: ${imageResult3.imageUrl}`);
      console.log(`📁 Folder Path: ${imageResult3.folderPath || 'default'}`);
      console.log(`🆔 File ID: ${imageResult3.fileId}`);
    } else {
      const errorText3 = await imageResponse3.text();
      console.log('❌ Image upload failed:', errorText3);
    }

    console.log('\n🎉 Image upload fix testing completed!');
    console.log('✅ The salon service image upload should now work with custom folder paths');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Make sure the backend server is running on port 3001');
  }
}

testImageUploadFix();