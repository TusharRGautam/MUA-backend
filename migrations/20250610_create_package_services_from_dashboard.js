/**
 * Migration to create package_services_from_dashboard table
 * Date: 2025-06-10
 * 
 * This table stores packages created from the dashboard
 */

const { query } = require('../db');

async function up() {
  try {
    console.log('Creating package_services_from_dashboard table...');
    
    // Check if table already exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'package_services_from_dashboard'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('Table package_services_from_dashboard already exists, skipping creation.');
      return;
    }
    
    // Create the table
    await query(`
      CREATE TABLE package_services_from_dashboard (
        id SERIAL PRIMARY KEY,
        icon_image TEXT,
        package_name VARCHAR(255) NOT NULL,
        gender VARCHAR(50) NOT NULL,
        service_names JSONB NOT NULL,
        category VARCHAR(100),
        price NUMERIC NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT,
        product_names JSONB,
        things_to_know TEXT,
        reason TEXT,
        specific_todo TEXT,
        vendor_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('Successfully created package_services_from_dashboard table');
  } catch (error) {
    console.error('Error creating package_services_from_dashboard table:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('Dropping package_services_from_dashboard table...');
    
    await query(`
      DROP TABLE IF EXISTS package_services_from_dashboard;
    `);
    
    console.log('Successfully dropped package_services_from_dashboard table');
  } catch (error) {
    console.error('Error dropping package_services_from_dashboard table:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 