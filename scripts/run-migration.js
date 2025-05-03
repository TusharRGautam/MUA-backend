const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function runMigration() {
  try {
    console.log('Starting gallery migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_featured_to_gallery.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await query(migrationSQL);
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration(); 