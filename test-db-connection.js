require('dotenv').config();
const { query } = require('./db');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database configuration:');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    
    // Test basic connection
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Check if dashboard_prp_services table exists
    console.log('\nChecking dashboard_prp_services table...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      ) as exists;
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('dashboard_prp_services table exists');
      
      // Get table structure
      const tableStructure = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services';
      `);
      
      console.log('Table structure:');
      console.table(tableStructure.rows);
      
      // Count records
      const countResult = await query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`Total records: ${countResult.rows[0].count}`);
      
      // Get sample records if any exist
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleRecords = await query('SELECT * FROM dashboard_prp_services LIMIT 3');
        console.log('Sample records:');
        console.log(JSON.stringify(sampleRecords.rows, null, 2));
      } else {
        console.log('No records found in dashboard_prp_services table');
      }
    } else {
      console.log('dashboard_prp_services table does NOT exist!');
    }
    
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

testDatabaseConnection();