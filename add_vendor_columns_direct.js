const { query } = require('./db');

async function addVendorColumns() {
  try {
    console.log('🔧 Adding vendor detail columns to booking table...');
    
    // SQL to add vendor columns
    const migrationSQL = `
    DO $$
    BEGIN
        -- Add vendor_phone_number column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'vendor_phone_number') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN vendor_phone_number VARCHAR(20);
            
            RAISE NOTICE 'Added vendor_phone_number column';
        ELSE
            RAISE NOTICE 'vendor_phone_number column already exists';
        END IF;

        -- Add vendor_email column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'vendor_email') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN vendor_email VARCHAR(255);
            
            RAISE NOTICE 'Added vendor_email column';
        ELSE
            RAISE NOTICE 'vendor_email column already exists';
        END IF;

        -- Add vendor_address column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'vendor_address') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN vendor_address TEXT;
            
            RAISE NOTICE 'Added vendor_address column';
        ELSE
            RAISE NOTICE 'vendor_address column already exists';
        END IF;

        -- Create index on vendor_email for better query performance
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                       AND indexname = 'idx_booking_vendor_email') THEN
            CREATE INDEX idx_booking_vendor_email 
            ON booking_all_details_of_user_to_vendor(vendor_email);
            
            RAISE NOTICE 'Created index on vendor_email';
        ELSE
            RAISE NOTICE 'Index on vendor_email already exists';
        END IF;

        -- Create index on vendor_phone_number for better query performance
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                       AND indexname = 'idx_booking_vendor_phone') THEN
            CREATE INDEX idx_booking_vendor_phone 
            ON booking_all_details_of_user_to_vendor(vendor_phone_number);
            
            RAISE NOTICE 'Created index on vendor_phone_number';
        ELSE
            RAISE NOTICE 'Index on vendor_phone_number already exists';
        END IF;

    END $$;
    `;

    // Execute the migration
    await query(migrationSQL);
    console.log('✅ Vendor columns migration completed successfully!');
    
    // Verify the columns exist
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_name', 'vendor_phone_number', 'vendor_email', 'vendor_address')
      ORDER BY column_name;
    `;
    
    const result = await query(verifyQuery);
    
    console.log('\n📊 Verified vendor columns in booking_all_details_of_user_to_vendor table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    if (result.rows.length >= 3) {
      console.log('\n🎉 All required vendor detail columns are now available!');
      console.log('✅ You can now accept bookings and vendor details will be saved.');
    } else {
      console.log(`\n⚠️  Expected at least 3 vendor columns, found ${result.rows.length}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding vendor columns:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting vendor columns migration...');
addVendorColumns(); 