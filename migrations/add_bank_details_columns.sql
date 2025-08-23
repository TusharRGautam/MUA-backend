-- Add Bank Details Columns to registration_and_other_details table
-- For Razorpay payout integration and vendor bank account management

-- Add bank details columns if they don't exist
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_details_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bank_details_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS bank_details_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add Razorpay-specific columns for contact and fund account management
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_fund_account_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS razorpay_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS razorpay_updated_at TIMESTAMP;

-- Add constraints and indexes for better performance and data integrity
CREATE INDEX IF NOT EXISTS idx_registration_account_number ON registration_and_other_details(account_number);
CREATE INDEX IF NOT EXISTS idx_registration_ifsc_code ON registration_and_other_details(ifsc_code);
CREATE INDEX IF NOT EXISTS idx_registration_pan_number ON registration_and_other_details(pan_number);
CREATE INDEX IF NOT EXISTS idx_registration_razorpay_contact ON registration_and_other_details(razorpay_contact_id);
CREATE INDEX IF NOT EXISTS idx_registration_razorpay_fund_account ON registration_and_other_details(razorpay_fund_account_id);

-- Add check constraints for data validation
ALTER TABLE registration_and_other_details
ADD CONSTRAINT IF NOT EXISTS chk_account_number_length CHECK (LENGTH(account_number) >= 9 AND LENGTH(account_number) <= 18),
ADD CONSTRAINT IF NOT EXISTS chk_ifsc_code_format CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
ADD CONSTRAINT IF NOT EXISTS chk_pan_number_format CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$');

-- Add comments for documentation
COMMENT ON COLUMN registration_and_other_details.account_holder_name IS 'Name as per bank account for Razorpay payouts';
COMMENT ON COLUMN registration_and_other_details.account_number IS 'Bank account number for receiving payouts';
COMMENT ON COLUMN registration_and_other_details.ifsc_code IS 'IFSC code of the bank branch';
COMMENT ON COLUMN registration_and_other_details.bank_name IS 'Name of the bank';
COMMENT ON COLUMN registration_and_other_details.branch_name IS 'Name of the bank branch';
COMMENT ON COLUMN registration_and_other_details.pan_number IS 'PAN number for tax compliance (mandatory for Razorpay)';
COMMENT ON COLUMN registration_and_other_details.bank_details_verified IS 'Whether bank details have been verified';
COMMENT ON COLUMN registration_and_other_details.razorpay_contact_id IS 'Razorpay contact ID for this vendor';
COMMENT ON COLUMN registration_and_other_details.razorpay_fund_account_id IS 'Razorpay fund account ID for payouts';
COMMENT ON COLUMN registration_and_other_details.razorpay_fund_account_status IS 'Status of Razorpay fund account (pending, active, suspended)';

-- Create or update trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_bank_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.account_holder_name IS DISTINCT FROM NEW.account_holder_name OR
      OLD.account_number IS DISTINCT FROM NEW.account_number OR
      OLD.ifsc_code IS DISTINCT FROM NEW.ifsc_code OR
      OLD.bank_name IS DISTINCT FROM NEW.bank_name OR
      OLD.branch_name IS DISTINCT FROM NEW.branch_name OR
      OLD.pan_number IS DISTINCT FROM NEW.pan_number) THEN
    NEW.bank_details_updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  IF (OLD.razorpay_contact_id IS DISTINCT FROM NEW.razorpay_contact_id OR
      OLD.razorpay_fund_account_id IS DISTINCT FROM NEW.razorpay_fund_account_id OR
      OLD.razorpay_fund_account_status IS DISTINCT FROM NEW.razorpay_fund_account_status) THEN
    NEW.razorpay_updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the table
DROP TRIGGER IF EXISTS trigger_update_bank_details_timestamp ON registration_and_other_details;
CREATE TRIGGER trigger_update_bank_details_timestamp
  BEFORE UPDATE ON registration_and_other_details
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_details_timestamp();

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
  'add_bank_details_columns', 
  CURRENT_TIMESTAMP, 
  'Added bank details and Razorpay integration columns to registration_and_other_details table'
) ON CONFLICT (migration_name) DO UPDATE SET 
  executed_at = CURRENT_TIMESTAMP,
  description = EXCLUDED.description;