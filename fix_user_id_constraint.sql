-- Fix user_id constraint for guest bookings
-- This allows null values for guest users who don't have accounts

-- Option 1: Make user_id nullable (recommended)
ALTER TABLE booking_all_details_of_user_to_vendor 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_id 
IS 'User ID - can be null for guest bookings';

-- Option 2: If you prefer to keep NOT NULL, create a default guest user
-- INSERT INTO users (id, name, email, type) VALUES (999999, 'Guest User', 'guest@system.com', 'guest')
-- ON CONFLICT (id) DO NOTHING;

-- Add remaining standardized columns if they don't exist
ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_city VARCHAR(100);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_postal_code VARCHAR(20);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_device_id VARCHAR(255);

-- Add helpful comments
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_city 
IS 'User''s city extracted from address or provided separately';

COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_postal_code 
IS 'User''s postal/ZIP code for location services';

COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_device_id 
IS 'User''s device identifier for analytics and tracking'; 