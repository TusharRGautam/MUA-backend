-- Migration: Add vendor contact details columns to booking_all_details_of_user_to_vendor table
-- Date: 2024-01-25
-- Purpose: Add vendor_phone_number, vendor_email, and vendor_address columns for storing vendor details when booking is accepted

DO $$
BEGIN
    -- Add vendor_phone_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_phone_number') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_phone_number VARCHAR(20);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_phone_number 
        IS 'Phone number of the vendor/artist';
        
        RAISE NOTICE 'Added vendor_phone_number column';
    END IF;

    -- Add vendor_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_email') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_email VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_email 
        IS 'Email address of the vendor/artist';
        
        RAISE NOTICE 'Added vendor_email column';
    END IF;

    -- Add vendor_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_address') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_address TEXT;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_address 
        IS 'Business address of the vendor/artist';
        
        RAISE NOTICE 'Added vendor_address column';
    END IF;

    -- Create index on vendor_email for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_vendor_email') THEN
        CREATE INDEX idx_booking_vendor_email 
        ON booking_all_details_of_user_to_vendor(vendor_email);
        
        RAISE NOTICE 'Created index on vendor_email';
    END IF;

    -- Create index on vendor_phone_number for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_vendor_phone') THEN
        CREATE INDEX idx_booking_vendor_phone 
        ON booking_all_details_of_user_to_vendor(vendor_phone_number);
        
        RAISE NOTICE 'Created index on vendor_phone_number';
    END IF;

END $$;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added vendor_phone_number, vendor_email, and vendor_address columns to booking_all_details_of_user_to_vendor table';
END $$; 