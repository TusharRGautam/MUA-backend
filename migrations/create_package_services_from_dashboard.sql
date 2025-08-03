-- Migration: Create package_services_from_dashboard table
-- Description: Creates a new table to store package services data from the dashboard

BEGIN;

-- Drop the table if it exists (for re-running migrations)
DROP TABLE IF EXISTS package_services_from_dashboard;

-- Create the new table
CREATE TABLE package_services_from_dashboard (
    id SERIAL PRIMARY KEY,
    icon_image TEXT,                  -- URL to the icon image (Google Drive link)
    package_name VARCHAR(255) NOT NULL, -- Name of the package
    gender VARCHAR(50),               -- Gender (male, female, both)
    service_names JSONB,              -- Array of service names within the package
    category VARCHAR(100),            -- Category of the package
    price NUMERIC(10, 2),             -- Price of the package
    duration INTEGER,                 -- Duration of the package in minutes
    description TEXT,                 -- Description of the package
    product_names JSONB,              -- Array of product names used in the package
    things_to_know TEXT,              -- Things to know about the package
    reason TEXT,                      -- Reason for creating the package
    specific_todo TEXT,               -- Specific to-do items for the package
    vendor_id INTEGER,                -- Reference to vendor ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on vendor_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_package_services_vendor_id'
  ) THEN
    CREATE INDEX idx_package_services_vendor_id ON package_services_from_dashboard(vendor_id);
  END IF;
END
$$;

-- Add comments to table and columns for documentation
COMMENT ON TABLE package_services_from_dashboard IS 'Stores package services data created from the dashboard';
COMMENT ON COLUMN package_services_from_dashboard.icon_image IS 'URL to the package icon image (typically a Google Drive link)';
COMMENT ON COLUMN package_services_from_dashboard.package_name IS 'Name of the service package';
COMMENT ON COLUMN package_services_from_dashboard.gender IS 'Gender for which the package is intended (male, female, both)';
COMMENT ON COLUMN package_services_from_dashboard.service_names IS 'JSON array of service names included in the package';
COMMENT ON COLUMN package_services_from_dashboard.category IS 'Category of the package';
COMMENT ON COLUMN package_services_from_dashboard.price IS 'Price of the package';
COMMENT ON COLUMN package_services_from_dashboard.duration IS 'Duration of the package in minutes';
COMMENT ON COLUMN package_services_from_dashboard.description IS 'Description of the package';
COMMENT ON COLUMN package_services_from_dashboard.product_names IS 'JSON array of product names used in the package';
COMMENT ON COLUMN package_services_from_dashboard.things_to_know IS 'Important information about the package';
COMMENT ON COLUMN package_services_from_dashboard.reason IS 'Reason for creating the package';
COMMENT ON COLUMN package_services_from_dashboard.specific_todo IS 'Specific to-do items for the package';
COMMENT ON COLUMN package_services_from_dashboard.vendor_id IS 'Reference to the vendor ID';

COMMIT; 