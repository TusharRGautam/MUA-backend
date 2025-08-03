-- Migration: Add package_name column to dashboard_salon_services table
-- Description: Adds package_name column to store the package name for salon services
-- Date: 2025-01-11

BEGIN;

-- Add package_name column to dashboard_salon_services table
ALTER TABLE dashboard_salon_services 
ADD COLUMN IF NOT EXISTS package_name VARCHAR(255);

-- Add comment for the new column
COMMENT ON COLUMN dashboard_salon_services.package_name IS 'Package name for the salon service';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboard_salon_services_package_name 
ON dashboard_salon_services(package_name);

COMMIT; 