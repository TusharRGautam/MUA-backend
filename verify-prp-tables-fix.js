/**
 * Script to verify that the PRP services tables have been properly fixed
 */

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

async function verifyPRPTables() {
  console.log('Connecting to database...');
  console.log('Connection parameters:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
  
  try {
    console.log('Starting PRP services tables verification...');
    
    // Check which tables exist
    console.log('\nChecking which tables exist:');
    
    const tables = [
      'dashboard_prp_services',
      'dashboard_prp_services_old',
      'package_services_from_dashboard',
      'dashboard_prp_services_backup',
      'package_services_from_dashboard_backup'
    ];
    
    for (const table of tables) {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists;
      `, [table]);
      
      console.log(`- ${table} exists: ${tableCheck.rows[0].exists}`);
    }
    
    // Check if the view exists
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services_view'
      ) as exists;
    `);
    
    console.log(`- dashboard_prp_services_view exists: ${viewCheck.rows[0].exists}`);
    
    // Check the structure of dashboard_prp_services
    console.log('\nChecking structure of dashboard_prp_services:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_prp_services'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in dashboard_prp_services:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check record counts
    console.log('\nChecking record counts:');
    
    if (viewCheck.rows[0].exists) {
      const viewCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services_view');
      console.log(`- dashboard_prp_services_view record count: ${viewCount.rows[0].count}`);
    }
    
    const tableExists = {};
    for (const table of tables) {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists;
      `, [table]);
      
      tableExists[table] = tableCheck.rows[0].exists;
      
      if (tableCheck.rows[0].exists) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`- ${table} record count: ${countResult.rows[0].count}`);
      }
    }
    
    // Check sample records from dashboard_prp_services
    if (tableExists['dashboard_prp_services']) {
      console.log('\nSample records from dashboard_prp_services:');
      const sampleRecords = await client.query('SELECT * FROM dashboard_prp_services LIMIT 3');
      
      sampleRecords.rows.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        for (const [key, value] of Object.entries(record)) {
          console.log(`- ${key}: ${value}`);
        }
      });
    }
    
    console.log('\nVerification completed successfully!');
  } catch (error) {
    console.error('Error verifying PRP tables:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the function
console.log('Starting script execution...');

// Add a timeout to ensure we see the logs
setTimeout(() => {
  console.log('Script is still running after 2 seconds...');
}, 2000);

verifyPRPTables()
  .then(() => {
    console.log('Script completed successfully.');
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Closing database pool...');
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    // Force exit after a delay to ensure all logs are printed
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(0);
    }, 1000);
  });