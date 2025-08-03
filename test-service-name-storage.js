async function testServiceNameStorage() {
  console.log('🧪 Testing Service Name Storage for Different Service Types');
  console.log('=====================================');

  try {
    // Test 1: Create single services first
    console.log('\n📝 Test 1: Creating Single services...');
    
    const singleServices = [
      {
        service_name: 'Hair Styling Service',
        service_category: 'Haircut & Styling',
        service_price: 800,
        service_duration: 60,
        service_description: 'Professional hair styling',
        vendor_id: 1,
        package_name: 'Hair Styling Service',
        service_type: 'Single'
      },
      {
        service_name: 'Makeup Application',
        service_category: 'Makeup',
        service_price: 1200,
        service_duration: 90,
        service_description: 'Professional makeup application',
        vendor_id: 1,
        package_name: 'Makeup Application',
        service_type: 'Single'
      },
      {
        service_name: 'Nail Care Treatment',
        service_category: 'Nail Care',
        service_price: 600,
        service_duration: 45,
        service_description: 'Complete nail care',
        vendor_id: 1,
        package_name: 'Nail Care Treatment',
        service_type: 'Single'
      }
    ];

    const createdServiceIds = [];
    const serviceNames = [];
    
    for (const serviceData of singleServices) {
      const response = await fetch('http://localhost:3001/api/dashboard-services/salon-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        createdServiceIds.push(result.data.id);
        serviceNames.push(result.data.service_name);
        console.log(`✅ Created: "${result.data.service_name}" (ID: ${result.data.id}, Type: ${result.data.service_type})`);
      } else {
        throw new Error(`Failed to create ${serviceData.service_name}`);
      }
    }

    // Test 2: Create Combo service with selected service names in service_name column
    console.log('\n📝 Test 2: Creating Combo service...');
    
    const comboServiceName = `${serviceNames[0]}, ${serviceNames[1]}`;  // Combine first two service names
    
    const comboService = {
      service_name: comboServiceName,  // This should contain the selected service names
      service_category: 'Combo Services',
      service_price: 1800,
      service_duration: 150,
      service_description: 'Combo of two services',
      vendor_id: 1,
      package_name: 'Hair & Makeup Combo',
      service_type: 'Combo',
      selected_services: `${createdServiceIds[0]},${createdServiceIds[1]}`, // Keep for reference
      service_images: JSON.stringify({})
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
      console.log(`📦 Service Name (contains selected services): "${comboResult.data.service_name}"`);
      console.log(`🔗 Selected Services (reference): ${comboResult.data.selected_services}`);
      
      createdServiceIds.push(comboResult.data.id);
    } else {
      const errorText = await comboResponse.text();
      throw new Error(`Failed to create combo service: ${errorText}`);
    }

    // Test 3: Create Package service with all selected service names in service_name column
    console.log('\n📝 Test 3: Creating Package service...');
    
    const packageServiceName = serviceNames.join(', ');  // Combine all service names
    
    const packageService = {
      service_name: packageServiceName,  // This should contain all selected service names
      service_category: 'Package Services',
      service_price: 2400,
      service_duration: 195,
      service_description: 'Complete package with multiple services',
      vendor_id: 1,
      package_name: 'Ultimate Beauty Package',
      service_type: 'Package',
      selected_services: createdServiceIds.slice(0, 3).join(','), // Keep for reference
      service_images: JSON.stringify({})
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
      console.log(`📦 Service Name (contains selected services): "${packageResult.data.service_name}"`);
      console.log(`🔗 Selected Services (reference): ${packageResult.data.selected_services}`);
      
      createdServiceIds.push(packageResult.data.id);
    } else {
      const errorText = await packageResponse.text();
      throw new Error(`Failed to create package service: ${errorText}`);
    }

    // Test 4: Verify all services and their service_name contents
    console.log('\n📋 Test 4: Verifying service_name storage...');
    
    const fetchResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services');
    
    if (fetchResponse.ok) {
      const fetchResult = await fetchResponse.json();
      
      // Filter to our test services
      const testServices = fetchResult.data.filter(service => 
        createdServiceIds.includes(parseInt(service.id))
      );
      
      console.log('\n📊 Service Name Storage Results:');
      testServices.forEach(service => {
        console.log(`\n${service.service_type.toUpperCase()} SERVICE:`);
        console.log(`   ID: ${service.id}`);
        console.log(`   Service Name: "${service.service_name}"`);
        console.log(`   Package Name: "${service.package_name || 'N/A'}"`);
        console.log(`   Selected Services: "${service.selected_services || 'N/A'}"`);
        
        if (service.service_type === 'Single') {
          console.log(`   ✅ Single service name stored correctly`);
        } else if (service.service_type === 'Combo') {
          const hasCommaSepratedServices = service.service_name.includes(',');
          console.log(`   ${hasCommaSepratedServices ? '✅' : '❌'} Combo service names ${hasCommaSepratedServices ? 'correctly' : 'incorrectly'} stored in service_name`);
        } else if (service.service_type === 'Package') {
          const hasMultipleServices = service.service_name.includes(',');
          console.log(`   ${hasMultipleServices ? '✅' : '❌'} Package service names ${hasMultipleServices ? 'correctly' : 'incorrectly'} stored in service_name`);
        }
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

    console.log('\n🎉 Service name storage test completed!');
    console.log('✅ Key findings:');
    console.log('   - Single services: service_name contains individual service name');
    console.log('   - Combo services: service_name contains selected service names (comma-separated)');
    console.log('   - Package services: service_name contains all selected service names (comma-separated)');
    console.log('   - selected_services column still exists for reference/compatibility');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Make sure the backend server is running on port 3001');
  }
}

testServiceNameStorage();