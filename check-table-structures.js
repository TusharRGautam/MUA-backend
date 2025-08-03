require('dotenv').config();
const { Pool } = require('pg');

// Create a simple connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds timeout
});

async function checkTableStructures() {
  console.log('Checking table structures...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
    
    // Check if tables exist
    const dashboardTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      ) as exists;
    `);
    
    const packageTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      ) as exists;
    `);
    
    const dashboardTableExists = dashboardTableCheck.rows[0].exists;
    const packageTableExists = packageTableCheck.rows[0].exists;
    
    console.log('Table status:');
    console.log('- dashboard_prp_services exists:', dashboardTableExists);
    console.log('- package_services_from_dashboard exists:', packageTableExists);
    
    if (dashboardTableExists) {
      // Get column information for dashboard_prp_services
      const dashboardColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_prp_services'
        ORDER BY ordinal_position;
      `);
      
      console.log('\ndashboard_prp_services columns:');
      dashboardColumns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Get record count
      const dashboardCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services');
      console.log(`\nTotal records in dashboard_prp_services: ${dashboardCount.rows[0].count}`);
      
      // Get sample records
      const dashboardSample = await client.query('SELECT * FROM dashboard_prp_services LIMIT 3');
      console.log('\nSample records from dashboard_prp_services:');
      console.log(JSON.stringify(dashboardSample.rows, null, 2));
    }
    
    if (packageTableExists) {
      // Get column information for package_services_from_dashboard
      const packageColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'package_services_from_dashboard'
        ORDER BY ordinal_position;
      `);
      
      console.log('\npackage_services_from_dashboard columns:');
      packageColumns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Get record count
      const packageCount = await client.query('SELECT COUNT(*) FROM package_services_from_dashboard');
      console.log(`\nTotal records in package_services_from_dashboard: ${packageCount.rows[0].count}`);
      
      // Get sample records
      const packageSample = await client.query('SELECT * FROM package_services_from_dashboard LIMIT 3');
      console.log('\nSample records from package_services_from_dashboard:');
      console.log(JSON.stringify(packageSample.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking table structures:', error);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the function
checkTableStructures()
  .then(() => console.log('Check completed.'))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });