-- Migration: Add Push Notification Support
-- Created: 2024-01-20
-- Description: Adds push notification columns and vendor notifications table

-- Add push notification columns to registration_and_other_details table
ALTER TABLE registration_and_other_details 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP DEFAULT NOW();

-- Create vendor notifications table
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES registration_and_other_details(sr_no),
  booking_id TEXT,
  notification_type VARCHAR(50) DEFAULT 'booking',
  title TEXT,
  message TEXT,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_booking_id ON vendor_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_sent_at ON vendor_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_registration_push_token ON registration_and_other_details(push_token);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON vendor_notifications TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE vendor_notifications_id_seq TO your_db_user;

-- Add comments for documentation
COMMENT ON TABLE vendor_notifications IS 'Stores push notifications sent to vendors';
COMMENT ON COLUMN registration_and_other_details.push_token IS 'Expo push notification token for vendor';
COMMENT ON COLUMN registration_and_other_details.device_info IS 'Device information for push notifications';
COMMENT ON COLUMN registration_and_other_details.push_token_updated_at IS 'Last update timestamp for push token';

COMMIT; 