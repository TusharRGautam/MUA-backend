const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'muadatabase',
  password: 'tushar123',
  port: 5432,
});

async function addPRPColumns() {
  try {
    console.log('🔧 Adding PRP-specific columns to booking table...');
    
    const client = await pool.connect();
    
    // Add session_count column
    console.log('📝 Adding session_count column...');
    await client.query(`
      ALTER TABLE booking_all_details_of_user_to_vendor 
      ADD COLUMN IF NOT EXISTS session_count INTEGER;
    `);
    
    // Add doctor_name column
    console.log('📝 Adding doctor_name column...');
    await client.query(`
      ALTER TABLE booking_all_details_of_user_to_vendor 
      ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);
    `);
    
    // Add comments
    await client.query(`
      COMMENT ON COLUMN booking_all_details_of_user_to_vendor.session_count 
      IS 'Number of PRP sessions booked';
    `);
    
    await client.query(`
      COMMENT ON COLUMN booking_all_details_of_user_to_vendor.doctor_name 
      IS 'Name of the doctor or staff assigned for PRP treatment';
    `);
    
    // Verify columns were added
    console.log('🔍 Verifying columns...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('session_count', 'doctor_name')
      ORDER BY column_name
    `);
    
    console.log('✅ Columns in table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    
    console.log('🎉 PRP columns added successfully!');
    console.log('📋 The booking_all_details_of_user_to_vendor table now supports PRP bookings with:');
    console.log('   - session_count: Number of PRP sessions');
    console.log('   - doctor_name: Assigned doctor/staff name');
    console.log('   - All existing payment and booking columns');
    
  } catch (error) {
    console.error('❌ Error adding PRP columns:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running on localhost:5432');
    }
  } finally {
    await pool.end();
  }
}

addPRPColumns(); 