-- Add aadhaar_card and pan_card columns to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN aadhaar_card CHARACTER VARYING(20),
ADD COLUMN pan_card CHARACTER VARYING(20);

-- Add comments for documentation
COMMENT ON COLUMN registration_and_other_details.aadhaar_card IS 'Aadhaar card number for vendor identification';
COMMENT ON COLUMN registration_and_other_details.pan_card IS 'PAN card number for vendor taxation'; 