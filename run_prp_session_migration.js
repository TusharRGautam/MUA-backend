const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runPRPSessionMigration() {
  try {
    console.log('Starting PRP session details migration...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_prp_session_details_columns.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    console.log('Executing migration SQL...');
    const result = await query(migrationSQL);
    
    console.log('Migration executed successfully!');
    console.log('Migration result:', result);
    
    // Verify the new columns were added
    console.log('\nVerifying new columns...');
    const columnCheck = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      AND column_name IN ('session_dates', 'session_times', 'recurring_pattern', 'sessions_completed', 'next_session_date', 'treatment_plan')
      ORDER BY column_name
    `);
    
    console.log('New PRP session columns:');
    columnCheck.rows.forEach(column => {
      console.log(`✅ ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    if (columnCheck.rows.length === 6) {
      console.log('\n🎉 All 6 PRP session columns added successfully!');
    } else {
      console.log(`\n⚠️ Expected 6 columns, but found ${columnCheck.rows.length}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the migration
runPRPSessionMigration();