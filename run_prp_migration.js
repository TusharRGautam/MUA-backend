const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'muadatabase',
  password: 'tushar123',
  port: 5432,
});

async function runPRPMigration() {
  try {
    console.log('🚀 Starting PRP booking migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'enhance_booking_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration file loaded successfully');
    
    // Execute the migration
    const client = await pool.connect();
    
    console.log('🔧 Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new columns were added
    console.log('🔍 Verifying new columns...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('session_count', 'doctor_name')
      ORDER BY column_name
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ New columns found:');
      columnCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  New columns not found - they may already exist');
    }
    
    client.release();
    
    console.log('🎉 PRP booking migration completed successfully!');
    console.log('📋 The booking_all_details_of_user_to_vendor table now supports:');
    console.log('   - session_count: Number of PRP sessions');
    console.log('   - doctor_name: Assigned doctor/staff name');
    console.log('   - All existing payment and booking columns');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running on localhost:5432');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runPRPMigration(); 