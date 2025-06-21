const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'muadatabase',
  password: 'tushar123',
  port: 5432,
});

async function checkBookingTable() {
  try {
    console.log('🔍 Checking booking_all_details_of_user_to_vendor table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Table "booking_all_details_of_user_to_vendor" does not exist!');
      
      // Check if table exists with similar name
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%booking%' 
        AND table_schema = 'public'
      `);
      
      console.log('📋 Available booking-related tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('✅ Table found! Columns:');
      console.log('Column Name'.padEnd(30) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default');
      console.log('-'.repeat(80));
      
      result.rows.forEach(row => {
        console.log(
          row.column_name.padEnd(30) + 
          row.data_type.padEnd(20) + 
          row.is_nullable.padEnd(10) + 
          (row.column_default || 'NULL')
        );
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
  } finally {
    await pool.end();
  }
}

checkBookingTable(); 