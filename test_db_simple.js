const { pool, query, testConnection } = require('./db');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test the connection
    const result = await testConnection();
    console.log('✅ Database connection test result:', result);
    
    // Try a simple query
    const queryResult = await query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', queryResult.rows[0]);
    
    // Check if booking table exists
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Booking table exists');
    } else {
      console.log('❌ Booking table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
  
  // Close the pool
  await pool.end();
  console.log('Database connection pool closed');
}

testDatabaseConnection();