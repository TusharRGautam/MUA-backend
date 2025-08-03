/**
 * Script to verify that the table was renamed successfully
 */

const { query } = require('./db');

async function verifyTableRename() {
  try {
    console.log('Verifying table rename...');
    
    // Check if the old table exists
    const oldTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
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
    
    console.log('Old table (package_services_from_dashboard) exists:', oldTableExists);
    console.log('New table (dashboard_prp_services) exists:', newTableExists);
    
    if (newTableExists && !oldTableExists) {
      console.log('✅ Table rename was successful!');
      
      // Count records in the new table
      const countResult = await query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`The dashboard_prp_services table contains ${countResult.rows[0].count} records.`);
    } else if (oldTableExists && !newTableExists) {
      console.log('❌ Table rename failed: Old table still exists, new table does not exist.');
    } else if (oldTableExists && newTableExists) {
      console.log('⚠️ Both tables exist. The rename might have created a copy instead of renaming.');
    } else {
      console.log('❌ Neither table exists. Something went wrong.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying table rename:', error);
    process.exit(1);
  }
}

verifyTableRename();