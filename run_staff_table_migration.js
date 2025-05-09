const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runMigration() {
  try {
    console.log('Starting migration: Creating vendor_staff table...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_vendor_staff_table.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    await query(migrationSQL);
    
    console.log('Migration successful!');
    
    // Check that the table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_staff'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('vendor_staff table created successfully');
      
      // Get column information
      const columns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vendor_staff'
        ORDER BY ordinal_position
      `);
      
      console.log('Table structure:');
      columns.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
    } else {
      console.error('Table creation failed, could not find vendor_staff table');
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