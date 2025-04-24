require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../db');

/**
 * Script to run database migrations
 * This will execute all SQL files in the migrations directory in alphabetical order
 */
async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Create migrations tracking table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of executed migrations
    const result = await query('SELECT name FROM migrations');
    const executedMigrations = result.rows.map(row => row.name);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure order
    
    // Execute migrations that haven't been run yet
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        // Read and execute the migration
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await query(sql);
        
        // Record the migration
        await query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        
        console.log(`Migration ${file} completed successfully`);
      } else {
        console.log(`Skipping migration ${file} (already executed)`);
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    pool.end();
  }
}

// Run the migrations
runMigrations(); 