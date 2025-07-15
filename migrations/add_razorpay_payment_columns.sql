-- Migration: Add Razorpay payment columns to booking_all_details_of_user_to_vendor table
-- Date: 2024-06-10
-- Purpose: Add payment-related columns for Razorpay integration

-- Add the new columns if they don't already exist
DO $$
BEGIN
    -- Add razorpay_payment_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_payment_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_payment_id VARCHAR(100);
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_payment_id 
        IS 'Razorpay payment ID received after successful payment';
    END IF;

    -- Add razorpay_order_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_order_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_order_id VARCHAR(100);
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_order_id 
        IS 'Razorpay order ID created before payment initiation';
    END IF;

    -- Add razorpay_signature column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_signature') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_signature VARCHAR(255);
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_signature 
        IS 'Razorpay signature for payment verification';
    END IF;

    -- Add payment_gateway column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_gateway') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_gateway VARCHAR(50) DEFAULT 'razorpay';
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_gateway 
        IS 'Payment gateway used for the transaction (e.g., razorpay)';
    END IF;

    -- Add payment_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_amount') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_amount DECIMAL(10, 2);
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_amount 
        IS 'Amount paid through the payment gateway';
    END IF;

    -- Add payment_currency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_currency') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_currency VARCHAR(10) DEFAULT 'INR';
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_currency 
        IS 'Currency used for the payment (e.g., INR)';
    END IF;

    -- Add payment_date_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_date_time') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_date_time TIMESTAMP;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_date_time 
        IS 'Date and time when the payment was processed';
    END IF;

    -- Add payment_failure_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_failure_reason') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_failure_reason TEXT;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_failure_reason 
        IS 'Reason for payment failure if applicable';
    END IF;

    -- Create index on razorpay_payment_id for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_razorpay_payment_id') THEN
        CREATE INDEX idx_booking_razorpay_payment_id 
        ON booking_all_details_of_user_to_vendor(razorpay_payment_id);
    END IF;

    -- Create index on razorpay_order_id for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_razorpay_order_id') THEN
        CREATE INDEX idx_booking_razorpay_order_id 
        ON booking_all_details_of_user_to_vendor(razorpay_order_id);
    END IF;

    -- Create index on payment_status for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'booking_all_details_of_user_to_vendor' 
                   AND indexname = 'idx_booking_payment_status') THEN
        CREATE INDEX idx_booking_payment_status 
        ON booking_all_details_of_user_to_vendor(payment_status);
    END IF;
END $$;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added Razorpay payment columns to booking_all_details_of_user_to_vendor table';
END $$;