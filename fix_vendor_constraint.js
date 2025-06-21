const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'muadatabase',
  user: 'postgres',
  password: 'tushar123',
});

async function checkAndFixVendorConstraint() {
  console.log('🔍 Checking vendor constraint issue...\n');
  
  try {
    // Check what vendors exist
    console.log('📋 Checking existing vendors:');
    const vendorQuery = `
      SELECT id, user_name, email, user_type 
      FROM registration_and_other_details 
      WHERE user_type = 'vendor' OR user_type = 'artist'
      ORDER BY id
      LIMIT 10
    `;
    
    const vendorResult = await pool.query(vendorQuery);
    
    if (vendorResult.rows.length > 0) {
      console.log(`✅ Found ${vendorResult.rows.length} vendors:`);
      vendorResult.rows.forEach(vendor => {
        console.log(`   ID: ${vendor.id}, Name: ${vendor.user_name}, Email: ${vendor.email}, Type: ${vendor.user_type}`);
      });
    } else {
      console.log('❌ No vendors found in registration_and_other_details table');
    }
    
    console.log('\n🔍 Checking if vendor_id=0 exists:');
    const zeroVendorQuery = `
      SELECT id, user_name, email 
      FROM registration_and_other_details 
      WHERE id = 0
    `;
    
    const zeroResult = await pool.query(zeroVendorQuery);
    
    if (zeroResult.rows.length === 0) {
      console.log('❌ No vendor with ID=0 exists (this is causing the foreign key error)');
      
      console.log('\n🔧 Creating default vendor with ID=0...');
      const insertDefaultVendor = `
        INSERT INTO registration_and_other_details (
          id, user_name, email, user_type, phone_number, created_at, updated_at
        ) VALUES (
          0, 'Default Service Provider', 'default@servicedetails.com', 'vendor', '0000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      await pool.query(insertDefaultVendor);
      console.log('✅ Default vendor created with ID=0');
      
      // Reset the sequence to ensure future IDs don't conflict
      console.log('🔧 Adjusting ID sequence...');
      await pool.query(`SELECT setval('registration_and_other_details_id_seq', (SELECT MAX(id) FROM registration_and_other_details))`);
      console.log('✅ ID sequence adjusted');
      
    } else {
      console.log('✅ Vendor with ID=0 already exists');
    }
    
    console.log('\n🧪 Testing booking with vendor_id=0...');
    const testBooking = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        vendor_id, user_id, user_name, user_email, user_phone, 
        total_amount, booking_status, created_at, updated_at
      ) VALUES (
        0, 1, 'Test User', 'test@example.com', '1234567890',
        100, 'confirmed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `;
    
    const testResult = await pool.query(testBooking);
    console.log(`✅ Test booking successful! Booking ID: ${testResult.rows[0].id}`);
    
    // Clean up test booking
    await pool.query('DELETE FROM booking_all_details_of_user_to_vendor WHERE id = $1', [testResult.rows[0].id]);
    console.log('🧹 Test booking cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: PostgreSQL is not running. Start it with:');
      console.log('   - Windows: Start PostgreSQL service');
      console.log('   - Mac: brew services start postgresql');
      console.log('   - Linux: sudo systemctl start postgresql');
    }
  } finally {
    await pool.end();
  }
}

// Alternative solution: Update booking route to use valid vendor ID
function showBookingRouteAlternative() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 ALTERNATIVE SOLUTION: Update Booking Route');
  console.log('='.repeat(60));
  console.log(`
If you don't want to create a default vendor, you can update the booking route to:

1. Use a valid vendor ID from existing vendors
2. Create vendors on-demand when booking
3. Make vendor_id nullable in the booking table

Example code for routes/bookingRoutes.js:

// Instead of:
const vendorId = parseInt(item.artistId) || 0;

// Use:
const vendorId = await getOrCreateVendor(item.artistId, item.artistName);

async function getOrCreateVendor(artistId, artistName) {
  try {
    // First try to find existing vendor
    const existing = await executeQuery(
      'SELECT id FROM registration_and_other_details WHERE user_name = $1 OR email = $2',
      [artistName, \`\${artistName.toLowerCase().replace(/\\s+/g, '')}@servicedetails.com\`]
    );
    
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
    
    // Create new vendor
    const newVendor = await executeQuery(\`
      INSERT INTO registration_and_other_details (
        user_name, email, user_type, phone_number, created_at, updated_at
      ) VALUES ($1, $2, 'vendor', '0000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    \`, [artistName, \`\${artistName.toLowerCase().replace(/\\s+/g, '')}@servicedetails.com\`]);
    
    return newVendor.rows[0].id;
  } catch (error) {
    console.error('Error creating vendor:', error);
    return 1; // Fallback to ID 1 if it exists
  }
}
  `);
}

// Run the check
checkAndFixVendorConstraint().then(() => {
  showBookingRouteAlternative();
}); 