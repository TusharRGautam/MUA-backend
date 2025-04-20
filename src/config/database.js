require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Improved PostgreSQL connection pool with better error handling
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection
  maxUses: 7500, // Close and replace a pooled connection after it has been used this many times
  application_name: 'mua-backend', // Helps identify connections in database logs
  pool_mode: process.env.DB_POOL_MODE || 'transaction'
});

// Event listener for errors on the pool
pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
  // Avoid crashing the entire server - just log the error
});

// Supabase client with better error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('WARNING: Missing Supabase credentials. Some features may not work.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    // Add global error handler
    global: {
      fetch: (...args) => {
        return fetch(...args)
          .catch(err => {
            console.error('Supabase fetch error:', err);
            throw err;
          });
      }
    }
  }
);

// Helper function to execute queries with retries
const query = async (text, params, retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      lastError = err;
      
      // Don't retry if it's a query syntax error
      if (err.code === '42601' || err.code === '42P01') {
        break;
      }
      
      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(100 * Math.pow(2, attempt), 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('Database query failed after retries:', lastError);
  throw lastError;
};

// Test database connection but don't crash if it fails
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database at', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    console.log('Application will continue but database features may not work');
    return false;
  }
};

// Run the test but don't wait for it
testConnection();

module.exports = {
  query,
  pool,
  supabase,
  testConnection
};