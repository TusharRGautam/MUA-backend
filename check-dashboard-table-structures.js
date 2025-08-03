/**
 * Script to check the structure of dashboard service tables
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

async function checkTableStructures() {
  console.log('Checking dashboard service table structures...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
  
  try {
    const tables = [
      'dashboard_salon_services',
      'dashboard_prp_services', 
      'dashboard_diagnostics_services'
    ];
    
    for (const tableName of tables) {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE STRUCTURE ===`);
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log('Columns:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'}${row.column_default ? ', default: ' + row.column_default : ''})`);
      });
      
      // Get record count
      const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`\nRecord count: ${countResult.rows[0].count}`);
      
      // Get sample record if any exist
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
        console.log('\nSample record:');
        const record = sampleResult.rows[0];
        for (const [key, value] of Object.entries(record)) {
          console.log(`- ${key}: ${value}`);
        }
      } else {
        console.log('\nNo records found in this table.');
      }
    }
    
    console.log('\n=== TABLE STRUCTURE CHECK COMPLETED ===');
  } catch (error) {
    console.error('Error checking table structures:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the function
console.log('Starting table structure check...');

checkTableStructures()
  .then(() => {
    console.log('Table structure check completed successfully.');
  })
  .catch(err => {
    console.error('Table structure check failed:', err);
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