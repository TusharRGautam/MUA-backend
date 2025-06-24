const { query } = require('./db');

async function addRescheduleColumns() {
  try {
    console.log('🔧 Adding reschedule columns to booking table...');
    
    // SQL to add reschedule columns
    const migrationSQL = `
    DO $$
    BEGIN
        -- Add vendor_reschedule_date column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'vendor_reschedule_date') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN vendor_reschedule_date DATE;
            
            COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_reschedule_date 
            IS 'Rescheduled date for the booking (if rescheduled by customer)';
            
            RAISE NOTICE 'Added vendor_reschedule_date column';
        ELSE
            RAISE NOTICE 'vendor_reschedule_date column already exists';
        END IF;

        -- Add vendor_reschedule_time column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'vendor_reschedule_time') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN vendor_reschedule_time TIME;
            
            COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_reschedule_time 
            IS 'Rescheduled time for the booking (if rescheduled by customer)';
            
            RAISE NOTICE 'Added vendor_reschedule_time column';
        ELSE
            RAISE NOTICE 'vendor_reschedule_time column already exists';
        END IF;

        -- Add reschedule_count column to track number of reschedules
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'reschedule_count') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN reschedule_count INTEGER DEFAULT 0;
            
            COMMENT ON COLUMN booking_all_details_of_user_to_vendor.reschedule_count 
            IS 'Number of times this booking has been rescheduled';
            
            RAISE NOTICE 'Added reschedule_count column';
        ELSE
            RAISE NOTICE 'reschedule_count column already exists';
        END IF;

        -- Add reschedule_reason column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'reschedule_reason') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            ADD COLUMN reschedule_reason TEXT;
            
            COMMENT ON COLUMN booking_all_details_of_user_to_vendor.reschedule_reason 
            IS 'Reason provided for the latest reschedule';
            
            RAISE NOTICE 'Added reschedule_reason column';
        ELSE
            RAISE NOTICE 'reschedule_reason column already exists';
        END IF;

        -- Create index on reschedule_date for better query performance
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                       AND indexname = 'idx_booking_reschedule_date') THEN
            CREATE INDEX idx_booking_reschedule_date 
            ON booking_all_details_of_user_to_vendor(vendor_reschedule_date);
            
            RAISE NOTICE 'Created index on vendor_reschedule_date';
        ELSE
            RAISE NOTICE 'Index on vendor_reschedule_date already exists';
        END IF;

    END $$;
    `;

    // Execute the migration
    await query(migrationSQL);
    console.log('✅ Reschedule columns migration completed successfully!');
    
    // Verify the columns exist
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_reschedule_date', 'vendor_reschedule_time', 'reschedule_count', 'reschedule_reason')
      ORDER BY column_name;
    `;
    
    const result = await query(verifyQuery);
    
    console.log('\n📊 Verified reschedule columns in booking_all_details_of_user_to_vendor table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    if (result.rows.length >= 2) {
      console.log('\n🎉 All required reschedule columns are now available!');
      console.log('✅ You can now implement reschedule functionality.');
    } else {
      console.log(`\n⚠️  Expected at least 2 reschedule columns, found ${result.rows.length}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding reschedule columns:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting reschedule columns migration...');
addRescheduleColumns(); 