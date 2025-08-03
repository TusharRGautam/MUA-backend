/**
 * Verify Dashboard Services Script
 * Tests the API endpoints for all three dashboard service tables
 */

const { query } = require('./db');
const axios = require('axios');

async function verifyDashboardServices() {
  console.log('Starting dashboard services verification...');
  const API_BASE_URL = 'http://localhost:3000/api';

  try {
    // Get initial counts
    console.log('Initial record counts:');
    const salonCount = await query('SELECT COUNT(*) FROM dashboard_salon_services');
    console.log(`Salon Services: ${salonCount.rows[0].count}`);
    
    const prpCount = await query('SELECT COUNT(*) FROM dashboard_prp_services');
    console.log(`PRP Services: ${prpCount.rows[0].count}`);
    
    const diagnosticsCount = await query('SELECT COUNT(*) FROM dashboard_diagnostics_services');
    console.log(`Diagnostics Services: ${diagnosticsCount.rows[0].count}`);

    // Test salon services API
    console.log('\n=== Testing Salon Services API ===');
    try {
      const salonResponse = await axios.get(`${API_BASE_URL}/dashboard/salon-services`);
      console.log(`GET /salon-services: ${salonResponse.status} ${salonResponse.statusText}`);
      console.log(`Retrieved ${salonResponse.data.data.length} salon services`);
      
      // Show categories
      const categories = {};
      salonResponse.data.data.forEach(service => {
        categories[service.service_category] = (categories[service.service_category] || 0) + 1;
      });
      
      console.log('Categories:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} services`);
      });
    } catch (error) {
      console.error('Error testing salon services API:', error.message);
    }

    // Test PRP services API
    console.log('\n=== Testing PRP Services API ===');
    try {
      const prpResponse = await axios.get(`${API_BASE_URL}/dashboard/prp-services`);
      console.log(`GET /prp-services: ${prpResponse.status} ${prpResponse.statusText}`);
      console.log(`Retrieved ${prpResponse.data.data.length} PRP services`);
      
      // Show categories
      const categories = {};
      prpResponse.data.data.forEach(service => {
        categories[service.service_category] = (categories[service.service_category] || 0) + 1;
      });
      
      console.log('Categories:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} services`);
      });

      // Check included_services format
      const sampleService = prpResponse.data.data[0];
      console.log('\nSample PRP service included_services format:');
      console.log(typeof sampleService.included_services, ':', sampleService.included_services);
    } catch (error) {
      console.error('Error testing PRP services API:', error.message);
    }

    // Test diagnostics services API
    console.log('\n=== Testing Diagnostics Services API ===');
    try {
      const diagnosticsResponse = await axios.get(`${API_BASE_URL}/dashboard/diagnostics-services`);
      console.log(`GET /diagnostics-services: ${diagnosticsResponse.status} ${diagnosticsResponse.statusText}`);
      console.log(`Retrieved ${diagnosticsResponse.data.data.length} diagnostics services`);
      
      // Show categories
      const categories = {};
      diagnosticsResponse.data.data.forEach(service => {
        categories[service.service_category] = (categories[service.service_category] || 0) + 1;
      });
      
      console.log('Categories:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} services`);
      });

      // Check included_services format
      const sampleService = diagnosticsResponse.data.data[0];
      console.log('\nSample diagnostics service included_services format:');
      console.log(typeof sampleService.included_services, ':', sampleService.included_services);
    } catch (error) {
      console.error('Error testing diagnostics services API:', error.message);
    }

    console.log('\n✅ Dashboard services verification completed!');

  } catch (error) {
    console.error('❌ Error verifying dashboard services:', error);
    throw error;
  }
}

// Run the verification script
if (require.main === module) {
  verifyDashboardServices()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyDashboardServices };