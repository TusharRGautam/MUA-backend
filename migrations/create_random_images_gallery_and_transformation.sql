-- Create random_images_gallery_and_transformation table
CREATE TABLE IF NOT EXISTS random_images_gallery_and_transformation (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('gallery', 'transformation')),
    vendor_id INTEGER, -- Reference to vendor (flexible for different vendor tables)
    service_id INTEGER, -- Can reference different service tables depending on service_type
    service_type VARCHAR(20), -- 'salon', 'prp', 'diagnostics', etc.
    image_title VARCHAR(255),
    image_description TEXT,
    before_image_url TEXT, -- For transformation type, this stores the "before" image
    after_image_url TEXT,  -- For transformation type, this stores the "after" image
    is_featured BOOLEAN DEFAULT FALSE,
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_random_images_vendor_id ON random_images_gallery_and_transformation(vendor_id);
CREATE INDEX IF NOT EXISTS idx_random_images_type ON random_images_gallery_and_transformation(image_type);
CREATE INDEX IF NOT EXISTS idx_random_images_service ON random_images_gallery_and_transformation(service_id, service_type);
CREATE INDEX IF NOT EXISTS idx_random_images_featured ON random_images_gallery_and_transformation(is_featured);
CREATE INDEX IF NOT EXISTS idx_random_images_timestamp ON random_images_gallery_and_transformation(upload_timestamp);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_random_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_random_images_updated_at_trigger
    BEFORE UPDATE ON random_images_gallery_and_transformation
    FOR EACH ROW
    EXECUTE FUNCTION update_random_images_updated_at();

-- Add comments for documentation
COMMENT ON TABLE random_images_gallery_and_transformation IS 'Stores gallery and transformation images for vendors';
COMMENT ON COLUMN random_images_gallery_and_transformation.image_type IS 'Type of image: gallery or transformation';
COMMENT ON COLUMN random_images_gallery_and_transformation.vendor_id IS 'Reference to vendor (flexible for different vendor tables)';
COMMENT ON COLUMN random_images_gallery_and_transformation.service_id IS 'Reference to service (flexible for different service types)';
COMMENT ON COLUMN random_images_gallery_and_transformation.service_type IS 'Type of service: salon, prp, diagnostics, etc.';
COMMENT ON COLUMN random_images_gallery_and_transformation.before_image_url IS 'Before image URL for transformation type';
COMMENT ON COLUMN random_images_gallery_and_transformation.after_image_url IS 'After image URL for transformation type';
COMMENT ON COLUMN random_images_gallery_and_transformation.is_featured IS 'Whether this image should be featured prominently';