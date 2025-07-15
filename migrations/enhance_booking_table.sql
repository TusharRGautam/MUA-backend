-- Migration: Enhance booking_all_details_of_user_to_vendor table with additional fields
-- Date: 2024-01-20
-- Purpose: Add missing fields for comprehensive booking data capture

-- Add new columns to booking_all_details_of_user_to_vendor table
DO $$
BEGIN
    -- Add vendor_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'vendor_name') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN vendor_name VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_name 
        IS 'Name of the vendor/artist providing the service';
    END IF;

    -- Add user_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'user_name') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN user_name VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.user_name 
        IS 'Name of the user who made the booking';
    END IF;

    -- Add services_booked column (JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'services_booked') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN services_booked JSONB;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.services_booked 
        IS 'JSON object containing detailed service information';
    END IF;

    -- Add final_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'final_amount') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN final_amount DECIMAL(10, 2);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.final_amount 
        IS 'Final amount after applying discounts/taxes';
    END IF;

    -- Add booking_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_date') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_date DATE;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_date 
        IS 'Date when the service is scheduled';
    END IF;

    -- Add booking_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_time') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_time TIME;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_time 
        IS 'Time when the service is scheduled';
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_method') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_method VARCHAR(50);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_method 
        IS 'Payment method used (UPI, Card, Wallet, Cash)';
    END IF;

    -- Add service_category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'service_category') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN service_category VARCHAR(100);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.service_category 
        IS 'Category of the booked service (Makeup, Haircare, Mehendi, etc.)';
    END IF;

    -- Add session_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'session_count') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN session_count INTEGER;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.session_count 
        IS 'Number of PRP sessions booked';
    END IF;

    -- Add doctor_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'doctor_name') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN doctor_name VARCHAR(255);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.doctor_name 
        IS 'Name of the doctor or staff assigned for PRP treatment';
    END IF;

    -- Create additional indexes for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_vendor_id') THEN
        CREATE INDEX idx_booking_vendor_id 
        ON booking_all_details_of_user_to_vendor(vendor_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_user_id') THEN
        CREATE INDEX idx_booking_user_id 
        ON booking_all_details_of_user_to_vendor(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_status') THEN
        CREATE INDEX idx_booking_status 
        ON booking_all_details_of_user_to_vendor(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_date') THEN
        CREATE INDEX idx_booking_date 
        ON booking_all_details_of_user_to_vendor(booking_date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_service_category') THEN
        CREATE INDEX idx_booking_service_category 
        ON booking_all_details_of_user_to_vendor(service_category);
    END IF;
END $$;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Enhanced booking_all_details_of_user_to_vendor table with additional fields for comprehensive booking data capture';
END $$; 