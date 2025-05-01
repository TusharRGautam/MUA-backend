/**
 * Migration script to add missing columns to the vendor_single_services table
 * Run with: node migrations/add_missing_columns.js
 */

const { pool, query } = require('../db');

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');

    // Check if vendor_single_services table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_single_services'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating vendor_single_services table...');
      
      // Create the table if it doesn't exist
      await query(`
        CREATE TABLE vendor_single_services (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price NUMERIC(10, 2) NOT NULL,
          duration INTEGER,
          type VARCHAR(50) DEFAULT 'standard',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('vendor_single_services table created');
    } else {
      // Check for missing columns
      const columns = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vendor_single_services'
      `);
      
      const columnNames = columns.rows.map(col => col.column_name);
      console.log('Existing columns:', columnNames);
      
      // Add description column if missing
      if (!columnNames.includes('description')) {
        console.log('Adding description column...');
        await query(`ALTER TABLE vendor_single_services ADD COLUMN description TEXT`);
      }
      
      // Add duration column if missing
      if (!columnNames.includes('duration')) {
        console.log('Adding duration column...');
        await query(`ALTER TABLE vendor_single_services ADD COLUMN duration INTEGER`);
      }
      
      // Add type column if missing
      if (!columnNames.includes('type')) {
        console.log('Adding type column...');
        await query(`ALTER TABLE vendor_single_services ADD COLUMN type VARCHAR(50) DEFAULT 'standard'`);
      }
      
      console.log('vendor_single_services table updated');
    }
    
    // Check for package tables
    const packageTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_packages_services'
      )
    `);
    
    if (!packageTableExists.rows[0].exists) {
      console.log('Creating vendor_packages_services table...');
      
      // Create the packages table
      await query(`
        CREATE TABLE vendor_packages_services (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create the package services table
      await query(`
        CREATE TABLE package_services (
          id SERIAL PRIMARY KEY,
          package_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_package
            FOREIGN KEY(package_id) 
            REFERENCES vendor_packages_services(id)
            ON DELETE CASCADE
        )
      `);
      
      console.log('Package tables created');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the migration
migrateDatabase(); 