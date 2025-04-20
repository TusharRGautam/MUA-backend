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

async function runProfilesMigration() {
  console.log('Adding Indian profiles to the database...');
  
  try {
    const migrationFile = '006_add_indian_profiles.sql';
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
}

// Run migration and close the pool when done
runProfilesMigration()
  .then(() => {
    console.log('Indian profiles added successfully!');
    pool.end();
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    pool.end();
    process.exit(1);
  }); 