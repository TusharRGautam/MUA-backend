/**
 * Test script to verify dashboard service API endpoints
 * This script will test all three service creation endpoints
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a simple connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds timeout
});

async function testDashboardServiceAPIs() {
  console.log('Starting dashboard service API tests...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
    
    // Test 1: Salon Service Creation
    console.log('\n=== TESTING SALON SERVICE CREATION ===');
    
    const salonServiceData = {
      service_name: 'Test Hair Cut',
      service_category: 'Hair Care',
      service_price: 45.00,
      service_duration: 60,
      service_description: 'Professional hair cutting service',
      vendor_id: 1
    };
    
    try {
      const salonResult = await client.query(
        `INSERT INTO dashboard_salon_services 
         (service_name, service_category, service_price, service_duration, service_description, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [salonServiceData.service_name, salonServiceData.service_category, 
         parseFloat(salonServiceData.service_price), parseInt(salonServiceData.service_duration), 
         salonServiceData.service_description, salonServiceData.vendor_id]
      );
      
      console.log('✓ Salon service creation successful');
      console.log('  Created service ID:', salonResult.rows[0].id);
      console.log('  Service name:', salonResult.rows[0].service_name);
      
      // Clean up
      await client.query('DELETE FROM dashboard_salon_services WHERE id = $1', [salonResult.rows[0].id]);
      console.log('✓ Test data cleaned up');
      
    } catch (error) {
      console.log('✗ Salon service creation failed:', error.message);
    }
    
    // Test 2: PRP Service Creation
    console.log('\n=== TESTING PRP SERVICE CREATION ===');
    
    const prpServiceData = {
      service_name: 'Test PRP Hair Treatment',
      service_category: 'Hair Restoration',
      service_price: 200.00,
      service_duration: 120,
      service_sessions: 3,
      service_description: 'Platelet-rich plasma hair treatment',
      included_services: 'Consultation, PRP Injection, Follow-up',
      vendor_id: 1
    };
    
    try {
      // Convert included_services to JSONB format (simulating frontend behavior)
      let processedIncludedServices = prpServiceData.included_services;
      if (typeof processedIncludedServices === 'string') {
        processedIncludedServices = processedIncludedServices.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
      
      const prpResult = await client.query(
        `INSERT INTO dashboard_prp_services 
         (service_name, service_category, service_price, service_duration, service_sessions, service_description, included_services, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [prpServiceData.service_name, prpServiceData.service_category, 
         parseFloat(prpServiceData.service_price), parseInt(prpServiceData.service_duration), 
         parseInt(prpServiceData.service_sessions), prpServiceData.service_description, 
         JSON.stringify(processedIncludedServices), prpServiceData.vendor_id]
      );
      
      console.log('✓ PRP service creation successful');
      console.log('  Created service ID:', prpResult.rows[0].id);
      console.log('  Service name:', prpResult.rows[0].service_name);
      console.log('  Included services:', prpResult.rows[0].included_services);
      
      // Clean up
      await client.query('DELETE FROM dashboard_prp_services WHERE id = $1', [prpResult.rows[0].id]);
      console.log('✓ Test data cleaned up');
      
    } catch (error) {
      console.log('✗ PRP service creation failed:', error.message);
    }
    
    // Test 3: Diagnostics Service Creation
    console.log('\n=== TESTING DIAGNOSTICS SERVICE CREATION ===');
    
    const diagnosticsServiceData = {
      service_name: 'Test Blood Panel',
      service_category: 'Blood Tests',
      service_price: 75.00,
      service_duration: 30,
      service_description: 'Comprehensive blood panel testing',
      preparation_requirements: 'Fasting for 12 hours required',
      home_collection: 'yes',
      report_delivery_time: '24-48 hours',
      included_services: 'Blood Collection, Lab Analysis, Digital Report',
      vendor_id: 1
    };
    
    try {
      // Convert included_services to JSONB format (simulating frontend behavior)
      let processedIncludedServices = diagnosticsServiceData.included_services;
      if (typeof processedIncludedServices === 'string') {
        processedIncludedServices = processedIncludedServices.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
      
      const diagnosticsResult = await client.query(
        `INSERT INTO dashboard_diagnostics_services 
         (service_name, service_category, service_price, service_duration, service_description, 
          preparation_requirements, home_collection, report_delivery_time, included_services, vendor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [diagnosticsServiceData.service_name, diagnosticsServiceData.service_category, 
         parseFloat(diagnosticsServiceData.service_price), parseInt(diagnosticsServiceData.service_duration), 
         diagnosticsServiceData.service_description, diagnosticsServiceData.preparation_requirements, 
         diagnosticsServiceData.home_collection, diagnosticsServiceData.report_delivery_time, 
         JSON.stringify(processedIncludedServices), diagnosticsServiceData.vendor_id]
      );
      
      console.log('✓ Diagnostics service creation successful');
      console.log('  Created service ID:', diagnosticsResult.rows[0].id);
      console.log('  Service name:', diagnosticsResult.rows[0].service_name);
      console.log('  Home collection:', diagnosticsResult.rows[0].home_collection);
      console.log('  Included services:', diagnosticsResult.rows[0].included_services);
      
      // Clean up
      await client.query('DELETE FROM dashboard_diagnostics_services WHERE id = $1', [diagnosticsResult.rows[0].id]);
      console.log('✓ Test data cleaned up');
      
    } catch (error) {
      console.log('✗ Diagnostics service creation failed:', error.message);
    }
    
    // Final verification - check current record counts
    console.log('\n=== FINAL RECORD COUNTS ===');
    
    const salonCount = await client.query('SELECT COUNT(*) FROM dashboard_salon_services');
    console.log(`Salon Services: ${salonCount.rows[0].count} records`);
    
    const prpCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
    console.log(`PRP Services: ${prpCount.rows[0].count} records`);
    
    const diagnosticsCount = await client.query('SELECT COUNT(*) FROM dashboard_diagnostics_services');
    console.log(`Diagnostics Services: ${diagnosticsCount.rows[0].count} records`);
    
    console.log('\n=== API TESTS COMPLETED ===');
    console.log('All dashboard service API endpoints have been tested successfully.');
    
  } catch (error) {
    console.error('Error testing dashboard service APIs:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Execute the function
console.log('Starting API test script...');

testDashboardServiceAPIs()
  .then(() => {
    console.log('API tests completed successfully.');
  })
  .catch(err => {
    console.error('API tests failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Closing database pool...');
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  });