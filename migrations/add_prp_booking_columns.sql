-- Migration: Add PRP booking specific columns to booking_all_details_of_user_to_vendor table
-- Date: 2024-12-20
-- Purpose: Add missing columns for PRP booking functionality

DO $$
BEGIN
    -- Add session_count column for PRP bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'session_count') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN session_count INTEGER;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.session_count 
        IS 'Number of PRP sessions booked';
        
        RAISE NOTICE 'Added session_count column';
    ELSE
        RAISE NOTICE 'session_count column already exists';
    END IF;

    -- Add doctor_name column for PRP bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'doctor_name') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN doctor_name VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.doctor_name 
        IS 'Name of the doctor or staff assigned for PRP treatment';
        
        RAISE NOTICE 'Added doctor_name column';
    ELSE
        RAISE NOTICE 'doctor_name column already exists';
    END IF;

    -- Add custom_user_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'custom_user_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN custom_user_id VARCHAR(10);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.custom_user_id 
        IS 'Custom user ID linking to customer or vendor (CLUB01XX format)';
        
        RAISE NOTICE 'Added custom_user_id column';
    ELSE
        RAISE NOTICE 'custom_user_id column already exists';
    END IF;

    -- Add vendor_business_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_business_type') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_business_type VARCHAR(50);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_business_type 
        IS 'Type of vendor business (Medical, Salon, Solo, etc.)';
        
        RAISE NOTICE 'Added vendor_business_type column';
    ELSE
        RAISE NOTICE 'vendor_business_type column already exists';
    END IF;

    -- Add booking_source column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_source') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_source VARCHAR(50) DEFAULT 'mobile_app';
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_source 
        IS 'Source of the booking (mobile_app, web, walk_in, etc.)';
        
        RAISE NOTICE 'Added booking_source column';
    ELSE
        RAISE NOTICE 'booking_source column already exists';
    END IF;

    -- Add booking_status column if not exists (different from status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_status') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_status VARCHAR(50) DEFAULT 'pending';
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_status 
        IS 'Status of the booking (pending, confirmed, completed, cancelled)';
        
        RAISE NOTICE 'Added booking_status column';
    ELSE
        RAISE NOTICE 'booking_status column already exists';
    END IF;

    -- Create indexes for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_session_count') THEN
        CREATE INDEX idx_booking_session_count 
        ON booking_all_details_of_user_to_vendor(session_count);
        
        RAISE NOTICE 'Created index on session_count';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_doctor_name') THEN
        CREATE INDEX idx_booking_doctor_name 
        ON booking_all_details_of_user_to_vendor(doctor_name);
        
        RAISE NOTICE 'Created index on doctor_name';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_custom_user_id') THEN
        CREATE INDEX idx_booking_custom_user_id 
        ON booking_all_details_of_user_to_vendor(custom_user_id);
        
        RAISE NOTICE 'Created index on custom_user_id';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_vendor_business_type') THEN
        CREATE INDEX idx_booking_vendor_business_type 
        ON booking_all_details_of_user_to_vendor(vendor_business_type);
        
        RAISE NOTICE 'Created index on vendor_business_type';
    END IF;

END $$;

-- Print final confirmation message
DO $$
BEGIN
    RAISE NOTICE 'PRP booking migration completed successfully!';
    RAISE NOTICE 'The booking_all_details_of_user_to_vendor table now supports:';
    RAISE NOTICE '- session_count: Number of PRP sessions';
    RAISE NOTICE '- doctor_name: Assigned doctor/staff name';
    RAISE NOTICE '- custom_user_id: Custom user identification';
    RAISE NOTICE '- vendor_business_type: Type of vendor business';
    RAISE NOTICE '- booking_source: Source of the booking';
    RAISE NOTICE '- booking_status: Status of the booking';
    RAISE NOTICE '- All existing payment and booking columns';
END $$; 