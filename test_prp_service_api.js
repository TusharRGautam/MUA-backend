/**
 * Test script to create a PRP service
 */

const axios = require('axios');

async function testPrpServiceApi() {
  try {
    console.log('Testing PRP Service API...');
    
    // Create a new PRP service
    const newService = {
      icon_image: 'https://example.com/icon.png',
      package_name: 'Test PRP Hair Treatment',
      package_duration: '60',
      number_of_sessions: 5,
      package_description: 'This is a test PRP hair treatment service',
      package_includes: JSON.stringify(['Consultation', 'Treatment', 'Follow-up']),
      package_price: 5000
    };
    
    console.log('Creating new PRP service...');
    console.log('Service data:', JSON.stringify(newService, null, 2));
    
    try {
      const createResponse = await axios.post('http://localhost:3001/api/prp-services', newService);
      console.log('Create response:', createResponse.data);
      
      if (createResponse.data.success) {
        const serviceId = createResponse.data.service.id;
        console.log(`Service created with ID: ${serviceId}`);
        
        // Get the created service
        console.log('Fetching the created service...');
        const getResponse = await axios.get(`http://localhost:3001/api/prp-services/${serviceId}`);
        console.log('Get response:', getResponse.data);
        
        // Get all services
        console.log('Fetching all PRP services...');
        const getAllResponse = await axios.get('http://localhost:3001/api/prp-services');
        console.log(`Found ${getAllResponse.data.services.length} services`);
        
        // Delete the test service
        console.log('Deleting the test service...');
        const deleteResponse = await axios.delete(`http://localhost:3001/api/prp-services/${serviceId}`);
        console.log('Delete response:', deleteResponse.data);
      }
    } catch (error) {
      console.error('API call error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. Is the server running on port 3001?');
      }
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    console.log('PRP Service API test completed!');
  } catch (error) {
    console.error('General error:', error.message);
  }
}

// Run the test
testPrpServiceApi();