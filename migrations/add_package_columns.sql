-- Migration to add missing columns to vendor_packages_services and package_services tables
-- Based on the fields used in the service-list.tsx Add Package modal

-- Add description column to vendor_packages_services table
ALTER TABLE vendor_packages_services
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add columns to package_services table to match service-list.tsx Package interface
ALTER TABLE package_services
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_package_services_package_id ON package_services(package_id);

-- Update the vendor_packages_services created_at column if it's not using default timestamp
ALTER TABLE vendor_packages_services
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at timestamp and trigger if not already present
-- First check if column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'package_services' AND column_name = 'updated_at') THEN
    ALTER TABLE package_services ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    
    -- Create trigger to update timestamp on update if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_package_services_timestamp') THEN
      CREATE TRIGGER update_package_services_timestamp
      BEFORE UPDATE ON package_services
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
    END IF;
  END IF;
END $$; 