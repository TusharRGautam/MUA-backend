/**
 * Migration runner utility for MUA Application
 * Runs specific migration files from the migrations directory
 */

require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Migration file to run
const migrationFile = process.argv[2] || '007_create_salon_store_owner.sql';

async function runMigration() {
  console.log(`Running migration: ${migrationFile}`);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../../migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.query(sql);
    
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${migrationFile}:`, error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('Migration process completed');
  process.exit(0);
}); 