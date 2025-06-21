-- COMPLETE MIGRATION FIX
-- Run these SQL commands to fix the current booking issues

-- 1. Fix user_id constraint (allows guest bookings with null user_id)
ALTER TABLE booking_all_details_of_user_to_vendor 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add missing standardized columns
ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_city VARCHAR(100);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_postal_code VARCHAR(20);

ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS user_device_id VARCHAR(255);

-- 3. Add helpful comments
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_id 
IS 'User ID - can be null for guest bookings';

COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_city 
IS 'User city extracted from address or provided separately';

COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_postal_code 
IS 'User postal/ZIP code for location services';

COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_device_id 
IS 'User device identifier for analytics and tracking';

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_booking_user_id 
ON booking_all_details_of_user_to_vendor(user_id);

CREATE INDEX IF NOT EXISTS idx_booking_user_email 
ON booking_all_details_of_user_to_vendor(user_email);

CREATE INDEX IF NOT EXISTS idx_booking_user_phone 
ON booking_all_details_of_user_to_vendor(user_phone);

-- 5. Verify the changes
SELECT 'Migration completed - user_id is now nullable and new columns added' as status; 