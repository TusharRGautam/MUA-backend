const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runMigration() {
  try {
    console.log('Starting migration: Creating prp_services_from_dashboard_and_app table...');
    
    // First try to run the JS migration
    console.log('Running JavaScript migration...');
    const migration = require('./migrations/create_prp_services_from_dashboard_and_app');
    await migration.up();
    
    // If JS migration fails or doesn't exist, fall back to SQL
    // Read the migration SQL file
    // const migrationSQL = fs.readFileSync(
    //   path.join(__dirname, 'migrations', 'create_prp_services_from_dashboard_and_app.sql'),
    //   'utf8'
    // );
    
    // // Execute the migration SQL
    // await query(migrationSQL);
    
    console.log('Migration successful!');
    
    // Check the table schema
    const result = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'prp_services_from_dashboard_and_app'
      ORDER BY ordinal_position
    `);
    
    console.log('Table schema:');
    result.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}${
        column.character_maximum_length ? `(${column.character_maximum_length})` : ''
      }`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runMigration(); 