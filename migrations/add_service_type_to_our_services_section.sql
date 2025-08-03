-- Add service_type column to our_services_section table

ALTER TABLE our_services_section 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'single';

-- Update description for better clarity
COMMENT ON COLUMN our_services_section.service_type IS 'Type of service: single, combo, or package';

-- Update existing records based on category names (migration logic)
UPDATE our_services_section 
SET service_type = 'combo' 
WHERE category = 'Combo Services';

UPDATE our_services_section 
SET service_type = 'package' 
WHERE category = 'Package Services';

-- All other services remain as 'single' (default)

-- Add index for better performance on service_type queries
CREATE INDEX IF NOT EXISTS idx_our_services_section_service_type 
ON our_services_section(service_type);