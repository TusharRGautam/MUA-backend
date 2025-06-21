const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

async function runBookingEnhancementMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting booking table enhancement migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'enhance_booking_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    
    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current table structure:');
    console.table(result.rows);
    
    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'booking_all_details_of_user_to_vendor'
      ORDER BY indexname;
    `);
    
    console.log('📇 Current indexes:');
    console.table(indexResult.rows);
    
    console.log('');
    console.log('🎉 Booking table enhancement migration completed successfully!');
    console.log('');
    console.log('📌 New fields added:');
    console.log('   - vendor_name: Name of the vendor/artist');
    console.log('   - user_name: Name of the booking user');
    console.log('   - services_booked: JSON object with service details');
    console.log('   - final_amount: Final amount after discounts/taxes');
    console.log('   - booking_date: Scheduled service date');
    console.log('   - booking_time: Scheduled service time');
    console.log('   - payment_method: Payment method used');
    console.log('   - service_category: Category of the service');
    console.log('');
    console.log('📈 Performance indexes added for better query speed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runBookingEnhancementMigration(); 