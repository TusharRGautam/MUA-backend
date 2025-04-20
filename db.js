// Import the database connection from the config file
const { pool, query, supabase, testConnection } = require('./src/config/database');

// Export the database connection for use in services
module.exports = {
  pool,
  query,
  supabase,
  testConnection
}; 