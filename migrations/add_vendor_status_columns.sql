-- Add vendor_status column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS vendor_status VARCHAR(20) DEFAULT 'active';

-- Add status_updated_at column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update the vendor_status column for existing records with a default value
UPDATE registration_and_other_details
SET vendor_status = 'active'
WHERE vendor_status IS NULL;

-- Update the status_updated_at column for existing records
UPDATE registration_and_other_details
SET status_updated_at = CURRENT_TIMESTAMP
WHERE status_updated_at IS NULL;

-- Add comment to describe the columns' purpose
COMMENT ON COLUMN registration_and_other_details.vendor_status IS 'Current status of the vendor (active/inactive)';
COMMENT ON COLUMN registration_and_other_details.status_updated_at IS 'Timestamp of the last vendor status update'; 