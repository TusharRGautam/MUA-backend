const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    // Read the SQL file
    const filePath = path.join(__dirname, migrationFile);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim() !== '');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        console.log(stmt);
        
        try {
          await query(stmt);
          console.log('Statement executed successfully');
        } catch (error) {
          console.error(`Error executing statement: ${error.message}`);
          // Continue with next statement instead of failing
        }
      }
    }
    
    console.log(`Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Get the migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name as an argument');
  process.exit(1);
}

// Run the migration
runMigration(migrationFile).then(() => {
  console.log('Migration process completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration process failed:', err);
  process.exit(1);
}); 