-- Add verify_pancard_url and verify_aadharcard_url columns to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN verify_pancard_url TEXT,
ADD COLUMN verify_aadharcard_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN registration_and_other_details.verify_pancard_url IS 'URL to the uploaded PAN card verification document';
COMMENT ON COLUMN registration_and_other_details.verify_aadharcard_url IS 'URL to the uploaded Aadhaar card verification document'; 