-- Add verification_status column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'under_review'));

-- Add comment to the column
COMMENT ON COLUMN registration_and_other_details.verification_status IS 'Verification status of the vendor account (pending, verified, rejected, under_review)';

-- Create index for faster lookups by verification status
CREATE INDEX IF NOT EXISTS idx_registration_verification_status ON registration_and_other_details(verification_status); 