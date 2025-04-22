require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

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

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Order in which to run the migrations
const migrationOrder = [
  '001_create_tables.sql',
  '002_create_profiles_table.sql', 
  '003_create_profile_procedures.sql',
  '004_create_business_owners_table.sql',
  '004_create_user_profile_tables.sql',
  '005_create_profile_types.sql',
  '006_add_indian_profiles.sql',
  '008_create_vendor_dashboard.sql'
];

async function runMigrations() {
  console.log('Starting database migrations...');
  
  // Read and execute each migration file in order
  for (const migrationFile of migrationOrder) {
    try {
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
      console.error(`Error running migration ${migrationFile}:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully!');
}

// Run migrations and close the pool when done
runMigrations()
  .then(() => {
    console.log('Database migration process completed');
    pool.end();
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    pool.end();
    process.exit(1);
  }); 