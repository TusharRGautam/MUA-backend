/**
 * Script to verify that the table has been renamed from prp_services_from_dashboard_and_app to dashboard_prp_services
 */

const { query } = require('./db');

async function verifyTableRename() {
  try {
    console.log('Verifying table rename from prp_services_from_dashboard_and_app to dashboard_prp_services...');
    
    // Check if the old table exists
    const oldTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prp_services_from_dashboard_and_app'
      );
    `);
    
    const oldTableExists = oldTableResult.rows[0].exists;
    
    // Check if the new table exists
    const newTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      );
    `);
    
    const newTableExists = newTableResult.rows[0].exists;
    
    console.log('Verification results:');
    console.log(`- Old table 'prp_services_from_dashboard_and_app' exists: ${oldTableExists}`);
    console.log(`- New table 'dashboard_prp_services' exists: ${newTableExists}`);
    
    if (!oldTableExists && newTableExists) {
      console.log('✅ Table rename was successful!');
      
      // Get the table structure
      const tableStructure = await query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure of dashboard_prp_services:');
      console.table(tableStructure.rows);
      
      // Count the records in the table
      const countResult = await query(`
        SELECT COUNT(*) FROM dashboard_prp_services;
      `);
      
      console.log(`\nTotal records in dashboard_prp_services: ${countResult.rows[0].count}`);
    } else if (oldTableExists && !newTableExists) {
      console.log('❌ Table rename failed! The old table still exists but the new table does not.');
    } else if (oldTableExists && newTableExists) {
      console.log('⚠️ Both tables exist! The rename might have created a copy instead of renaming.');
    } else {
      console.log('❌ Neither table exists! Something went wrong with the database.');
    }
    
  } catch (error) {
    console.error('Error verifying table rename:', error);
  } finally {
    process.exit(0);
  }
}

verifyTableRename();