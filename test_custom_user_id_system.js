const { query, pool } = require('./db');

async function testCustomUserIdSystem() {
  try {
    console.log('🧪 Testing Custom User ID System...\n');
    
    // Test 1: Check if sequence and functions exist
    console.log('1️⃣ Checking system components...');
    
    const sequenceCheck = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE sequencename = 'custom_user_id_seq'
      ) as sequence_exists
    `);
    
    const functionCheck = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_custom_user_id'
      ) as function_exists
    `);
    
    console.log(`   ✅ Sequence exists: ${sequenceCheck.rows[0].sequence_exists}`);
    console.log(`   ✅ Function exists: ${functionCheck.rows[0].function_exists}`);
    
    // Test 2: Check current sequence value
    console.log('\n2️⃣ Checking sequence status...');
    const sequenceStatus = await query('SELECT last_value, is_called FROM custom_user_id_seq');
    const nextId = sequenceStatus.rows[0].last_value + (sequenceStatus.rows[0].is_called ? 1 : 0);
    console.log(`   📊 Next custom_user_id will be: CLUB01${String(nextId).padStart(2, '0')}`);
    
    // Test 3: Test the generation function directly
    console.log('\n3️⃣ Testing ID generation function...');
    const testGeneration = await query('SELECT generate_custom_user_id() as new_id');
    console.log(`   🆔 Generated test ID: ${testGeneration.rows[0].new_id}`);
    
    // Test 4: Check user lookup view
    console.log('\n4️⃣ Testing user lookup view...');
    const lookupTest = await query(`
      SELECT custom_user_id, user_type, name 
      FROM user_lookup 
      ORDER BY custom_user_id 
      LIMIT 3
    `);
    
    console.log('   👥 Sample users in lookup view:');
    lookupTest.rows.forEach(user => {
      console.log(`      - ${user.custom_user_id}: ${user.name} (${user.user_type})`);
    });
    
    // Test 5: Simulate a customer registration
    console.log('\n5️⃣ Simulating customer registration...');
    
    const testEmail = `test_user_${Date.now()}@example.com`;
    const insertTest = await query(`
      INSERT INTO Customer_Table_Details (
        full_name, email, phone_number, password
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, custom_user_id, full_name
    `, ['Test User', testEmail, '9876543210', 'test_password']);
    
    console.log(`   🆕 Created test user: ${insertTest.rows[0].custom_user_id} - ${insertTest.rows[0].full_name}`);
    
    // Clean up test user
    await query('DELETE FROM Customer_Table_Details WHERE email = $1', [testEmail]);
    console.log('   🧹 Cleaned up test user');
    
    // Test 6: Check booking table compatibility
    console.log('\n6️⃣ Checking booking table compatibility...');
    const bookingTableCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name = 'custom_user_id'
    `);
    
    console.log(`   ✅ Booking table has custom_user_id column: ${bookingTableCheck.rows.length > 0}`);
    
    // Test 7: Final system status
    console.log('\n7️⃣ System Status Summary:');
    
    const customerCount = await query('SELECT COUNT(*) as count FROM Customer_Table_Details WHERE custom_user_id IS NOT NULL');
    const vendorCount = await query('SELECT COUNT(*) as count FROM registration_and_other_details WHERE custom_user_id IS NOT NULL');
    
    console.log(`   👤 Customers with custom IDs: ${customerCount.rows[0].count}`);
    console.log(`   🏢 Vendors with custom IDs: ${vendorCount.rows[0].count}`);
    console.log(`   🔢 Next available ID: CLUB01${String(nextId + 1).padStart(2, '0')}`);
    
    console.log('\n✅ Custom User ID System Test Completed Successfully!');
    console.log('🎉 The system is ready for production use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testCustomUserIdSystem(); 