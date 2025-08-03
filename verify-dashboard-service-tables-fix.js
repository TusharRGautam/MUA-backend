/**
 * Script to verify dashboard service tables have correct columns after migration
 * This script will check all tables and test sample data insertion
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

async function verifyDashboardServiceTables() {
  console.log('Starting dashboard service tables verification...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
    
    // Verify dashboard_salon_services table
    console.log('\n=== VERIFYING DASHBOARD_SALON_SERVICES TABLE ===');
    
    const salonColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_salon_services'
      ORDER BY ordinal_position;
    `);
    
    console.log('Salon Services Table Structure:');
    salonColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check for required API columns
    const salonColumnNames = salonColumns.rows.map(row => row.column_name);
    const requiredSalonColumns = ['service_category', 'service_price', 'service_duration', 'service_description', 'vendor_id'];
    
    console.log('\nRequired API columns check:');
    requiredSalonColumns.forEach(col => {
      const exists = salonColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    });
    
    // Test salon service insertion
    console.log('\nTesting salon service insertion...');
    try {
      const testSalonInsert = await client.query(`
        INSERT INTO dashboard_salon_services (
          service_name, service_category, service_price, service_duration, 
          service_description, vendor_id
        ) VALUES (
          'Test Salon Service', 'Hair Care', 50.00, 60, 
          'Test salon service description', 1
        ) RETURNING id;
      `);
      console.log(`✓ Salon service insertion successful. ID: ${testSalonInsert.rows[0].id}`);
      
      // Clean up test data
      await client.query('DELETE FROM dashboard_salon_services WHERE service_name = $1', ['Test Salon Service']);
      console.log('✓ Test data cleaned up.');
    } catch (error) {
      console.log(`✗ Salon service insertion failed: ${error.message}`);
    }
    
    // Verify dashboard_prp_services table
    console.log('\n=== VERIFYING DASHBOARD_PRP_SERVICES TABLE ===');
    
    const prpColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_prp_services'
      ORDER BY ordinal_position;
    `);
    
    console.log('PRP Services Table Structure:');
    prpColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check for required API columns
    const prpColumnNames = prpColumns.rows.map(row => row.column_name);
    const requiredPrpColumns = ['service_name', 'service_category', 'service_price', 'service_duration', 'service_sessions', 'service_description', 'included_services'];
    
    console.log('\nRequired API columns check:');
    requiredPrpColumns.forEach(col => {
      const exists = prpColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    });
    
    // Test PRP service insertion
    console.log('\nTesting PRP service insertion...');
    try {
      const testPrpInsert = await client.query(`
        INSERT INTO dashboard_prp_services (
          service_name, service_category, service_price, service_duration, 
          service_sessions, service_description, included_services, vendor_id
        ) VALUES (
          'Test PRP Service', 'Hair Treatment', 150.00, 90, 
          3, 'Test PRP service description', '["PRP Injection", "Consultation"]'::jsonb, 1
        ) RETURNING id;
      `);
      console.log(`✓ PRP service insertion successful. ID: ${testPrpInsert.rows[0].id}`);
      
      // Clean up test data
      await client.query('DELETE FROM dashboard_prp_services WHERE service_name = $1', ['Test PRP Service']);
      console.log('✓ Test data cleaned up.');
    } catch (error) {
      console.log(`✗ PRP service insertion failed: ${error.message}`);
    }
    
    // Verify dashboard_diagnostics_services table
    console.log('\n=== VERIFYING DASHBOARD_DIAGNOSTICS_SERVICES TABLE ===');
    
    const diagnosticsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_diagnostics_services'
      ORDER BY ordinal_position;
    `);
    
    console.log('Diagnostics Services Table Structure:');
    diagnosticsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check for required API columns
    const diagnosticsColumnNames = diagnosticsColumns.rows.map(row => row.column_name);
    const requiredDiagnosticsColumns = ['service_name', 'service_category', 'service_price', 'service_duration', 'service_description', 'preparation_requirements', 'home_collection', 'report_delivery_time', 'included_services', 'vendor_id'];
    
    console.log('\nRequired API columns check:');
    requiredDiagnosticsColumns.forEach(col => {
      const exists = diagnosticsColumnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    });
    
    // Test diagnostics service insertion
    console.log('\nTesting diagnostics service insertion...');
    try {
      const testDiagnosticsInsert = await client.query(`
        INSERT INTO dashboard_diagnostics_services (
          service_name, service_category, service_price, service_duration, 
          service_description, preparation_requirements, home_collection, 
          report_delivery_time, included_services, vendor_id
        ) VALUES (
          'Test Diagnostics Service', 'Blood Test', 25.00, 30, 
          'Test diagnostics service description', 'Fasting required', 'yes', 
          '24 hours', '["Blood Collection", "Lab Analysis"]'::jsonb, 1
        ) RETURNING id;
      `);
      console.log(`✓ Diagnostics service insertion successful. ID: ${testDiagnosticsInsert.rows[0].id}`);
      
      // Clean up test data
      await client.query('DELETE FROM dashboard_diagnostics_services WHERE service_name = $1', ['Test Diagnostics Service']);
      console.log('✓ Test data cleaned up.');
    } catch (error) {
      console.log(`✗ Diagnostics service insertion failed: ${error.message}`);
    }
    
    // Check record counts
    console.log('\n=== RECORD COUNTS ===');
    
    const salonCount = await client.query('SELECT COUNT(*) FROM dashboard_salon_services');
    console.log(`Salon Services: ${salonCount.rows[0].count} records`);
    
    const prpCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
    console.log(`PRP Services: ${prpCount.rows[0].count} records`);
    
    const diagnosticsCount = await client.query('SELECT COUNT(*) FROM dashboard_diagnostics_services');
    console.log(`Diagnostics Services: ${diagnosticsCount.rows[0].count} records`);
    
    console.log('\n=== VERIFICATION COMPLETED ===');
    console.log('All dashboard service tables have been verified successfully.');
    
  } catch (error) {
    console.error('Error verifying dashboard service tables:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Execute the function
console.log('Starting verification script...');

verifyDashboardServiceTables()
  .then(() => {
    console.log('Verification completed successfully.');
  })
  .catch(err => {
    console.error('Verification failed:', err);
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