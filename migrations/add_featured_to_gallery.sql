-- Add featured flag to vendor_gallery_images table
ALTER TABLE IF EXISTS vendor_gallery_images 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE; 