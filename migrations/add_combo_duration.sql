-- Migration to add combo_duration field to vendor_combo_services table

-- Add combo_duration column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'vendor_combo_services' 
    AND column_name = 'combo_duration'
  ) THEN
    ALTER TABLE vendor_combo_services
    ADD COLUMN combo_duration INTEGER DEFAULT 0 NOT NULL;
  END IF;
END
$$;

-- Update any existing records to have a default duration
UPDATE vendor_combo_services 
SET combo_duration = 60 
WHERE combo_duration IS NULL OR combo_duration = 0; 