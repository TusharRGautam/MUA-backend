-- Add business_name column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN business_name VARCHAR(255);

-- Update the business_name column for existing records (can be set to person_name initially)
UPDATE registration_and_other_details
SET business_name = person_name
WHERE business_name IS NULL;

-- Add comment to describe the column's purpose
COMMENT ON COLUMN registration_and_other_details.business_name IS 'Name of the business or salon'; 