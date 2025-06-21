const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runCustomUserIdMigration() {
  try {
    console.log('Starting Custom User ID Migration...');
    console.log('This will implement CLUB01XX format user IDs for all users');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_custom_user_id_system.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    await query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Test the new system by checking a few records
    console.log('\n📊 Testing the new custom user ID system...');
    
    // Check customers
    const customerResult = await query(`
      SELECT id, full_name, email, custom_user_id 
      FROM Customer_Table_Details 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('\n👤 Sample Customer Records:');
    customerResult.rows.forEach(customer => {
      console.log(`- ID: ${customer.id}, Custom ID: ${customer.custom_user_id}, Name: ${customer.full_name}`);
    });
    
    // Check vendors
    const vendorResult = await query(`
      SELECT sr_no, person_name, business_email, custom_user_id 
      FROM registration_and_other_details 
      ORDER BY sr_no 
      LIMIT 5
    `);
    
    console.log('\n🏢 Sample Vendor Records:');
    vendorResult.rows.forEach(vendor => {
      console.log(`- ID: ${vendor.sr_no}, Custom ID: ${vendor.custom_user_id}, Name: ${vendor.person_name}`);
    });
    
    // Test the user lookup view
    const lookupResult = await query(`
      SELECT custom_user_id, user_type, name, email 
      FROM user_lookup 
      ORDER BY custom_user_id 
      LIMIT 5
    `);
    
    console.log('\n🔍 User Lookup View Test:');
    lookupResult.rows.forEach(user => {
      console.log(`- Custom ID: ${user.custom_user_id}, Type: ${user.user_type}, Name: ${user.name}`);
    });
    
    // Check sequence status
    const sequenceResult = await query(`
      SELECT last_value, is_called 
      FROM custom_user_id_seq
    `);
    
    console.log('\n📈 Sequence Status:');
    console.log(`- Next ID will be: CLUB01${String(sequenceResult.rows[0].last_value + (sequenceResult.rows[0].is_called ? 1 : 0)).padStart(2, '0')}`);
    
    console.log('\n✨ Custom User ID System is now active!');
    console.log('🔄 New registrations will automatically get CLUB01XX format IDs');
    console.log('📚 Use the user_lookup view to find users by custom_user_id');
    console.log('🔗 Update booking routes to use custom_user_id for user association');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close the database connection
    await pool.end();
    process.exit(0);
  }
}

// Run the migration
runCustomUserIdMigration(); 