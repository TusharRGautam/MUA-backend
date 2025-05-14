-- Migration to create vendor combo services tables

-- Table to store combo service packages
CREATE TABLE IF NOT EXISTS vendor_combo_services (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    combo_name VARCHAR(100) NOT NULL,
    combo_description TEXT,
    combo_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_combo_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Table to store individual services within a combo
CREATE TABLE IF NOT EXISTS combo_services (
    id SERIAL PRIMARY KEY,
    combo_id INTEGER NOT NULL,
    service_id INTEGER, -- Can reference vendor_single_services or vendor_services tables
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    vendor_id INTEGER NOT NULL, -- For data isolation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_combo_services_combo FOREIGN KEY (combo_id) REFERENCES vendor_combo_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_combo_services_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_combo_services_vendor_id ON vendor_combo_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_combo_services_combo_id ON combo_services(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_services_vendor_id ON combo_services(vendor_id);

-- Create trigger function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- Create triggers to update timestamps
CREATE TRIGGER update_vendor_combo_services_timestamp
BEFORE UPDATE ON vendor_combo_services
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_combo_services_timestamp
BEFORE UPDATE ON combo_services
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 