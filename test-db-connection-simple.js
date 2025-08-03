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

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Connection parameters:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
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
    
    console.log('Table status:');
    console.log('- dashboard_prp_services exists:', dashboardTableCheck.rows[0].exists);
    console.log('- package_services_from_dashboard exists:', packageTableCheck.rows[0].exists);
    
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Connection pool closed');
  }
}

// Run the test
testConnection();