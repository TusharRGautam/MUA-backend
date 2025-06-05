// Migration script to add status columns to vendor and customer tables
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runStatusColumnsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running status columns migration...');
    
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'add_status_columns.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute the SQL migration
    await client.query(sqlQuery);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Status columns migration completed successfully.');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error running status columns migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runStatusColumnsMigration().catch(console.error); 