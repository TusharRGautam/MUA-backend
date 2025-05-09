-- Add device_id column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN registration_and_other_details.device_id IS 'Unique device identifier for the installation'; 