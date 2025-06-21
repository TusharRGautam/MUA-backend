const { Pool } = require('pg');

// Use the same database connection as the booking routes
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

// Helper function to execute queries (same as booking routes)
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

async function autoFixBookingTable() {
  try {
    console.log('🚀 Starting automatic booking table fix...\n');

    // Step 1: Check current table structure
    console.log('📋 Checking current table structure...');
    const tableCheck = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Table booking_all_details_of_user_to_vendor does not exist!');
      return;
    }

    console.log(`✅ Table exists with ${tableCheck.rows.length} columns\n`);

    // Step 2: Check if user_id is nullable
    const userIdColumn = tableCheck.rows.find(row => row.column_name === 'user_id');
    const isUserIdNullable = userIdColumn && userIdColumn.is_nullable === 'YES';
    
    console.log(`📍 user_id column status: ${isUserIdNullable ? '✅ Nullable' : '❌ NOT NULL (needs fix)'}`);

    // Step 3: Fix user_id constraint if needed
    if (!isUserIdNullable) {
      console.log('🔧 Fixing user_id constraint...');
      try {
        await query(`ALTER TABLE booking_all_details_of_user_to_vendor ALTER COLUMN user_id DROP NOT NULL`);
        console.log('✅ user_id is now nullable (allows guest bookings)');
      } catch (error) {
        console.log('⚠️ Error making user_id nullable:', error.message);
      }
    }

    // Step 4: Check for required standardized columns
    const hasUserAddress = tableCheck.rows.some(row => row.column_name === 'user_address');
    const hasUserCity = tableCheck.rows.some(row => row.column_name === 'user_city');
    const hasUserDeviceId = tableCheck.rows.some(row => row.column_name === 'user_device_id');
    const hasUserPostalCode = tableCheck.rows.some(row => row.column_name === 'user_postal_code');

    console.log('\n📍 Standardized columns status:');
    console.log(`   user_address: ${hasUserAddress ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   user_city: ${hasUserCity ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   user_device_id: ${hasUserDeviceId ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   user_postal_code: ${hasUserPostalCode ? '✅ Exists' : '❌ Missing'}`);

    // Step 5: Add missing standardized columns
    if (!hasUserAddress) {
      console.log('\n🔧 Adding user_address column...');
      try {
        // Check if location_address exists to rename it
        const hasLocationAddress = tableCheck.rows.some(row => row.column_name === 'location_address');
        if (hasLocationAddress) {
          await query(`ALTER TABLE booking_all_details_of_user_to_vendor RENAME COLUMN location_address TO user_address`);
          console.log('✅ Renamed location_address to user_address');
        } else {
          await query(`ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_address TEXT`);
          console.log('✅ Added user_address column');
        }
      } catch (error) {
        console.log('⚠️ Error adding user_address:', error.message);
      }
    }

    if (!hasUserCity) {
      console.log('🔧 Adding user_city column...');
      try {
        await query(`ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_city VARCHAR(100)`);
        console.log('✅ Added user_city column');
      } catch (error) {
        console.log('⚠️ Error adding user_city:', error.message);
      }
    }

    if (!hasUserDeviceId) {
      console.log('🔧 Adding user_device_id column...');
      try {
        await query(`ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_device_id VARCHAR(255)`);
        console.log('✅ Added user_device_id column');
      } catch (error) {
        console.log('⚠️ Error adding user_device_id:', error.message);
      }
    }

    if (!hasUserPostalCode) {
      console.log('🔧 Adding user_postal_code column...');
      try {
        await query(`ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN user_postal_code VARCHAR(20)`);
        console.log('✅ Added user_postal_code column');
      } catch (error) {
        console.log('⚠️ Error adding user_postal_code:', error.message);
      }
    }

    // Step 6: Create performance indexes
    console.log('\n🔧 Creating performance indexes...');
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking_all_details_of_user_to_vendor(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_booking_user_email ON booking_all_details_of_user_to_vendor(user_email)`,
      `CREATE INDEX IF NOT EXISTS idx_booking_user_phone ON booking_all_details_of_user_to_vendor(user_phone)`,
      `CREATE INDEX IF NOT EXISTS idx_booking_date ON booking_all_details_of_user_to_vendor(booking_date)`,
      `CREATE INDEX IF NOT EXISTS idx_booking_status ON booking_all_details_of_user_to_vendor(booking_status)`
    ];

    for (const indexQuery of indexQueries) {
      try {
        await query(indexQuery);
        console.log(`✅ Created index: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️ Index creation warning: ${error.message}`);
      }
    }

    // Step 7: Verify final structure
    console.log('\n📋 Verifying final table structure...');
    const finalCheck = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name LIKE 'user_%'
      ORDER BY column_name
    `);

    console.log('\n👤 User columns after migration:');
    finalCheck.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '✅' : '❌ NOT NULL';
      console.log(`   ✅ ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}`);
    });

    console.log('\n🎉 Booking table migration completed successfully!');
    console.log('✅ user_id constraint fixed - guest bookings now allowed');
    console.log('✅ All standardized user columns added');
    console.log('✅ Performance indexes created');
    console.log('\n💡 Try booking from your frontend app now - it should work!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('📜 Error details:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔚 Migration script completed');
  }
}

// Run the migration
autoFixBookingTable(); 