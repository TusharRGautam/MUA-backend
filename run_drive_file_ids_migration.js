const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/database');

async function runMigration() {
  try {
    console.log('Starting drive file IDs migration for transformations...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations/add_drive_file_ids_to_transformations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await query(migrationSQL);
    
    console.log('Drive file IDs migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
  }
}

runMigration(); 