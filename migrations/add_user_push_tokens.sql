-- Migration: Add User Push Token Support to Customer_Table_Details
-- Created: 2024-01-20
-- Description: Adds push notification columns to Customer_Table_Details table for user notifications

-- Add push notification columns to Customer_Table_Details table
ALTER TABLE Customer_Table_Details 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_push_token ON Customer_Table_Details(push_token);
CREATE INDEX IF NOT EXISTS idx_customer_push_token_updated ON Customer_Table_Details(push_token_updated_at);

-- Add comments for documentation
COMMENT ON COLUMN Customer_Table_Details.push_token IS 'Expo push notification token for customer';
COMMENT ON COLUMN Customer_Table_Details.device_info IS 'Device information for push notifications';
COMMENT ON COLUMN Customer_Table_Details.push_token_updated_at IS 'Timestamp when push token was last updated';

-- Also add to user_profiles table if it exists (for Supabase users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS push_token TEXT,
        ADD COLUMN IF NOT EXISTS device_info JSONB,
        ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP DEFAULT NOW();
        
        CREATE INDEX IF NOT EXISTS idx_user_profiles_push_token ON user_profiles(push_token);
        
        COMMENT ON COLUMN user_profiles.push_token IS 'Expo push notification token for user';
        COMMENT ON COLUMN user_profiles.device_info IS 'Device information for push notifications';
    END IF;
END $$; 