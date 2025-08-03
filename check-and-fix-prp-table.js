/**
 * Script to check if the dashboard_prp_services table exists and create it if needed
 */

require('dotenv').config();
const { query } = require('./db');

async function checkAndFixPRPTable() {
  try {
    console.log('Checking PRP services table status...');
    
    // Check if dashboard_prp_services table exists
    const dashboardTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      ) as exists;
    `);
    
    // Check if package_services_from_dashboard table exists
    const packageTableCheck = await query(`
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
    
    if (!dashboardTableExists && !packageTableExists) {
      // Neither table exists, create dashboard_prp_services from scratch
      console.log('\nNeither table exists. Creating dashboard_prp_services table from scratch...');
      
      await query(`
        CREATE TABLE dashboard_prp_services (
          id SERIAL PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          service_category VARCHAR(100) NOT NULL,
          service_price DECIMAL(10,2) NOT NULL,
          service_duration INTEGER NOT NULL,
          service_sessions INTEGER NOT NULL DEFAULT 1,
          service_description TEXT,
          included_services TEXT,
          vendor_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_dashboard_prp_services_vendor_id ON dashboard_prp_services(vendor_id);
        CREATE INDEX idx_dashboard_prp_services_category ON dashboard_prp_services(service_category);
        
        COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP services created from dashboard';
      `);
      
      console.log('Successfully created dashboard_prp_services table');
      
    } else if (!dashboardTableExists && packageTableExists) {
      // Only package_services_from_dashboard exists, rename it back to dashboard_prp_services
      console.log('\nOnly package_services_from_dashboard exists. Renaming it to dashboard_prp_services...');
      
      await query(`ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;`);
      
      console.log('Successfully renamed package_services_from_dashboard to dashboard_prp_services');
      
    } else if (dashboardTableExists && packageTableExists) {
      // Both tables exist, this is unusual
      console.log('\nWARNING: Both tables exist. This is an unusual state.');
      console.log('Checking table structures to determine next steps...');
      
      // Get column info for both tables
      const dashboardColumns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      const packageColumns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
        ORDER BY ordinal_position;
      `);
      
      console.log('\ndashboard_prp_services columns:');
      console.table(dashboardColumns.rows);
      
      console.log('\npackage_services_from_dashboard columns:');
      console.table(packageColumns.rows);
      
      // Count records in both tables
      const dashboardCount = await query('SELECT COUNT(*) FROM dashboard_prp_services');
      const packageCount = await query('SELECT COUNT(*) FROM package_services_from_dashboard');
      
      console.log(`\ndashboard_prp_services record count: ${dashboardCount.rows[0].count}`);
      console.log(`package_services_from_dashboard record count: ${packageCount.rows[0].count}`);
      
      console.log('\nRecommendation: Manual intervention required to resolve this situation.');
      console.log('You may need to merge data from both tables or decide which one to keep.');
    } else {
      // dashboard_prp_services exists, which is the expected state
      console.log('\nThe dashboard_prp_services table exists as expected.');
      
      // Check if the table has the expected columns
      const columns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      console.table(columns.rows);
      
      // Check for records
      const countResult = await query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`\nTotal records: ${countResult.rows[0].count}`);
      
      // Get sample records if any exist
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleRecords = await query('SELECT * FROM dashboard_prp_services LIMIT 3');
        console.log('\nSample records:');
        console.log(JSON.stringify(sampleRecords.rows, null, 2));
      }
      
      // Check if the expected columns for the API exist
      const expectedColumns = [
        'service_name',
        'service_category',
        'service_price',
        'service_duration',
        'service_sessions',
        'service_description',
        'included_services',
        'vendor_id'
      ];
      
      const actualColumns = columns.rows.map(row => row.column_name);
      
      console.log('\nChecking for expected columns:');
      let missingColumns = [];
      
      expectedColumns.forEach(column => {
        if (actualColumns.includes(column)) {
          console.log(`✓ Column '${column}' exists`);
        } else {
          console.log(`✗ Column '${column}' is MISSING`);
          missingColumns.push(column);
        }
      });
      
      if (missingColumns.length > 0) {
        console.log('\nWARNING: Missing columns detected!');
        console.log('This could cause API calls to fail when trying to insert data.');
        console.log('The following columns need to be added to the dashboard_prp_services table:');
        console.log(missingColumns.join(', '));
        
        // Offer to add missing columns
        console.log('\nWould you like to add these missing columns? (This would require modifying this script)');
      }
    }
    
  } catch (error) {
    console.error('Error checking and fixing PRP table:', error);
  }
}

checkAndFixPRPTable();