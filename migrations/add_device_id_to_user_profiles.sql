-- Add device_id column to user_profiles table for customer device tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN user_profiles.device_id IS 'Unique device identifier for the customer installation'; 