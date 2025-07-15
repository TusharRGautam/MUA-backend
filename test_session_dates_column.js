const { query, pool } = require('./db');

async function testSessionDatesColumn() {
  try {
    console.log('Testing session_dates column existence...');
    
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name = 'session_dates'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ session_dates column EXISTS!');
      console.log('Column details:', result.rows[0]);
      console.log('🎉 Database is ready for PRP bookings!');
    } else {
      console.log('❌ session_dates column NOT FOUND');
    }
    
    // Also check all PRP-related columns
    const prpColumns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('session_dates', 'session_times', 'recurring_pattern', 'sessions_completed', 'next_session_date', 'treatment_plan')
      ORDER BY column_name
    `);
    
    console.log('\nAll PRP-related columns:');
    prpColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSessionDatesColumn();