-- Add vendor payout columns to booking_all_details_of_user_to_vendor table
-- This migration adds columns to track vendor earnings and payout status

-- Add vendor earning columns
ALTER TABLE booking_all_details_of_user_to_vendor
ADD COLUMN IF NOT EXISTS vendor_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS company_commission DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payout_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payout_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payout_failure_reason TEXT,
ADD COLUMN IF NOT EXISTS payout_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS payout_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_vendor_amount ON booking_all_details_of_user_to_vendor(vendor_amount);
CREATE INDEX IF NOT EXISTS idx_booking_payout_status ON booking_all_details_of_user_to_vendor(payout_status);
CREATE INDEX IF NOT EXISTS idx_booking_payout_date ON booking_all_details_of_user_to_vendor(payout_date);
CREATE INDEX IF NOT EXISTS idx_booking_vendor_id_payout ON booking_all_details_of_user_to_vendor(vendor_id, payout_status);

-- Add constraints for data validation
ALTER TABLE booking_all_details_of_user_to_vendor
ADD CONSTRAINT IF NOT EXISTS chk_vendor_amount_positive CHECK (vendor_amount >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_company_commission_positive CHECK (company_commission >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_payout_status_valid CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

-- Add comments for documentation
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.vendor_amount IS 'Vendor earnings (75% of final_amount)';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.company_commission IS 'Company commission (25% of final_amount)';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payout_status IS 'Status of vendor payout: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payout_id IS 'Razorpay payout transaction ID';
COMMENT ON COLUMN booking_all_details_of_user_to_vendor.payout_reference IS 'Internal payout reference ID';

-- Create trigger function to automatically update payout_updated_at
CREATE OR REPLACE FUNCTION update_payout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.payout_status IS DISTINCT FROM NEW.payout_status OR
      OLD.vendor_amount IS DISTINCT FROM NEW.vendor_amount OR
      OLD.company_commission IS DISTINCT FROM NEW.company_commission) THEN
    NEW.payout_updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the table
DROP TRIGGER IF EXISTS trigger_update_payout_timestamp ON booking_all_details_of_user_to_vendor;
CREATE TRIGGER trigger_update_payout_timestamp
  BEFORE UPDATE ON booking_all_details_of_user_to_vendor
  FOR EACH ROW
  EXECUTE FUNCTION update_payout_timestamp();