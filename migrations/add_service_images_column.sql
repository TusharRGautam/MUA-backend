-- Add service_images column to dashboard_salon_services table for storing multiple images

ALTER TABLE dashboard_salon_services 
ADD COLUMN IF NOT EXISTS service_images TEXT;

-- Update description for better clarity
COMMENT ON COLUMN dashboard_salon_services.service_images IS 'JSON string containing service-specific images for Combo and Package types';