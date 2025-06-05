-- Add working_hours column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN IF NOT EXISTS working_hours VARCHAR(255);

-- Update the working_hours column for existing records with a default value
UPDATE registration_and_other_details
SET working_hours = '09:00 AM - 06:00 PM'
WHERE working_hours IS NULL;

-- Add comment to describe the column's purpose
COMMENT ON COLUMN registration_and_other_details.working_hours IS 'Vendor business hours in format like "9:00 AM - 5:00 PM"'; 