const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runMigration() {
  try {
    console.log('Starting migration: Adding business information columns to registration_and_other_details table...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_business_info_columns.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    await query(migrationSQL);
    
    console.log('Migration successful!');
    
    // Check the updated table schema
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'registration_and_other_details'
      AND column_name IN ('business_address', 'business_description')
      ORDER BY ordinal_position
    `);
    
    console.log('Added columns:');
    result.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });
    
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