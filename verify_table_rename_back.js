/**
 * Script to verify that the table was renamed back successfully
 */

const { query } = require('./db');

async function verifyTableRenameBack() {
  try {
    console.log('Verifying table rename back to package_services_from_dashboard...');
    
    // Check if the old table exists
    const oldTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      );
    `);
    
    const oldTableExists = oldTableResult.rows[0].exists;
    console.log('Old table (dashboard_prp_services) exists:', oldTableExists);
    
    // Check if the new table exists
    const newTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      );
    `);
    
    const newTableExists = newTableResult.rows[0].exists;
    console.log('New table (package_services_from_dashboard) exists:', newTableExists);
    
    if (newTableExists) {
      // Count records in the new table
      const countResult = await query('SELECT COUNT(*) FROM package_services_from_dashboard');
      console.log(`The package_services_from_dashboard table contains ${countResult.rows[0].count} records.`);
    }
    
    if (!oldTableExists && newTableExists) {
      console.log('✅ Table rename verification successful!');
    } else {
      console.log('❌ Table rename verification failed!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying table rename:', error);
    process.exit(1);
  }
}

verifyTableRenameBack();