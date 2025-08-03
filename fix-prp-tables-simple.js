/**
 * Simplified script to fix the PRP services tables issue
 * This version will rename tables and create a view instead of merging data
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

async function fixPRPTables() {
  console.log('Connecting to database...');
  console.log('Connection parameters:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
  
  try {
    console.log('Starting PRP services tables fix...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Check if both tables exist
    console.log('Checking if tables exist...');
    const dashboardTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      ) as exists;
    `);
    
    const packageTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      ) as exists;
    `);
    
    const dashboardTableExists = dashboardTableCheck.rows[0].exists;
    const packageTableExists = packageTableCheck.rows[0].exists;
    
    console.log('Table status:');
    console.log('- dashboard_prp_services exists:', dashboardTableExists);
    console.log('- package_services_from_dashboard exists:', packageTableExists);
    
    if (dashboardTableExists && packageTableExists) {
      // Both tables exist, we'll create backups and then create a view
      console.log('\nBoth tables exist. Creating backups and a view...');
      
      // Get count of records in both tables
      const dashboardCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
      const packageCount = await client.query('SELECT COUNT(*) FROM package_services_from_dashboard');
      
      console.log(`dashboard_prp_services record count: ${dashboardCount.rows[0].count}`);
      console.log(`package_services_from_dashboard record count: ${packageCount.rows[0].count}`);
      
      // Create backups of both tables
      console.log('\nCreating backups of both tables...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS dashboard_prp_services_backup AS 
        SELECT * FROM dashboard_prp_services;
      `);
      console.log('Backup created: dashboard_prp_services_backup');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS package_services_from_dashboard_backup AS 
        SELECT * FROM package_services_from_dashboard;
      `);
      console.log('Backup created: package_services_from_dashboard_backup');
      
      // Rename dashboard_prp_services to dashboard_prp_services_old
      console.log('\nRenaming dashboard_prp_services to dashboard_prp_services_old...');
      await client.query(`
        ALTER TABLE dashboard_prp_services RENAME TO dashboard_prp_services_old;
      `);
      console.log('Table renamed successfully.');
      
      // Rename package_services_from_dashboard to dashboard_prp_services
      console.log('\nRenaming package_services_from_dashboard to dashboard_prp_services...');
      await client.query(`
        ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;
      `);
      console.log('Table renamed successfully.');
      
      // Create a view for backward compatibility
      console.log('\nCreating a view for backward compatibility...');
      try {
        await client.query(`
          CREATE OR REPLACE VIEW dashboard_prp_services_view AS
          SELECT 
            id,
            icon_image,
            package_name as service_name,
            package_duration as service_duration,
            number_of_sessions as service_sessions,
            package_description as service_description,
            package_includes as included_services,
            package_price as service_price,
            vendor_id,
            created_at,
            updated_at,
            'PRP' as service_category
          FROM dashboard_prp_services_old;
        `);
        console.log('View created successfully.');
      } catch (error) {
        console.warn(`Warning: Could not create view: ${error.message}`);
      }
      
      console.log('\nFix completed successfully!');
    } else if (!dashboardTableExists && packageTableExists) {
      // Only package_services_from_dashboard exists, rename it to dashboard_prp_services
      console.log('\nOnly package_services_from_dashboard exists. Renaming it to dashboard_prp_services...');
      
      await client.query(`ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;`);
      
      console.log('Successfully renamed package_services_from_dashboard to dashboard_prp_services');
    } else if (dashboardTableExists && !packageTableExists) {
      // Only dashboard_prp_services exists, which is the expected state
      console.log('\nOnly dashboard_prp_services exists, which is the expected state.');
    } else {
      // Neither table exists, create dashboard_prp_services from scratch
      console.log('\nNeither table exists. Creating dashboard_prp_services table from scratch...');
      
      await client.query(`
        CREATE TABLE dashboard_prp_services (
          id SERIAL PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          service_category VARCHAR(100) NOT NULL DEFAULT 'PRP',
          service_price DECIMAL(10,2) NOT NULL,
          service_duration INTEGER,
          service_sessions INTEGER DEFAULT 1,
          service_description TEXT,
          included_services TEXT,
          vendor_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          icon_image TEXT
        );
      `);
      
      // Create indexes
      try {
        await client.query(`CREATE INDEX idx_dashboard_prp_services_vendor_id ON dashboard_prp_services(vendor_id)`);
      } catch (error) {
        console.warn(`Warning: Could not create vendor_id index: ${error.message}`);
      }
      
      try {
        await client.query(`CREATE INDEX idx_dashboard_prp_services_category ON dashboard_prp_services(service_category)`);
      } catch (error) {
        console.warn(`Warning: Could not create service_category index: ${error.message}`);
      }
      
      console.log('Successfully created dashboard_prp_services table');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully.');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error fixing PRP tables:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the function
console.log('Starting script execution...');

// Add a timeout to ensure we see the logs
setTimeout(() => {
  console.log('Script is still running after 2 seconds...');
}, 2000);

fixPRPTables()
  .then(() => {
    console.log('Script completed successfully.');
    console.log('PRP tables have been fixed!');
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