const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runMigration() {
  try {
    console.log('Starting migration: Changing profile_picture column to TEXT type...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'update_profile_picture_column.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    await query(migrationSQL);
    
    console.log('Migration successful!');
    
    // Check the updated table schema
    const result = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'registration_and_other_details' AND column_name = 'profile_picture'
    `);
    
    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log('Updated column type:');
      console.log(`- ${column.column_name}: ${column.data_type}${
        column.character_maximum_length ? `(${column.character_maximum_length})` : ''
      }`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
runMigration(); 