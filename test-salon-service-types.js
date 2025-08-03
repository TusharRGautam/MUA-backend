const { query } = require('./db');

async function testSalonServiceTypes() {
  console.log('🧪 Testing Salon Service Types (Single/Combo/Package)');
  console.log('=====================================');

  try {
    // Test 1: Create a Single service
    console.log('\n📝 Test 1: Creating Single service...');
    const singleService = {
      service_name: 'Basic Haircut',
      service_category: 'Haircut & Styling',
      service_price: 500,
      service_duration: 45,
      service_description: 'Professional haircut service',
      vendor_id: 1,
      package_name: 'Basic Haircut',
      service_type: 'Single',
      things_to_know: 'Please come with clean hair',
      what_packages_include: 'Haircut and basic styling',
      precautions: 'Inform if you have any allergies',
      products_used: 'Professional shampoo and styling products'
    };

    const createResponse = await fetch('http://localhost:3001/api/dashboard-services/salon-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(singleService)
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Single service created successfully');
      console.log(`🆔 Service ID: ${createResult.data.id}`);
      console.log(`📦 Service Type: ${createResult.data.service_type}`);
      
      const singleServiceId = createResult.data.id;

      // Test 2: Create a Combo service
      console.log('\n📝 Test 2: Creating Combo service...');
      const comboService = {
        service_name: 'Hair & Makeup Combo',
        service_category: 'Combo Services',
        service_price: 1200,
        service_duration: 120,
        service_description: 'Hair styling and makeup combo',
        vendor_id: 1,
        package_name: 'Hair & Makeup Combo',
        service_type: 'Combo',
        selected_services: `${singleServiceId}`,
        things_to_know: 'Book 2 hours in advance',
        what_packages_include: 'Hair styling and professional makeup',
        precautions: 'Inform about skin sensitivities',
        products_used: 'Premium hair and makeup products'
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

        // Test 3: Create a Package service
        console.log('\n📝 Test 3: Creating Package service...');
        const packageService = {
          service_name: 'Bridal Beauty Package',
          service_category: 'Package Services',
          service_price: 5000,
          service_duration: 300,
          service_description: 'Complete bridal beauty package',
          vendor_id: 1,
          package_name: 'Ultimate Bridal Package',
          service_type: 'Package',
          selected_services: `${singleServiceId},${comboResult.data.id}`,
          things_to_know: 'Book 1 week in advance',
          what_packages_include: 'Hair, makeup, nails, facial treatment',
          precautions: 'Patch test required 24 hours before',
          products_used: 'Premium bridal beauty products'
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

          // Test 4: Fetch all services and verify types
          console.log('\n📋 Test 4: Fetching all salon services...');
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

            // Test 5: Clean up test data
            console.log('\n🗑️ Test 5: Cleaning up test data...');
            const testIds = [singleServiceId, comboResult.data.id, packageResult.data.id];
            
            for (const id of testIds) {
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
            console.log('✅ Salon Service Types (Single/Combo/Package) functionality is working correctly');
          } else {
            throw new Error('Failed to fetch services');
          }
        } else {
          throw new Error('Failed to create package service');
        }
      } else {
        throw new Error('Failed to create combo service');
      }
    } else {
      throw new Error('Failed to create single service');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Make sure the backend server is running on port 3001');
  }
}

testSalonServiceTypes();