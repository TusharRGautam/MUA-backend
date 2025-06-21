-- Migration: Standardize user-related column names with user_ prefix
-- Date: 2024-01-20
-- Purpose: Ensure all user-related columns in booking_all_details_of_user_to_vendor table have user_ prefix

-- Rename user-related columns to have consistent user_ prefix
DO $$
BEGIN
    -- Rename location_address to user_address
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'location_address') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        RENAME COLUMN location_address TO user_address;
        
        RAISE NOTICE 'Renamed location_address to user_address';
    END IF;

    -- Rename customer_name to user_customer_name (if it exists and user_name doesn't cover it)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'customer_name') THEN
        -- Check if user_name already exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'user_name') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_name TO user_name;
            
            RAISE NOTICE 'Renamed customer_name to user_name';
        ELSE
            -- If both exist, rename customer_name to user_customer_name for backup
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_name TO user_customer_name_backup;
            
            RAISE NOTICE 'Renamed customer_name to user_customer_name_backup (user_name already exists)';
        END IF;
    END IF;

    -- Rename customer_email to user_customer_email (if it exists and user_email doesn't cover it)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'customer_email') THEN
        -- Check if user_email already exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'user_email') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_email TO user_email;
            
            RAISE NOTICE 'Renamed customer_email to user_email';
        ELSE
            -- If both exist, rename customer_email to user_customer_email_backup for backup
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_email TO user_customer_email_backup;
            
            RAISE NOTICE 'Renamed customer_email to user_customer_email_backup (user_email already exists)';
        END IF;
    END IF;

    -- Rename customer_phone to user_customer_phone (if it exists and user_phone doesn't cover it) 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'customer_phone') THEN
        -- Check if user_phone already exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'user_phone') THEN
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_phone TO user_phone;
            
            RAISE NOTICE 'Renamed customer_phone to user_phone';
        ELSE
            -- If both exist, rename customer_phone to user_customer_phone_backup for backup
            ALTER TABLE booking_all_details_of_user_to_vendor 
            RENAME COLUMN customer_phone TO user_customer_phone_backup;
            
            RAISE NOTICE 'Renamed customer_phone to user_customer_phone_backup (user_phone already exists)';
        END IF;
    END IF;

    -- Add user_latitude and user_longitude if latitude/longitude exist without user prefix
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'latitude') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'user_latitude') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        RENAME COLUMN latitude TO user_latitude;
        
        RAISE NOTICE 'Renamed latitude to user_latitude';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'booking_all_details_of_user_to_vendor' 
               AND column_name = 'longitude') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                       AND column_name = 'user_longitude') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        RENAME COLUMN longitude TO user_longitude;
        
        RAISE NOTICE 'Renamed longitude to user_longitude';
    END IF;

    -- Add any missing user-prefixed columns that might be needed
    -- Add user_device_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'user_device_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN user_device_id VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_device_id 
        IS 'Device ID of the user who made the booking';
        
        RAISE NOTICE 'Added user_device_id column';
    END IF;

    -- Add user_city if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'user_city') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN user_city VARCHAR(100);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_city 
        IS 'City of the user who made the booking';
        
        RAISE NOTICE 'Added user_city column';
    END IF;

    -- Add user_postal_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'user_postal_code') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN user_postal_code VARCHAR(20);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_postal_code 
        IS 'Postal code of the user who made the booking';
        
        RAISE NOTICE 'Added user_postal_code column';
    END IF;

    -- Create indexes on frequently queried user columns
    -- Index on user_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_user_id') THEN
        CREATE INDEX idx_booking_user_id 
        ON booking_all_details_of_user_to_vendor(user_id);
        
        RAISE NOTICE 'Created index on user_id';
    END IF;

    -- Index on user_email
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_user_email') THEN
        CREATE INDEX idx_booking_user_email 
        ON booking_all_details_of_user_to_vendor(user_email);
        
        RAISE NOTICE 'Created index on user_email';
    END IF;

    -- Index on user_phone
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_user_phone') THEN
        CREATE INDEX idx_booking_user_phone 
        ON booking_all_details_of_user_to_vendor(user_phone);
        
        RAISE NOTICE 'Created index on user_phone';
    END IF;

END $$;

-- Print final confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Standardized all user-related column names with user_ prefix in booking_all_details_of_user_to_vendor table';
END $$; 