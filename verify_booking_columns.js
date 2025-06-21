const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mua_database',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function verifyBookingColumns() {
  let client;
  
  try {
    console.log('🔍 Verifying booking columns implementation...');
    
    client = await pool.connect();
    
    // Check if all three columns exist
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      AND column_name IN ('booking_id', 'booking_date_month', 'booking_time_slot')
      ORDER BY column_name;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    
    console.log('📋 New Booking Columns Status:');
    console.log('=====================================');
    
    const expectedColumns = ['booking_date_month', 'booking_id', 'booking_time_slot'];
    const foundColumns = columnsResult.rows.map(row => row.column_name);
    
    expectedColumns.forEach(col => {
      const found = foundColumns.includes(col);
      const status = found ? '✅' : '❌';
      console.log(`${status} ${col}: ${found ? 'EXISTS' : 'MISSING'}`);
    });
    
    if (foundColumns.length === 3) {
      console.log('\n📊 Column Details:');
      columnsResult.rows.forEach(row => {
        console.log(`   ${row.column_name}:`);
        console.log(`     Type: ${row.data_type}`);
        console.log(`     Nullable: ${row.is_nullable}`);
        console.log(`     Default: ${row.column_default || 'None'}`);
        console.log('');
      });
    }
    
    // Check indexes
    const indexQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'booking_all_details_of_user_to_vendor'
      AND indexname LIKE '%booking%'
      ORDER BY indexname;
    `;
    
    const indexResult = await client.query(indexQuery);
    
    console.log('🔗 Related Indexes:');
    console.log('===================');
    if (indexResult.rows.length > 0) {
      indexResult.rows.forEach(row => {
        console.log(`✅ ${row.indexname}`);
      });
    } else {
      console.log('No booking-related indexes found');
    }
    
    // Test insert/update capability (dry run)
    console.log('\n🧪 Testing column functionality...');
    
    const testQuery = `
      SELECT 
        booking_id,
        booking_date_month,
        booking_time_slot
      FROM booking_all_details_of_user_to_vendor 
      LIMIT 1;
    `;
    
    await client.query(testQuery);
    console.log('✅ Columns are queryable');
    
    // Show example usage
    console.log('\n📝 Example Usage:');
    console.log('================');
    console.log(`
-- Insert a new booking with the new columns:
INSERT INTO booking_all_details_of_user_to_vendor 
(
  user_id, vendor_id, vendor_name, user_name, services_booked, 
  total_amount, final_amount, booking_date, booking_time,
  booking_id, booking_date_month, booking_time_slot
)
VALUES 
(
  123, 456, 'Beauty Salon', 'John Doe', '{"services": ["Haircut", "Facial"]}',
  1500.00, 1350.00, '2024-02-15', '10:00:00',
  'BK_2024_001', '2024-02-15', '10:00 AM - 11:00 AM'
);

-- Query bookings by booking_id:
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_id = 'BK_2024_001';

-- Query bookings by date:
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_date_month = '2024-02-15';

-- Query bookings by time slot:
SELECT * FROM booking_all_details_of_user_to_vendor 
WHERE booking_time_slot LIKE '%10:00 AM%';
    `);
    
    console.log('\n🎉 Verification completed successfully!');
    console.log('All requested booking columns are now available in the database.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run verification
if (require.main === module) {
  verifyBookingColumns()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = verifyBookingColumns; 