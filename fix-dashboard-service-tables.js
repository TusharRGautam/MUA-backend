/**
 * Script to fix dashboard service tables column mismatches
 * This script will add the missing columns that the API expects
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

async function fixDashboardServiceTables() {
  console.log('Starting dashboard service tables fix...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
    
    await client.query('BEGIN');
    console.log('Transaction started.');
    
    // Fix dashboard_salon_services table
    console.log('\n=== FIXING DASHBOARD_SALON_SERVICES TABLE ===');
    
    // Check current columns in dashboard_salon_services
    const salonColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_salon_services'
      ORDER BY ordinal_position;
    `);
    
    const salonColumnNames = salonColumns.rows.map(row => row.column_name);
    console.log('Current salon table columns:', salonColumnNames.join(', '));
    
    // Expected columns for salon services API
    const expectedSalonColumns = {
      'service_category': 'VARCHAR(255)',
      'service_price': 'NUMERIC(10,2)',
      'service_duration': 'INTEGER',
      'service_description': 'TEXT',
      'vendor_id': 'INTEGER'
    };
    
    // Add missing columns to salon table
    for (const [columnName, dataType] of Object.entries(expectedSalonColumns)) {
      if (!salonColumnNames.includes(columnName)) {
        console.log(`Adding missing column '${columnName}' to dashboard_salon_services...`);
        await client.query(`ALTER TABLE dashboard_salon_services ADD COLUMN ${columnName} ${dataType};`);
      } else {
        console.log(`Column '${columnName}' already exists in dashboard_salon_services.`);
      }
    }
    
    // Update data mapping for salon table (map existing columns to new ones)
    if (salonColumnNames.includes('service_categories') && !salonColumnNames.includes('service_category')) {
      console.log('Mapping service_categories to service_category...');
      await client.query(`UPDATE dashboard_salon_services SET service_category = service_categories WHERE service_category IS NULL;`);
    }
    
    if (salonColumnNames.includes('price') && !salonColumnNames.includes('service_price')) {
      console.log('Mapping price to service_price...');
      await client.query(`UPDATE dashboard_salon_services SET service_price = price WHERE service_price IS NULL;`);
    }
    
    if (salonColumnNames.includes('duration') && !salonColumnNames.includes('service_duration')) {
      console.log('Mapping duration to service_duration...');
      await client.query(`UPDATE dashboard_salon_services SET service_duration = duration WHERE service_duration IS NULL;`);
    }
    
    if (salonColumnNames.includes('description') && !salonColumnNames.includes('service_description')) {
      console.log('Mapping description to service_description...');
      await client.query(`UPDATE dashboard_salon_services SET service_description = description WHERE service_description IS NULL;`);
    }
    
    // Fix dashboard_prp_services table
    console.log('\n=== FIXING DASHBOARD_PRP_SERVICES TABLE ===');
    
    // Check current columns in dashboard_prp_services
    const prpColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_prp_services'
      ORDER BY ordinal_position;
    `);
    
    const prpColumnNames = prpColumns.rows.map(row => row.column_name);
    console.log('Current PRP table columns:', prpColumnNames.join(', '));
    
    // Expected columns for PRP services API
    const expectedPrpColumns = {
      'service_name': 'VARCHAR(255)',
      'service_category': 'VARCHAR(255)',
      'service_price': 'NUMERIC(10,2)',
      'service_duration': 'INTEGER',
      'service_sessions': 'INTEGER',
      'service_description': 'TEXT',
      'included_services': 'JSONB'
    };
    
    // Add missing columns to PRP table
    for (const [columnName, dataType] of Object.entries(expectedPrpColumns)) {
      if (!prpColumnNames.includes(columnName)) {
        console.log(`Adding missing column '${columnName}' to dashboard_prp_services...`);
        await client.query(`ALTER TABLE dashboard_prp_services ADD COLUMN ${columnName} ${dataType};`);
      } else {
        console.log(`Column '${columnName}' already exists in dashboard_prp_services.`);
      }
    }
    
    // Update data mapping for PRP table
    if (prpColumnNames.includes('package_name') && !prpColumnNames.includes('service_name')) {
      console.log('Mapping package_name to service_name...');
      await client.query(`UPDATE dashboard_prp_services SET service_name = package_name WHERE service_name IS NULL;`);
    }
    
    if (prpColumnNames.includes('category') && !prpColumnNames.includes('service_category')) {
      console.log('Mapping category to service_category...');
      await client.query(`UPDATE dashboard_prp_services SET service_category = category WHERE service_category IS NULL;`);
    }
    
    if (prpColumnNames.includes('price') && !prpColumnNames.includes('service_price')) {
      console.log('Mapping price to service_price...');
      await client.query(`UPDATE dashboard_prp_services SET service_price = price WHERE service_price IS NULL;`);
    }
    
    if (prpColumnNames.includes('duration') && !prpColumnNames.includes('service_duration')) {
      console.log('Mapping duration to service_duration...');
      await client.query(`UPDATE dashboard_prp_services SET service_duration = duration WHERE service_duration IS NULL;`);
    }
    
    if (prpColumnNames.includes('description') && !prpColumnNames.includes('service_description')) {
      console.log('Mapping description to service_description...');
      await client.query(`UPDATE dashboard_prp_services SET service_description = description WHERE service_description IS NULL;`);
    }
    
    if (prpColumnNames.includes('service_names') && !prpColumnNames.includes('included_services')) {
      console.log('Mapping service_names to included_services...');
      await client.query(`UPDATE dashboard_prp_services SET included_services = service_names WHERE included_services IS NULL;`);
    }
    
    // Add default service_sessions if not present
    if (!prpColumnNames.includes('service_sessions')) {
      console.log('Setting default service_sessions to 1...');
      await client.query(`UPDATE dashboard_prp_services SET service_sessions = 1 WHERE service_sessions IS NULL;`);
    }
    
    // Fix dashboard_diagnostics_services table
    console.log('\n=== FIXING DASHBOARD_DIAGNOSTICS_SERVICES TABLE ===');
    
    // Check current columns in dashboard_diagnostics_services
    const diagnosticsColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_diagnostics_services'
      ORDER BY ordinal_position;
    `);
    
    const diagnosticsColumnNames = diagnosticsColumns.rows.map(row => row.column_name);
    console.log('Current diagnostics table columns:', diagnosticsColumnNames.join(', '));
    
    // Expected columns for diagnostics services API
    const expectedDiagnosticsColumns = {
      'service_name': 'VARCHAR(255)',
      'service_category': 'VARCHAR(255)',
      'service_price': 'NUMERIC(10,2)',
      'service_duration': 'INTEGER',
      'service_description': 'TEXT',
      'preparation_requirements': 'TEXT',
      'home_collection': 'VARCHAR(10) DEFAULT \'no\'',
      'report_delivery_time': 'VARCHAR(255)',
      'included_services': 'JSONB',
      'vendor_id': 'INTEGER'
    };
    
    // Add missing columns to diagnostics table
    for (const [columnName, dataType] of Object.entries(expectedDiagnosticsColumns)) {
      if (!diagnosticsColumnNames.includes(columnName)) {
        console.log(`Adding missing column '${columnName}' to dashboard_diagnostics_services...`);
        await client.query(`ALTER TABLE dashboard_diagnostics_services ADD COLUMN ${columnName} ${dataType};`);
      } else {
        console.log(`Column '${columnName}' already exists in dashboard_diagnostics_services.`);
      }
    }
    
    // Update data mapping for diagnostics table (if there are existing columns to map)
    // Since this table is empty, we don't need to map existing data
    
    await client.query('COMMIT');
    console.log('\nTransaction committed successfully.');
    
    console.log('\n=== DASHBOARD SERVICE TABLES FIX COMPLETED ===');
    console.log('All tables now have the correct columns expected by the API.');
    
  } catch (error) {
    console.error('Error fixing dashboard service tables:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back.');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Execute the function
console.log('Starting script execution...');

fixDashboardServiceTables()
  .then(() => {
    console.log('Script completed successfully.');
  })
  .catch(err => {
    console.error('Script failed:', err);
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
    // Force exit after a delay to ensure all logs are printed
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(0);
    }, 1000);
  });