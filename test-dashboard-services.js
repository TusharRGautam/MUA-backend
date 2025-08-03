/**
 * Test script to verify dashboard services API endpoints
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test data for each service type
const testSalonService = {
  service_name: 'Test Salon Service',
  service_category: 'Hair Care',
  service_price: 50.00,
  service_duration: 60,
  service_description: 'Test salon service description',
  vendor_id: 1
};

const testPrpService = {
  service_name: 'Test PRP Service',
  service_category: 'PRP Treatment',
  service_price: 200.00,
  service_duration: 90,
  service_sessions: 3,
  service_description: 'Test PRP service description',
  included_services: ['Consultation', 'Treatment'],
  vendor_id: 1
};

const testDiagnosticsService = {
  service_name: 'Test Diagnostics Service',
  service_category: 'Blood Test',
  service_price: 100.00,
  service_duration: 30,
  service_description: 'Test diagnostics service description',
  preparation_requirements: 'Fasting required',
  home_collection: 'yes',
  report_delivery_time: '24 hours',
  included_services: ['Sample collection', 'Report'],
  vendor_id: 1
};

// Helper function to make API calls
async function makeApiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status, result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.log('Error:', result.message);
    }
    
    return result;
  } catch (error) {
    console.log(`${method} ${endpoint}: ERROR -`, error.message);
    return { success: false, error: error.message };
  }
}

// Test all service endpoints
async function testAllServices() {
  console.log('Testing Dashboard Services API Endpoints\n');
  
  // Test Salon Services
  console.log('=== SALON SERVICES ===');
  await makeApiCall('/dashboard-services/salon-services', 'POST', testSalonService);
  await makeApiCall('/dashboard-services/salon-services', 'GET');
  
  // Test PRP Services
  console.log('\n=== PRP SERVICES ===');
  await makeApiCall('/dashboard-services/prp-services', 'POST', testPrpService);
  await makeApiCall('/dashboard-services/prp-services', 'GET');
  
  // Test Diagnostics Services
  console.log('\n=== DIAGNOSTICS SERVICES ===');
  await makeApiCall('/dashboard-services/diagnostics-services', 'POST', testDiagnosticsService);
  await makeApiCall('/dashboard-services/diagnostics-services', 'GET');
  
  console.log('\nAPI testing completed!');
}

// Run the tests
testAllServices().catch(console.error);