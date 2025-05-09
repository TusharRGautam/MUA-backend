const { query, pool } = require('./db');

async function checkAndFixTables() {
  try {
    console.log('Checking table structures...');
    
    // Check vendor_packages_services table
    console.log('\nChecking vendor_packages_services table...');
    const packageTable = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_packages_services'
    `);
    
    const packageColumns = packageTable.rows.map(col => col.column_name);
    console.log('Existing columns:', packageColumns.join(', '));
    
    // Check if description column exists
    const hasDescription = packageColumns.includes('description');
    console.log('Has description column:', hasDescription);
    
    // Add description column if missing
    if (!hasDescription) {
      console.log('Adding description column to vendor_packages_services table...');
      await query(`ALTER TABLE vendor_packages_services ADD COLUMN description TEXT`);
      console.log('Added description column successfully');
    }
    
    // Verify package_services table 
    console.log('\nChecking package_services table...');
    const serviceTable = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'package_services'
    `);
    
    const serviceColumns = serviceTable.rows.map(col => col.column_name);
    console.log('Existing columns:', serviceColumns.join(', '));
    
    // Check if required columns exist
    const hasCategory = serviceColumns.includes('category');
    const hasServiceDesc = serviceColumns.includes('description');
    console.log('Has category column:', hasCategory);
    console.log('Has description column:', hasServiceDesc);
    
    // Add missing columns if needed
    if (!hasCategory) {
      console.log('Adding category column to package_services table...');
      await query(`ALTER TABLE package_services ADD COLUMN category VARCHAR(100)`);
      console.log('Added category column successfully');
    }
    
    if (!hasServiceDesc) {
      console.log('Adding description column to package_services table...');
      await query(`ALTER TABLE package_services ADD COLUMN description TEXT`);
      console.log('Added description column successfully');
    }
    
    console.log('\nMigration check and fixes completed successfully!');
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the check
checkAndFixTables(); 