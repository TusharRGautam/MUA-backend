const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Adding verification_status column to registration_and_other_details table...');
    
    // Read the SQL migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_verification_status_column.sql'),
      'utf8'
    );
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute the migration SQL
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Verification status column added successfully!');
    console.log('   - Column: verification_status (VARCHAR(20))');
    console.log('   - Default value: pending');
    console.log('   - Allowed values: pending, verified, rejected, under_review');
    console.log('   - Index created for better performance');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error adding verification_status column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runMigration().then(() => {
  console.log('Migration completed successfully.');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 