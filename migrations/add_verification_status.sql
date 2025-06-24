-- Add verification_status column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- Add comment for documentation
COMMENT ON COLUMN registration_and_other_details.verification_status IS 'Document verification status (pending, approved, rejected)';

-- Update existing records to have pending status if they have documents uploaded
UPDATE registration_and_other_details
SET verification_status = 'pending'
WHERE (aadhaar_card IS NOT NULL AND aadhaar_card != '') 
   OR (pan_card IS NOT NULL AND pan_card != '');

-- Update records without documents to have pending status (they will need to upload)
UPDATE registration_and_other_details
SET verification_status = 'pending'
WHERE verification_status IS NULL; 