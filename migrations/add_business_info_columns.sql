-- Add business_address and business_description columns to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN business_address TEXT,
ADD COLUMN business_description TEXT;

-- Add comments to describe the columns' purpose
COMMENT ON COLUMN registration_and_other_details.business_address IS 'Physical address of the business';
COMMENT ON COLUMN registration_and_other_details.business_description IS 'Description of the business services and details'; 