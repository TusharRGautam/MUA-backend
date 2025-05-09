-- Add device_id column to profiles table for customer device tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN profiles.device_id IS 'Unique device identifier for the customer installation'; 