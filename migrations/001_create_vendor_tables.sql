-- Migration to create vendor-specific tables with proper data isolation
-- Each table enforces vendor_id reference to ensure data isolation

-- Create vendor services table
CREATE TABLE IF NOT EXISTS vendor_services (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  price VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_services_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create vendor packages table
CREATE TABLE IF NOT EXISTS vendor_packages (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_packages_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create vendor package services table (to store services included in packages)
CREATE TABLE IF NOT EXISTS vendor_package_services (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_package_services_package FOREIGN KEY (package_id) REFERENCES vendor_packages(id) ON DELETE CASCADE
);

-- Create vendor gallery images table
CREATE TABLE IF NOT EXISTS vendor_gallery_images (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_gallery_images_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create vendor transformations table (before/after)
CREATE TABLE IF NOT EXISTS vendor_transformations (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  before TEXT NOT NULL,
  after TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_transformations_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create vendor business info table
CREATE TABLE IF NOT EXISTS vendor_business_info (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  about TEXT,
  city_name VARCHAR(100),
  working_hours JSONB, -- Store working hours as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_business_info_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE,
  CONSTRAINT unique_vendor_business_info UNIQUE (vendor_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX idx_vendor_packages_vendor_id ON vendor_packages(vendor_id);
CREATE INDEX idx_vendor_package_services_package_id ON vendor_package_services(package_id);
CREATE INDEX idx_vendor_gallery_images_vendor_id ON vendor_gallery_images(vendor_id);
CREATE INDEX idx_vendor_transformations_vendor_id ON vendor_transformations(vendor_id);
CREATE INDEX idx_vendor_business_info_vendor_id ON vendor_business_info(vendor_id);

-- Add vendor_id to bookings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    -- Check if vendor_id column already exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'vendor_id') THEN
      ALTER TABLE bookings ADD COLUMN vendor_id INTEGER;
      ALTER TABLE bookings ADD CONSTRAINT fk_bookings_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE SET NULL;
      CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
    END IF;
  END IF;
END $$;

-- Create trigger functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger function to all vendor tables
DO $$
DECLARE
  tables TEXT[] := ARRAY['vendor_services', 'vendor_packages', 'vendor_package_services', 
                         'vendor_gallery_images', 'vendor_transformations', 'vendor_business_info'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE TRIGGER %I_update_timestamp
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column()', t, t);
  END LOOP;
END $$; 