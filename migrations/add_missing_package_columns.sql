-- Migration to add missing columns to package_services_from_dashboard table
-- Date: 2024-01-15
-- Description: Adds additional columns needed for complete package management

BEGIN;

-- Add additional images column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'package_services_from_dashboard' 
    AND column_name = 'additional_images'
  ) THEN
    ALTER TABLE package_services_from_dashboard 
    ADD COLUMN additional_images JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN package_services_from_dashboard.additional_images IS 'JSON array of additional image URLs for the package';
  END IF;
END $$;

-- Add contact_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'package_services_from_dashboard' 
    AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE package_services_from_dashboard 
    ADD COLUMN contact_name VARCHAR(255);
    
    COMMENT ON COLUMN package_services_from_dashboard.contact_name IS 'Contact person for the package';
  END IF;
END $$;

-- Add is_featured column for highlighting premium packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'package_services_from_dashboard' 
    AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE package_services_from_dashboard 
    ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN package_services_from_dashboard.is_featured IS 'Whether this package is featured/highlighted';
  END IF;
END $$;

-- Add booking_requirements column for special requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'package_services_from_dashboard' 
    AND column_name = 'booking_requirements'
  ) THEN
    ALTER TABLE package_services_from_dashboard 
    ADD COLUMN booking_requirements TEXT;
    
    COMMENT ON COLUMN package_services_from_dashboard.booking_requirements IS 'Special booking requirements or conditions';
  END IF;
END $$;

-- Ensure price column allows larger values
ALTER TABLE package_services_from_dashboard 
ALTER COLUMN price TYPE NUMERIC(15,2);

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_package_services_category 
ON package_services_from_dashboard(category);

-- Add index on gender for faster filtering
CREATE INDEX IF NOT EXISTS idx_package_services_gender 
ON package_services_from_dashboard(gender);

-- Add index on is_featured for faster featured package queries
CREATE INDEX IF NOT EXISTS idx_package_services_featured 
ON package_services_from_dashboard(is_featured) WHERE is_featured = TRUE;

COMMIT; 