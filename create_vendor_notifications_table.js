const { query } = require('./db');

async function createVendorNotificationsTable() {
  try {
    console.log('🔧 Creating vendor_notifications table...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS vendor_notifications (
      id SERIAL PRIMARY KEY,
      vendor_id INTEGER NOT NULL,
      booking_id VARCHAR(255),
      notification_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id 
    ON vendor_notifications(vendor_id);
    
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_booking_id 
    ON vendor_notifications(booking_id);
    
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_type 
    ON vendor_notifications(notification_type);
    
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_sent_at 
    ON vendor_notifications(sent_at);

    -- Add comments to table and columns
    COMMENT ON TABLE vendor_notifications IS 'Stores push notifications sent to vendors';
    COMMENT ON COLUMN vendor_notifications.vendor_id IS 'ID of the vendor receiving the notification';
    COMMENT ON COLUMN vendor_notifications.booking_id IS 'ID of the related booking (if applicable)';
    COMMENT ON COLUMN vendor_notifications.notification_type IS 'Type of notification (booking_rescheduled, booking_created, etc.)';
    COMMENT ON COLUMN vendor_notifications.title IS 'Notification title/subject';
    COMMENT ON COLUMN vendor_notifications.message IS 'Notification body/message';
    COMMENT ON COLUMN vendor_notifications.data IS 'Additional notification data in JSON format';
    COMMENT ON COLUMN vendor_notifications.sent_at IS 'When the notification was sent';
    COMMENT ON COLUMN vendor_notifications.read_at IS 'When the notification was read by the vendor';
    COMMENT ON COLUMN vendor_notifications.is_read IS 'Whether the notification has been read';
    `;

    await query(createTableSQL);
    console.log('✅ vendor_notifications table created successfully!');
    
    // Verify table was created
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
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
    console.error('❌ Error creating vendor_notifications table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the table creation
console.log('🚀 Starting vendor_notifications table creation...');
createVendorNotificationsTable(); 