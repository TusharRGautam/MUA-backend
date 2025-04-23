#!/usr/bin/env node
/**
 * Migrate Vendor Performance Tables
 * 
 * This script applies the vendor performance metrics and gallery updates to the database.
 * It tracks key business metrics and enhances the gallery functionality.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

// Load environment variables if needed
require('dotenv').config();

async function runMigration() {
  console.log('Starting vendor performance tables migration...');
  
  const client = await pool.connect();
  
  try {
    // Read the SQL migration files
    const performanceFilePath = path.join(__dirname, '../migrations/vendor_performance_metrics.sql');
    const galleryUpdateFilePath = path.join(__dirname, '../migrations/vendor_gallery_update.sql');
    
    const performanceScript = fs.readFileSync(performanceFilePath, 'utf8');
    const galleryUpdateScript = fs.readFileSync(galleryUpdateFilePath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute the performance metrics SQL script
    console.log('Applying vendor performance metrics...');
    await client.query(performanceScript);
    
    // Execute the gallery update SQL script
    console.log('Applying gallery image updates...');
    await client.query(galleryUpdateScript);
    
    // Refresh performance metrics for existing vendors
    console.log('Refreshing performance metrics for existing vendors...');
    await client.query('CALL refresh_vendor_performance()');
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('✅ Vendor performance migration completed successfully');
    
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