-- Migration: Add icon_image column to dashboard_prp_services table
-- Description: Adds icon_image column to store ImageKit URLs for PRP service icons
-- Date: 2025-01-11

BEGIN;

-- Add icon_image column to dashboard_prp_services table
ALTER TABLE dashboard_prp_services 
ADD COLUMN IF NOT EXISTS icon_image TEXT;

-- Add comment for the new column
COMMENT ON COLUMN dashboard_prp_services.icon_image IS 'ImageKit URL for PRP service icon image';

-- Create index for better query performance (optional, since it's not frequently queried)
-- CREATE INDEX IF NOT EXISTS idx_dashboard_prp_services_icon_image 
-- ON dashboard_prp_services(icon_image) WHERE icon_image IS NOT NULL;

COMMIT; 