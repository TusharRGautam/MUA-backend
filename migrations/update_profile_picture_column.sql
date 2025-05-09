-- Alter profile_picture column to TEXT type to handle larger image data
ALTER TABLE registration_and_other_details 
ALTER COLUMN profile_picture TYPE TEXT;

-- Add comment explaining the change
COMMENT ON COLUMN registration_and_other_details.profile_picture IS 'URL or path to the vendor profile picture (TEXT type to handle large base64 data)'; 