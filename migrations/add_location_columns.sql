-- Add location-related columns to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN city VARCHAR(100),
ADD COLUMN distance DECIMAL(10, 2),
ADD COLUMN longitude DECIMAL(10, 6),
ADD COLUMN latitude DECIMAL(10, 6);

-- Add comments to describe the columns' purpose
COMMENT ON COLUMN registration_and_other_details.city IS 'City where the business is located';
COMMENT ON COLUMN registration_and_other_details.distance IS 'Distance in kilometers for search radius';
COMMENT ON COLUMN registration_and_other_details.longitude IS 'Geographical longitude coordinate';
COMMENT ON COLUMN registration_and_other_details.latitude IS 'Geographical latitude coordinate'; 