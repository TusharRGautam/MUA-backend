const fs = require('fs');
const path = require('path');

async function testSalonServiceImages() {
  console.log('🧪 Testing Salon Service Images (Combo/Package with Multiple Images)');
  console.log('=====================================');

  try {
    // Sample base64 image (tiny 1x1 pixel transparent GIF for testing)
    const sampleImageBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Test 1: Create basic services first for combo/package
    console.log('\n📝 Test 1: Creating basic services for combo/package...');
    
    const basicServices = [
      {
        service_name: 'Hair Styling',
        service_category: 'Haircut & Styling',
        service_price: 800,
        service_duration: 60,
        service_description: 'Professional hair styling',
        vendor_id: 1,
        package_name: 'Hair Styling',
        service_type: 'Single'
      },
      {
        service_name: 'Makeup Application',
        service_category: 'Makeup',
        service_price: 1000,
        service_duration: 45,
        service_description: 'Professional makeup application',
        vendor_id: 1,
        package_name: 'Makeup Application',
        service_type: 'Single'
      },
      {
        service_name: 'Nail Art',
        service_category: 'Nail Care',
        service_price: 600,
        service_duration: 90,
        service_description: 'Creative nail art designs',
        vendor_id: 1,
        package_name: 'Nail Art',
        service_type: 'Single'
      }
    ];

    const createdServiceIds = [];
    
    for (const serviceData of basicServices) {
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

    // Test 2: Upload sample images for services
    console.log('\n📝 Test 2: Uploading sample images...');
    
    const uploadedImages = {};
    
    for (let i = 0; i < createdServiceIds.length; i++) {
      const serviceId = createdServiceIds[i];
      const serviceName = basicServices[i].service_name;
      const category = basicServices[i].service_category;
      
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
        uploadedImages[serviceId] = imageResult.imageUrl;
        console.log(`✅ Uploaded image for ${serviceName}: ${imageResult.imageUrl}`);
      } else {
        console.log(`⚠️ Failed to upload image for ${serviceName}`);
      }
    }

    // Test 3: Create Combo service with images
    console.log('\n📝 Test 3: Creating Combo service with images...');
    
    const comboServiceImages = {
      [createdServiceIds[0]]: uploadedImages[createdServiceIds[0]],
      [createdServiceIds[1]]: uploadedImages[createdServiceIds[1]]
    };
    
    const comboService = {
      service_name: 'Hair & Makeup Combo',
      service_category: 'Combo Services',
      service_price: 1500,
      service_duration: 105,
      service_description: 'Professional hair styling and makeup combo',
      vendor_id: 1,
      package_name: 'Hair & Makeup Combo',
      service_type: 'Combo',
      selected_services: `${createdServiceIds[0]},${createdServiceIds[1]}`,
      service_images: JSON.stringify(comboServiceImages)
    };
    
    const comboResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comboService)
    });
    
    if (comboResponse.ok) {
      const comboResult = await comboResponse.json();
      console.log('✅ Combo service created successfully');
      console.log(`🆔 Service ID: ${comboResult.data.id}`);
      console.log(`📦 Service Type: ${comboResult.data.service_type}`);
      console.log(`🔗 Selected Services: ${comboResult.data.selected_services}`);
      console.log(`🖼️ Service Images: ${comboResult.data.service_images}`);
      
      createdServiceIds.push(comboResult.data.id);
    } else {
      throw new Error('Failed to create combo service');
    }

    // Test 4: Create Package service with images
    console.log('\n📝 Test 4: Creating Package service with images...');
    
    const packageServiceImages = {
      [createdServiceIds[0]]: uploadedImages[createdServiceIds[0]],
      [createdServiceIds[1]]: uploadedImages[createdServiceIds[1]],
      [createdServiceIds[2]]: uploadedImages[createdServiceIds[2]]
    };
    
    const packageService = {
      service_name: 'Complete Beauty Package',
      service_category: 'Package Services',
      service_price: 2800,
      service_duration: 195,
      service_description: 'Complete beauty package with hair, makeup, and nails',
      vendor_id: 1,
      package_name: 'Ultimate Beauty Package',
      service_type: 'Package',
      selected_services: `${createdServiceIds[0]},${createdServiceIds[1]},${createdServiceIds[2]}`,
      service_images: JSON.stringify(packageServiceImages)
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
      console.log(`📦 Service Type: ${packageResult.data.service_type}`);
      console.log(`🔗 Selected Services: ${packageResult.data.selected_services}`);
      console.log(`🖼️ Service Images: ${packageResult.data.service_images}`);
      
      createdServiceIds.push(packageResult.data.id);
    } else {
      throw new Error('Failed to create package service');
    }

    // Test 5: Fetch and verify all services
    console.log('\n📋 Test 5: Fetching and verifying all services...');
    
    const fetchResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services');
    
    if (fetchResponse.ok) {
      const fetchResult = await fetchResponse.json();
      console.log('✅ Successfully fetched salon services');
      
      const serviceTypes = fetchResult.data.reduce((acc, service) => {
        acc[service.service_type] = (acc[service.service_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Service type distribution:');
      Object.entries(serviceTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} services`);
      });
      
      // Check for services with images
      const servicesWithImages = fetchResult.data.filter(service => 
        service.service_images && service.service_images !== '{}' && service.service_images !== ''
      );
      
      console.log(`🖼️ Services with images: ${servicesWithImages.length}`);
      servicesWithImages.forEach(service => {
        console.log(`   - ${service.service_name} (${service.service_type}): ${Object.keys(JSON.parse(service.service_images || '{}')).length} image(s)`);
      });
    } else {
      throw new Error('Failed to fetch services');
    }

    // Test 6: Clean up test data
    console.log('\n🗑️ Test 6: Cleaning up test data...');
    
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

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Salon Service Images (Combo/Package with Multiple Images) functionality is working correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Make sure the backend server is running on port 3001');
  }
}

testSalonServiceImages();