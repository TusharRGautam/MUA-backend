require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Improved PostgreSQL connection pool with better error handling and connection recovery
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Reduced maximum number of clients to prevent overloading
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 15000, // Increased connection timeout
  maxUses: 5000, // Reduced to close and replace connections more frequently
  application_name: 'mua-backend', // Helps identify connections in database logs
});

// Track if database is available
let isDatabaseAvailable = false;
let connectionRetryTimeout = null;
const MAX_RETRY_INTERVAL = 30000; // 30 seconds max between retries

// Enhanced error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
  
  // For specific client termination errors, try to recover
  if (err.code === 'XX000' || err.message?.includes('client_termination')) {
    console.log('Client termination detected, removing from pool and attempting recovery');
    isDatabaseAvailable = false;
    
    // Attempt to reconnect after a delay if not already trying
    if (!connectionRetryTimeout) {
      scheduleConnectionRecovery();
    }
  }
});

// Add connection pool monitoring
pool.on('connect', client => {
  console.log('New database connection established');
  isDatabaseAvailable = true;
});

pool.on('acquire', client => {
  // Connection successfully acquired from pool
  isDatabaseAvailable = true;
});

// Schedule reconnection attempts with exponential backoff
let retryCount = 0;
function scheduleConnectionRecovery() {
  if (connectionRetryTimeout) {
    clearTimeout(connectionRetryTimeout);
  }
  
  const delay = Math.min(1000 * Math.pow(2, retryCount), MAX_RETRY_INTERVAL);
  console.log(`Scheduling database connection recovery attempt in ${delay}ms`);
  
  connectionRetryTimeout = setTimeout(async () => {
    connectionRetryTimeout = null;
    await testConnection();
    
    // If still not available, try again
    if (!isDatabaseAvailable) {
      retryCount++;
      scheduleConnectionRecovery();
    } else {
      // Reset retry count on successful connection
      retryCount = 0;
    }
  }, delay);
}

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

// Improved helper function to execute queries with retries and better error handling
const query = async (text, params, maxRetries = 3) => {
  let lastError;
  
  // Check if database is available before attempting query
  if (!isDatabaseAvailable && maxRetries > 0) {
    console.log('Database connection appears to be down, testing before query');
    await testConnection();
    
    // If connection test failed, wait briefly before continuing
    if (!isDatabaseAvailable) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let client = null;
    
    try {
      // For important queries, get a direct client instead of using pool.query
      if (attempt === maxRetries) {
        client = await pool.connect();
        const result = await client.query(text, params);
        return result;
      } else {
        // Do NOT pass the 3rd parameter to pool.query - it expects a callback
        // and our implementation is using async/await instead
        return await pool.query(text, params);
      }
    } catch (err) {
      lastError = err;
      
      // Log error details for debugging
      console.error(`Database query attempt ${attempt} failed:`, {
        error: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      });
      
      // Don't retry if it's a query syntax error
      if (err.code === '42601' || err.code === '42P01') {
        break;
      }
      
      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Special handling for connection issues
      if (err.code === 'XX000' || err.code === '08006' || err.code === '08001' || 
          err.message?.includes('timeout') || err.message?.includes('termination')) {
        isDatabaseAvailable = false;
        
        // Try to refresh the pool
        if (!connectionRetryTimeout) {
          scheduleConnectionRecovery();
        }
        
        // Longer delay for connection issues
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } finally {
      // Always release the client if we acquired one directly
      if (client) {
        client.release();
      }
    }
  }
  
  console.error('Database query failed after all retry attempts:', {
    error: lastError.message,
    query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });
  throw lastError;
};

// Test database connection but don't crash if it fails
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database at', result.rows[0].now);
    isDatabaseAvailable = true;
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    console.log('Application will continue but database features may not work');
    isDatabaseAvailable = false;
    return false;
  }
};

// Run the test but don't wait for it
testConnection();

module.exports = {
  query,
  pool,
  supabase,
  testConnection,
  isDatabaseConnected: () => isDatabaseAvailable
};