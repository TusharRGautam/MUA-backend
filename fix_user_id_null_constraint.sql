-- Fix user_id constraint for guest bookings
-- Run this SQL script in your database to allow NULL user_id values

-- Step 1: Remove the NOT NULL constraint from user_id column
ALTER TABLE booking_all_details_of_user_to_vendor 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Check if there's a foreign key constraint that doesn't allow NULL
-- If the foreign key constraint doesn't allow NULL, we need to modify it
-- First, let's see the current constraint name:
SELECT conname, confrelid::regclass AS foreign_table
FROM pg_constraint 
WHERE conrelid = 'booking_all_details_of_user_to_vendor'::regclass 
AND contype = 'f' 
AND conkey::text LIKE '%1%';  -- user_id is typically the first column

-- Step 3: Create a temporary guest user if needed (alternative approach)
-- Insert a guest user with ID 0 if it doesn't exist
INSERT INTO customer_table_details (id, full_name, email, phone_number, custom_user_id, password)
VALUES (0, 'Guest User', 'guest@carelook.com', '0000000000', 'guest0', 'guest123')
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'booking_all_details_of_user_to_vendor' 
AND column_name = 'user_id'; 