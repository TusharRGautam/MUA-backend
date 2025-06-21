const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'muadatabase',
  password: 'tushar123',
  port: 5432,
});

async function checkCurrentTableStructure() {
  try {
    console.log('🔍 Checking current booking table structure...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Table "booking_all_details_of_user_to_vendor" does not exist!');
      return;
    }
    
    console.log('📋 Current Table Columns:');
    console.log('=' .repeat(80));
    
    // Group columns by type
    const userColumns = [];
    const vendorColumns = [];
    const bookingColumns = [];
    const otherColumns = [];
    
    result.rows.forEach(row => {
      const col = {
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
        default: row.column_default
      };
      
      if (row.column_name.startsWith('user_')) {
        userColumns.push(col);
      } else if (row.column_name.startsWith('vendor_')) {
        vendorColumns.push(col);
      } else if (row.column_name.startsWith('booking_') || row.column_name.startsWith('payment_') || row.column_name.startsWith('service_')) {
        bookingColumns.push(col);
      } else {
        otherColumns.push(col);
      }
    });
    
    // Display user columns
    console.log('\n👤 USER COLUMNS (user_ prefix):');
    if (userColumns.length > 0) {
      userColumns.forEach(col => {
        const nullable = col.nullable === 'YES' ? '✅' : '❌ NOT NULL';
        console.log(`   ✅ ${col.name.padEnd(25)} ${col.type.padEnd(20)} ${nullable}`);
      });
    } else {
      console.log('   ⚠️ No user_ prefixed columns found');
    }
    
    // Display vendor columns  
    console.log('\n🏢 VENDOR COLUMNS (vendor_ prefix):');
    if (vendorColumns.length > 0) {
      vendorColumns.forEach(col => {
        const nullable = col.nullable === 'YES' ? '✅' : '❌ NOT NULL';
        console.log(`   🏢 ${col.name.padEnd(25)} ${col.type.padEnd(20)} ${nullable}`);
      });
    } else {
      console.log('   ⚠️ No vendor_ prefixed columns found');
    }
    
    // Display booking columns
    console.log('\n📊 BOOKING/PAYMENT/SERVICE COLUMNS:');
    if (bookingColumns.length > 0) {
      bookingColumns.forEach(col => {
        const nullable = col.nullable === 'YES' ? '✅' : '❌ NOT NULL';
        console.log(`   📊 ${col.name.padEnd(25)} ${col.type.padEnd(20)} ${nullable}`);
      });
    } else {
      console.log('   ⚠️ No booking/payment/service prefixed columns found');
    }
    
    // Display other columns
    console.log('\n⚪ OTHER COLUMNS:');
    if (otherColumns.length > 0) {
      otherColumns.forEach(col => {
        const nullable = col.nullable === 'YES' ? '✅' : '❌ NOT NULL';
        const prefix = col.name.includes('customer') ? '🔄' : 
                      col.name.includes('location') ? '🔄' : 
                      col.name.includes('address') && !col.name.startsWith('user_') ? '🔄' : '⚪';
        console.log(`   ${prefix} ${col.name.padEnd(25)} ${col.type.padEnd(20)} ${nullable}`);
      });
    }
    
    // Check for problematic columns
    console.log('\n🔍 MIGRATION STATUS:');
    const hasLocationAddress = result.rows.some(row => row.column_name === 'location_address');
    const hasUserAddress = result.rows.some(row => row.column_name === 'user_address');
    const hasUserCity = result.rows.some(row => row.column_name === 'user_city');
    const hasUserDeviceId = result.rows.some(row => row.column_name === 'user_device_id');
    
    console.log(`   location_address exists: ${hasLocationAddress ? '❌ Yes (needs rename)' : '✅ No (already renamed)'}`);
    console.log(`   user_address exists: ${hasUserAddress ? '✅ Yes' : '❌ No (needs migration)'}`);
    console.log(`   user_city exists: ${hasUserCity ? '✅ Yes' : '⚠️ No (optional new column)'}`);
    console.log(`   user_device_id exists: ${hasUserDeviceId ? '✅ Yes' : '⚠️ No (optional new column)'}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (hasLocationAddress && !hasUserAddress) {
      console.log('   🔄 Run: ALTER TABLE booking_all_details_of_user_to_vendor RENAME COLUMN location_address TO user_address;');
    }
    if (!hasUserCity) {
      console.log('   ➕ Run: ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_city VARCHAR(100);');
    }
    if (!hasUserDeviceId) {
      console.log('   ➕ Run: ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_device_id VARCHAR(255);');
    }
    
    // Check user_id constraint
    const userIdColumn = result.rows.find(row => row.column_name === 'user_id');
    if (userIdColumn && userIdColumn.is_nullable === 'NO') {
      console.log('   ⚠️ user_id is NOT NULL - Guest bookings need a default user ID');
      console.log('   💡 Consider: ALTER TABLE booking_all_details_of_user_to_vendor ALTER COLUMN user_id DROP NOT NULL;');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

checkCurrentTableStructure(); 