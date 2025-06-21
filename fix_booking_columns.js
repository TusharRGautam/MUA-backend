const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mua_backend_db',
  user: 'postgres',
  password: 'club0101',
});

async function fixBookingTableColumns() {
  try {
    console.log('🔧 Starting booking table column fix...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix_booking_table_columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing SQL commands...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Successfully added missing columns to booking table');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Current booking table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    console.log('\n🎯 Booking table is now ready for use!');
    
  } catch (error) {
    console.error('❌ Error fixing booking table:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixBookingTableColumns(); 