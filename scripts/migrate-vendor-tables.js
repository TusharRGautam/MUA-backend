#!/usr/bin/env node
/**
 * Migrate Vendor Business Tables
 * 
 * This script applies the vendor business tables migration to the database.
 * It creates tables for vendor business info, services, packages, transformations, gallery, and bookings.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

// Load environment variables if needed
require('dotenv').config();

async function runMigration() {
  console.log('Starting vendor business tables migration...');
  
  const client = await pool.connect();
  
  try {
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '../migrations/vendor_business_tables.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute the SQL script
    await client.query(sqlScript);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('✅ Vendor business tables migration completed successfully');
    
    // Verify the migration
    console.log('Verifying migration...');
    await verifyMigration(client);
    
    return true;
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    client.release();
  }
}

async function verifyMigration(client) {
  // List of tables that should have been created
  const tables = [
    'vendor_business_info',
    'vendor_single_services',
    'vendor_packages_services',
    'package_services',
    'vendor_transformations',
    'vendor_gallery_images',
    'vendor_bookings'
  ];
  
  // Check each table exists
  for (const table of tables) {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [table]);
    
    const exists = result.rows[0].exists;
    
    if (exists) {
      console.log(`✓ Table ${table} exists`);
    } else {
      console.error(`✗ Table ${table} does not exist`);
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(success => {
      if (success) {
        console.log('Migration process completed.');
      } else {
        console.error('Migration process failed.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during migration:', err);
      process.exit(1);
    })
    .finally(() => {
      // Close the pool to allow the script to exit
      pool.end();
    });
}

module.exports = { runMigration }; 