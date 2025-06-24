const { query } = require('./db');

async function fixVendorNotificationsTable() {
  try {
    console.log('🔧 Fixing vendor_notifications table...');
    
    // Add missing columns if they don't exist
    const fixTableSQL = `
    DO $$
    BEGIN
        -- Add is_read column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'vendor_notifications' 
                       AND column_name = 'is_read') THEN
            ALTER TABLE vendor_notifications 
            ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
            
            RAISE NOTICE 'Added is_read column';
        END IF;

        -- Add read_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'vendor_notifications' 
                       AND column_name = 'read_at') THEN
            ALTER TABLE vendor_notifications 
            ADD COLUMN read_at TIMESTAMP;
            
            RAISE NOTICE 'Added read_at column';
        END IF;

        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'vendor_notifications' 
                       AND column_name = 'updated_at') THEN
            ALTER TABLE vendor_notifications 
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            
            RAISE NOTICE 'Added updated_at column';
        END IF;

        -- Create indexes if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'vendor_notifications' 
                       AND indexname = 'idx_vendor_notifications_vendor_id') THEN
            CREATE INDEX idx_vendor_notifications_vendor_id 
            ON vendor_notifications(vendor_id);
            
            RAISE NOTICE 'Created index on vendor_id';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'vendor_notifications' 
                       AND indexname = 'idx_vendor_notifications_booking_id') THEN
            CREATE INDEX idx_vendor_notifications_booking_id 
            ON vendor_notifications(booking_id);
            
            RAISE NOTICE 'Created index on booking_id';
        END IF;

    END $$;
    `;

    await query(fixTableSQL);
    console.log('✅ vendor_notifications table fixed successfully!');
    
    // Verify table structure
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vendor_notifications'
      ORDER BY ordinal_position;
    `;
    
    const result = await query(verifyQuery);
    
    console.log('\n📊 vendor_notifications table structure:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎉 Vendor notifications table is ready for use!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing vendor_notifications table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the table fix
console.log('🚀 Starting vendor_notifications table fix...');
fixVendorNotificationsTable(); 