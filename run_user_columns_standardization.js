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

async function runUserColumnStandardization() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting user columns standardization migration...');
    
    // Check current table structure before migration
    console.log('\n📋 Current table structure before migration:');
    const beforeResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    beforeResult.rows.forEach(row => {
      const prefix = row.column_name.includes('user') ? '✅' : 
                    row.column_name.includes('customer') ? '🔄' : 
                    row.column_name.includes('location') ? '🔄' : 
                    row.column_name.includes('latitude') || row.column_name.includes('longitude') ? '🔄' : '⚪';
      console.log(`   ${prefix} ${row.column_name} (${row.data_type})`);
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'standardize_user_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n📄 Executing user columns standardization migration...');
    
    // Execute the migration
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully');
    
    // Check table structure after migration
    console.log('\n📋 Table structure after migration:');
    const afterResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🎯 User-related columns (with user_ prefix):');
    const userColumns = afterResult.rows.filter(row => row.column_name.startsWith('user_'));
    userColumns.forEach(row => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🏢 Vendor-related columns:');
    const vendorColumns = afterResult.rows.filter(row => row.column_name.startsWith('vendor_'));
    vendorColumns.forEach(row => {
      console.log(`   🏢 ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n📊 Booking-related columns:');
    const bookingColumns = afterResult.rows.filter(row => 
      row.column_name.startsWith('booking_') || 
      row.column_name.startsWith('payment_') ||
      row.column_name.startsWith('service_')
    );
    bookingColumns.forEach(row => {
      console.log(`   📊 ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🔍 Other columns:');
    const otherColumns = afterResult.rows.filter(row => 
      !row.column_name.startsWith('user_') && 
      !row.column_name.startsWith('vendor_') && 
      !row.column_name.startsWith('booking_') && 
      !row.column_name.startsWith('payment_') && 
      !row.column_name.startsWith('service_')
    );
    otherColumns.forEach(row => {
      console.log(`   ⚪ ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎉 User columns standardization completed successfully!');
    console.log('✅ All user-related columns now have the user_ prefix');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('📜 Error details:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runUserColumnStandardization()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }); 