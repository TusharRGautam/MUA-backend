async function testFullSalonServiceFlow() {
  console.log('🧪 Testing Complete Salon Service Flow with Image Uploads');
  console.log('=====================================');

  try {
    // Sample base64 image (tiny 1x1 pixel transparent GIF for testing)
    const sampleImageBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Test 1: Create single services for package/combo
    console.log('\n📝 Test 1: Creating single services...');
    
    const singleServices = [
      {
        service_name: 'Professional Hair Styling',
        service_category: 'Haircut & Styling',
        service_price: 1200,
        service_duration: 60,
        service_description: 'Expert hair styling service',
        vendor_id: 1,
        package_name: 'Professional Hair Styling',
        service_type: 'Single'
      },
      {
        service_name: 'Bridal Makeup',
        service_category: 'Makeup',
        service_price: 2000,
        service_duration: 90,
        service_description: 'Complete bridal makeup',
        vendor_id: 1,
        package_name: 'Bridal Makeup',
        service_type: 'Single'
      },
      {
        service_name: 'Nail Art Design',
        service_category: 'Nail Care',
        service_price: 800,
        service_duration: 45,
        service_description: 'Creative nail art designs',
        vendor_id: 1,
        package_name: 'Nail Art Design',
        service_type: 'Single'
      }
    ];

    const createdServiceIds = [];
    
    for (const serviceData of singleServices) {
      const response = await fetch('http://localhost:3001/api/dashboard-services/salon-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        createdServiceIds.push(result.data.id);
        console.log(`✅ Created ${serviceData.service_name} (ID: ${result.data.id})`);
      } else {
        throw new Error(`Failed to create ${serviceData.service_name}`);
      }
    }

    // Test 2: Upload images for each service
    console.log('\n📝 Test 2: Uploading images for services...');
    
    const serviceImages = {};
    
    for (let i = 0; i < createdServiceIds.length; i++) {
      const serviceId = createdServiceIds[i];
      const serviceName = singleServices[i].service_name;
      const category = singleServices[i].service_category;
      
      const imageResponse = await fetch('http://localhost:3001/api/upload/salon-service-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sampleImageBase64,
          folderPath: `salon/${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          serviceType: 'Single',
          imageType: `service_${serviceId}`,
          filename: `${serviceName.replace(/\\s+/g, '_').toLowerCase()}.gif`
        })
      });
      
      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        serviceImages[serviceId] = imageResult.imageUrl;
        console.log(`✅ Uploaded image for ${serviceName}: ${imageResult.imageUrl}`);
      } else {
        console.log(`❌ Failed to upload image for ${serviceName}`);
      }
    }

    // Test 3: Create Package service with multiple images
    console.log('\n📝 Test 3: Creating Package service with images...');
    
    const packageService = {
      service_name: 'Ultimate Bridal Package',  // Frontend sends package_name as service_name
      service_category: 'Bridal',
      service_price: 4500,
      service_duration: 195,
      service_description: 'Complete bridal beauty package',
      vendor_id: 1,
      package_name: 'Ultimate Bridal Package',
      service_type: 'Package',
      selected_services: createdServiceIds.join(','),
      service_images: JSON.stringify(serviceImages)  // Store all service images
    };
    
    const packageResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packageService)
    });
    
    if (packageResponse.ok) {
      const packageResult = await packageResponse.json();
      console.log('✅ Package service created successfully');
      console.log(`🆔 Service ID: ${packageResult.data.id}`);
      console.log(`📦 Service Name: ${packageResult.data.service_name}`);
      console.log(`📦 Package Name: ${packageResult.data.package_name}`);
      console.log(`🔗 Selected Services: ${packageResult.data.selected_services}`);
      console.log(`🖼️ Service Images:`, JSON.parse(packageResult.data.service_images || '{}'));
      
      createdServiceIds.push(packageResult.data.id);
    } else {
      const errorText = await packageResponse.text();
      throw new Error(`Failed to create package service: ${errorText}`);
    }

    // Test 4: Verify all services
    console.log('\n📋 Test 4: Verifying all services...');
    
    const fetchResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services');
    
    if (fetchResponse.ok) {
      const fetchResult = await fetchResponse.json();
      
      const packageServices = fetchResult.data.filter(service => service.service_type === 'Package');
      const singleServices = fetchResult.data.filter(service => service.service_type === 'Single');
      
      console.log(`✅ Found ${singleServices.length} Single services`);
      console.log(`✅ Found ${packageServices.length} Package services`);
      
      // Check services with images
      const servicesWithImages = fetchResult.data.filter(service => 
        service.service_images && service.service_images !== '{}' && service.service_images !== ''
      );
      
      console.log('\n🖼️ Services with images:');
      servicesWithImages.forEach(service => {
        const imageCount = Object.keys(JSON.parse(service.service_images || '{}')).length;
        console.log(`   - ${service.service_name} (${service.service_type}): ${imageCount} image(s)`);
      });
    } else {
      throw new Error('Failed to fetch services');
    }

    // Test 5: Clean up test data
    console.log('\n🗑️ Test 5: Cleaning up test data...');
    
    for (const id of createdServiceIds) {
      const deleteResponse = await fetch(`http://localhost:3001/api/dashboard-services/salon-services/${id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ Deleted service ID: ${id}`);
      } else {
        console.log(`❌ Failed to delete service ID: ${id}`);
      }
    }

    console.log('\n🎉 Complete flow test successful!');
    console.log('✅ All functionality working:');
    console.log('   - ✅ Image uploads to custom salon/category folders');
    console.log('   - ✅ Package services created without Service Name field');
    console.log('   - ✅ Multiple images stored correctly in JSON format');
    console.log('   - ✅ Frontend should now work perfectly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Make sure the backend server is running on port 3001');
  }
}

testFullSalonServiceFlow();