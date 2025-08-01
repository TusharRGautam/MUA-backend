const { query } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting reviews column migration for ready_services_vendors_data table...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_reviews_column_to_ready_services_vendors_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute the complete migration SQL (PostgreSQL supports DO blocks)
    await query(migrationSQL);
    
    console.log('✅ Migration SQL executed successfully');
    
    // Verify column addition
    const columnCheckResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ready_services_vendors_data' 
      AND column_name IN ('reviews', 'business_type')
      ORDER BY column_name
    `);
    
    if (columnCheckResult.rows.length > 0) {
      console.log('✅ Column verification successful:');
      console.table(columnCheckResult.rows);
    } else {
      console.log('❌ Column verification failed - no matching columns found');
    }
    
    // Show updated table structure
    const tableStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ready_services_vendors_data'
      ORDER BY ordinal_position
    `);
    
    console.log('\nUpdated table structure:');
    console.table(tableStructure.rows);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();