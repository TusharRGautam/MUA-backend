require('dotenv').config();
const { query } = require('./db');

async function checkTableStructure() {
  try {
    console.log('Checking dashboard_prp_services table structure...');
    
    // Get table structure
    const tableStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_prp_services'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    console.table(tableStructure.rows);
    
    // Check if the expected columns exist
    const expectedColumns = [
      'service_name',
      'service_category',
      'service_price',
      'service_duration',
      'service_sessions',
      'service_description',
      'included_services',
      'vendor_id'
    ];
    
    const actualColumns = tableStructure.rows.map(row => row.column_name);
    
    console.log('\nChecking for expected columns:');
    let missingColumns = [];
    
    expectedColumns.forEach(column => {
      if (actualColumns.includes(column)) {
        console.log(`✓ Column '${column}' exists`);
      } else {
        console.log(`✗ Column '${column}' is MISSING`);
        missingColumns.push(column);
      }
    });
    
    if (missingColumns.length > 0) {
      console.log('\nWARNING: Missing columns detected!');
      console.log('This could cause API calls to fail when trying to insert data.');
      console.log('The following columns need to be added to the dashboard_prp_services table:');
      console.log(missingColumns.join(', '));
    } else {
      console.log('\nAll expected columns exist in the table.');
    }
    
    // Check for unexpected columns
    const unexpectedColumns = actualColumns.filter(column => 
      !expectedColumns.includes(column) && 
      !['id', 'created_at', 'updated_at'].includes(column)
    );
    
    if (unexpectedColumns.length > 0) {
      console.log('\nNOTE: The table contains additional columns not used in the API:');
      console.log(unexpectedColumns.join(', '));
      console.log('These columns may need to be mapped in the API or removed if not needed.');
    }
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}

checkTableStructure();