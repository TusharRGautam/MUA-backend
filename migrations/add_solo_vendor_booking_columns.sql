-- Migration: Add solo vendor booking columns to booking_all_details_of_user_to_vendor table
-- Date: 2024-01-21
-- Purpose: Add service_gender and vendor_type columns for solo vendor booking algorithm

-- Add new columns for solo vendor booking
DO $$
BEGIN
    -- Add service_gender column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'service_gender') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN service_gender VARCHAR(20);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.service_gender 
        IS 'Gender specification for the booked service (male, female, both)';
    END IF;

    -- Add vendor_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_type') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_type VARCHAR(20) DEFAULT 'general';
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_type 
        IS 'Type of vendor for this booking (solo, salon, general)';
    END IF;

    -- Create additional indexes for better query performance on new columns
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_service_gender') THEN
        CREATE INDEX idx_booking_service_gender 
        ON booking_all_details_of_user_to_vendor(service_gender);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_vendor_type') THEN
        CREATE INDEX idx_booking_vendor_type 
        ON booking_all_details_of_user_to_vendor(vendor_type);
    END IF;

    -- Create composite index for solo vendor booking queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_solo_vendor_query') THEN
        CREATE INDEX idx_booking_solo_vendor_query 
        ON booking_all_details_of_user_to_vendor(vendor_type, service_category, service_gender, booking_status);
    END IF;
END $$;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added service_gender and vendor_type columns to booking_all_details_of_user_to_vendor table for solo vendor booking functionality';
END $$; 