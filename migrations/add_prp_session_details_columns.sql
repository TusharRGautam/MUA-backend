-- Migration: Add PRP session timing and recurring session details columns
-- Date: 2025-07-14
-- Purpose: Add missing columns for PRP session timing and recurring session information

DO $$
BEGIN
    -- Add session_dates column for storing multiple session dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'session_dates') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN session_dates JSONB;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.session_dates 
        IS 'JSON array of dates for multiple PRP sessions';
        
        RAISE NOTICE 'Added session_dates column';
    ELSE
        RAISE NOTICE 'session_dates column already exists';
    END IF;

    -- Add session_times column for storing multiple session times
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'session_times') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN session_times JSONB;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.session_times 
        IS 'JSON array of times for multiple PRP sessions';
        
        RAISE NOTICE 'Added session_times column';
    ELSE
        RAISE NOTICE 'session_times column already exists';
    END IF;

    -- Add recurring_pattern column for storing recurring session pattern
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'recurring_pattern') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN recurring_pattern VARCHAR(50);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.recurring_pattern 
        IS 'Pattern for recurring sessions (weekly, biweekly, monthly, weekend_sat, weekend_sun)';
        
        RAISE NOTICE 'Added recurring_pattern column';
    ELSE
        RAISE NOTICE 'recurring_pattern column already exists';
    END IF;

    -- Add sessions_completed column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'sessions_completed') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN sessions_completed INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.sessions_completed 
        IS 'Number of PRP sessions completed so far';
        
        RAISE NOTICE 'Added sessions_completed column';
    ELSE
        RAISE NOTICE 'sessions_completed column already exists';
    END IF;

    -- Add next_session_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'next_session_date') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN next_session_date DATE;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.next_session_date 
        IS 'Date of the next scheduled PRP session';
        
        RAISE NOTICE 'Added next_session_date column';
    ELSE
        RAISE NOTICE 'next_session_date column already exists';
    END IF;

    -- Add treatment_plan column for storing detailed treatment information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'treatment_plan') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN treatment_plan JSONB;
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.treatment_plan 
        IS 'JSON object containing detailed treatment plan information';
        
        RAISE NOTICE 'Added treatment_plan column';
    ELSE
        RAISE NOTICE 'treatment_plan column already exists';
    END IF;

    -- Create indexes for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_recurring_pattern') THEN
        CREATE INDEX idx_booking_recurring_pattern 
        ON booking_all_details_of_user_to_vendor(recurring_pattern);
        
        RAISE NOTICE 'Created index on recurring_pattern';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_next_session_date') THEN
        CREATE INDEX idx_booking_next_session_date 
        ON booking_all_details_of_user_to_vendor(next_session_date);
        
        RAISE NOTICE 'Created index on next_session_date';
    END IF;

END $$;

-- Print final confirmation message
DO $$
BEGIN
    RAISE NOTICE 'PRP session details migration completed successfully!';
    RAISE NOTICE 'The booking_all_details_of_user_to_vendor table now supports:';
    RAISE NOTICE '- session_dates: JSON array of dates for multiple PRP sessions';
    RAISE NOTICE '- session_times: JSON array of times for multiple PRP sessions';
    RAISE NOTICE '- recurring_pattern: Pattern for recurring sessions';
    RAISE NOTICE '- sessions_completed: Number of PRP sessions completed';
    RAISE NOTICE '- next_session_date: Date of the next scheduled PRP session';
    RAISE NOTICE '- treatment_plan: JSON object with detailed treatment plan';
    RAISE NOTICE '- All existing booking and session columns';
END $$;