require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create PostgreSQL client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function runVendorMigration() {
  console.log('Starting VendorDashboard migration...');
  
  try {
    const migrationFile = '008_create_vendor_dashboard.sql';
    console.log(`Running migration: ${migrationFile}`);
    const filePath = path.join(__dirname, '../migrations', migrationFile);
    
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Run the SQL as a transaction
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`Error running migration:`, error);
    throw error;
  }
  
  console.log('VendorDashboard migration completed successfully!');
}

// Run migration and close the pool when done
runVendorMigration()
  .then(() => {
    console.log('VendorDashboard migration process completed');
    pool.end();
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    pool.end();
    process.exit(1);
  }); 