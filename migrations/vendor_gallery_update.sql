-- Add image type categorization to existing vendor_gallery_images table
ALTER TABLE IF EXISTS vendor_gallery_images 
ADD COLUMN IF NOT EXISTS image_type VARCHAR(20) DEFAULT 'gallery';

-- Create an update function to ensure vendors have at least 5 gallery images
CREATE OR REPLACE FUNCTION check_gallery_image_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a delete operation and would reduce gallery count below minimum
    IF (TG_OP = 'DELETE') THEN
        -- If remaining gallery images would be less than 5, prevent deletion
        IF (SELECT COUNT(*) FROM vendor_gallery_images 
            WHERE vendor_id = OLD.vendor_id AND image_type = 'gallery') <= 5 THEN
            RAISE EXCEPTION 'Cannot delete gallery image. Minimum of 5 gallery images required.';
        END IF;
    END IF;
    
    -- For delete operations, return OLD to allow the deletion
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    
    -- For insert/update operations, return NEW
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce minimum gallery images
DROP TRIGGER IF EXISTS enforce_minimum_gallery_images ON vendor_gallery_images;
CREATE TRIGGER enforce_minimum_gallery_images
BEFORE DELETE ON vendor_gallery_images
FOR EACH ROW
EXECUTE PROCEDURE check_gallery_image_count();

-- Create a view for business analytics team
CREATE OR REPLACE VIEW vendor_image_stats AS
SELECT 
    v.vendor_id,
    v.business_name,
    v.city_name,
    (SELECT COUNT(*) FROM vendor_gallery_images g WHERE g.vendor_id = v.vendor_id AND g.image_type = 'gallery') AS gallery_count,
    (SELECT COUNT(*) FROM vendor_transformations t WHERE t.vendor_id = v.vendor_id) AS transformation_count,
    v.profile_picture IS NOT NULL AS has_profile_picture,
    (SELECT MAX(created_at) FROM vendor_gallery_images g WHERE g.vendor_id = v.vendor_id) AS last_image_upload
FROM vendor_business_info v; 