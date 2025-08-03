/**
 * Script to create and verify dashboard service tables
 * This script will:
 * 1. Create the three dashboard service tables if they don't exist
 * 2. Check the current structure of each table
 * 3. Display the data in each table
 */

const { query } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting dashboard service tables migration...');
    
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, 'migrations', 'create_dashboard_service_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    await query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function checkTableStructure(tableName) {
  try {
    console.log(`\n=== Checking structure of ${tableName} ===`);
    
    // Check if table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.log(`❌ Table ${tableName} does not exist`);
      return false;
    }
    
    console.log(`✅ Table ${tableName} exists`);
    
    // Get table structure
    const columns = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log('Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get row count
    const count = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`Total records: ${count.rows[0].count}`);
    
    // Show sample data if any exists
    if (parseInt(count.rows[0].count) > 0) {
      const sampleData = await query(`SELECT * FROM ${tableName} LIMIT 5`);
      console.log('Sample data:');
      console.table(sampleData.rows);
    }
    
    return true;
    
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function checkAllTables() {
  const tables = [
    'dashboard_salon_services',
    'dashboard_prp_services', 
    'dashboard_diagnostics_services'
  ];
  
  console.log('\n=== Checking all dashboard service tables ===');
  
  for (const table of tables) {
    await checkTableStructure(table);
  }
}

async function main() {
  try {
    // Run migration first
    await runMigration();
    
    // Then check all tables
    await checkAllTables();
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runMigration,
  checkTableStructure,
  checkAllTables
};