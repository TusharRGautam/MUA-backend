-- Migration: Add booking-specific columns to booking_all_details_of_user_to_vendor table
-- Date: 2024-01-15
-- Purpose: Add booking_id, booking_date_month, and booking_time_slot columns

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_all_details_of_user_to_vendor (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    service_name VARCHAR(255),
    service_type VARCHAR(100),
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    address TEXT,
    total_amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add the new columns if they don't already exist
DO $$
BEGIN
    -- Add booking_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_id VARCHAR(50) UNIQUE;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_id 
        IS 'Unique identifier for each booking';
    END IF;

    -- Add booking_date_month column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_date_month') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_date_month DATE;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_date_month 
        IS 'Selected booking date and month for the service';
    END IF;

    -- Add booking_time_slot column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_time_slot') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_time_slot VARCHAR(20);
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.booking_time_slot 
        IS 'Chosen time slot for the service (e.g., "10:00 AM - 11:00 AM")';
    END IF;

    -- Create index on booking_id for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_all_details_booking_id') THEN
        CREATE INDEX idx_booking_all_details_booking_id 
        ON booking_all_details_of_user_to_vendor(booking_id);
    END IF;

    -- Create index on booking_date_month for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_all_details_date') THEN
        CREATE INDEX idx_booking_all_details_date 
        ON booking_all_details_of_user_to_vendor(booking_date_month);
    END IF;
END $$;

-- Add trigger for updated_at timestamp if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                   WHERE tgname = 'update_booking_all_details_modified') THEN
        
        -- Create or replace the trigger function if it doesn't exist
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
           NEW.updated_at = CURRENT_TIMESTAMP; 
           RETURN NEW;
        END;
        $trigger$ LANGUAGE 'plpgsql';

        -- Create the trigger
        CREATE TRIGGER update_booking_all_details_modified
        BEFORE UPDATE ON booking_all_details_of_user_to_vendor
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added booking_id, booking_date_month, and booking_time_slot columns to booking_all_details_of_user_to_vendor table';
END $$; 