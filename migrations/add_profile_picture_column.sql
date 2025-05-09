-- Add profile_picture column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN profile_picture VARCHAR(1024);

-- Add comment to describe the column's purpose
COMMENT ON COLUMN registration_and_other_details.profile_picture IS 'URL or path to the vendor profile picture'; 