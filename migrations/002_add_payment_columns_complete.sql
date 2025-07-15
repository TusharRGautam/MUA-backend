-- Migration: Complete Payment Integration Setup
-- Date: 2024-07-13
-- Purpose: Ensure all payment-related columns are properly configured for Razorpay integration

-- Add payment-related columns if they don't exist
DO $$
BEGIN
    -- Add razorpay_payment_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_payment_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_payment_id VARCHAR(255);
        RAISE NOTICE 'Added razorpay_payment_id column';
    END IF;

    -- Add razorpay_order_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_order_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_order_id VARCHAR(255);
        RAISE NOTICE 'Added razorpay_order_id column';
    END IF;

    -- Add razorpay_signature column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'razorpay_signature') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN razorpay_signature VARCHAR(500);
        RAISE NOTICE 'Added razorpay_signature column';
    END IF;

    -- Add payment_gateway column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_gateway') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_gateway VARCHAR(50) DEFAULT 'cash';
        RAISE NOTICE 'Added payment_gateway column';
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_status') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column';
    END IF;

    -- Add payment_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_amount') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_amount DECIMAL(10,2);
        RAISE NOTICE 'Added payment_amount column';
    END IF;

    -- Add payment_currency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_currency') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_currency VARCHAR(10) DEFAULT 'INR';
        RAISE NOTICE 'Added payment_currency column';
    END IF;

    -- Add payment_date_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_date_time') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_date_time TIMESTAMP;
        RAISE NOTICE 'Added payment_date_time column';
    END IF;

    -- Add payment_failure_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'payment_failure_reason') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN payment_failure_reason TEXT;
        RAISE NOTICE 'Added payment_failure_reason column';
    END IF;

    -- Ensure booking_date and booking_time columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_date') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_date DATE;
        RAISE NOTICE 'Added booking_date column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'booking_time') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN booking_time TIME;
        RAISE NOTICE 'Added booking_time column';
    END IF;

    -- Ensure services_booked column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'services_booked') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN services_booked JSONB;
        RAISE NOTICE 'Added services_booked column';
    END IF;

    -- Ensure final_amount column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'final_amount') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN final_amount DECIMAL(10,2);
        RAISE NOTICE 'Added final_amount column';
    END IF;

    RAISE NOTICE 'Payment integration migration completed successfully!';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_payment_status ON booking_all_details_of_user_to_vendor(payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_razorpay_payment_id ON booking_all_details_of_user_to_vendor(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_booking_payment_date ON booking_all_details_of_user_to_vendor(payment_date_time);

-- Add comments to describe the columns
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_payment_id IS 'Razorpay payment ID received after successful payment';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_order_id IS 'Razorpay order ID created before payment initiation';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.razorpay_signature IS 'Razorpay signature for payment verification';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_gateway IS 'Payment gateway used (razorpay, upi, card, cash)';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_status IS 'Payment status (pending, paid, failed, refunded)';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_amount IS 'Actual amount paid';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_currency IS 'Currency used for payment (INR)';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_date_time IS 'Payment completion timestamp';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payment_failure_reason IS 'Failure reason if payment failed';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'booking_all_details_of_user_to_vendor' 
AND (column_name LIKE '%payment%' OR column_name LIKE '%razorpay%' OR column_name IN ('booking_date', 'booking_time', 'services_booked', 'final_amount'))
ORDER BY column_name; 