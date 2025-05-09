/**
 * This script adds a device_id column to the registration_and_other_details table
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query } = require('./db');

console.log('Starting migration: Adding device_id column to registration_and_other_details table...');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'registration_and_other_details' 
      AND column_name = 'device_id'
    `;
    
    const columnResult = await client.query(checkColumnQuery);
    
    if (columnResult.rows.length > 0) {
      console.log('Column device_id already exists in registration_and_other_details table.');
      return;
    }

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_device_id_column.sql'),
      'utf8'
    );

    // Execute the migration
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration().then(() => {
  console.log('Migration process completed.');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 