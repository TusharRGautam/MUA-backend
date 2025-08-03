/**
 * Script to run the package_services_from_dashboard table migration
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool with Supabase connection details
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

async function runPackageServicesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running package_services_from_dashboard migration...');
    
    // Path to the migration file
    const migrationFile = path.join(__dirname, '../migrations/create_package_services_from_dashboard.sql');
    
    // Read and execute the SQL file
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the table was created
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      );
    `);
    
    if (checkTableResult.rows[0].exists) {
      console.log('✅ Table package_services_from_dashboard exists in the database.');
    } else {
      console.error('❌ Table package_services_from_dashboard was not created successfully.');
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runPackageServicesMigration(); 