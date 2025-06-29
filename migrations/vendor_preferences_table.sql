-- First drop the table if it exists (for clean migration)
DROP TABLE IF EXISTS vendor_preferences;

-- Create vendor_preferences table
CREATE TABLE vendor_preferences (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  service_types JSONB,
  provider_type VARCHAR(50),
  service_categories JSONB,
  booking_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create index on vendor_id for faster lookups
CREATE INDEX idx_vendor_preferences_vendor_id ON vendor_preferences(vendor_id);

-- Add comments after table is created
COMMENT ON TABLE vendor_preferences IS 'Stores vendor preferences for service types, categories, and booking options';
COMMENT ON COLUMN vendor_preferences.service_types IS 'JSON array of service types the vendor offers (e.g., ["ready_services", "custom_services"])';
COMMENT ON COLUMN vendor_preferences.provider_type IS 'Type of service provider (e.g., "specialist", "full_salon", "multi_service")';
COMMENT ON COLUMN vendor_preferences.service_categories IS 'JSON array of service categories the vendor offers';
COMMENT ON COLUMN vendor_preferences.booking_preferences IS 'JSON object containing vendor booking preferences'; 