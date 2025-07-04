-- Create the dashboard_salon_services table
CREATE TABLE IF NOT EXISTS dashboard_salon_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_categories VARCHAR(255),
    price DECIMAL(10, 2),
    duration INT, -- Duration in minutes
    description TEXT,
    things_to_know TEXT,
    what_packages_include TEXT,
    precautions TEXT,
    products_used TEXT,
    before_and_after_image TEXT, -- URL or path to before and after image
    gallery_image TEXT, -- URL or path to gallery image
    service_image TEXT, -- URL or path to service image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the dashboard_prp_services table
CREATE TABLE IF NOT EXISTS dashboard_prp_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_categories VARCHAR(255),
    price DECIMAL(10, 2),
    duration INT, -- Duration in minutes
    description TEXT,
    things_to_know TEXT,
    what_packages_include TEXT,
    precautions TEXT,
    products_used TEXT,
    before_and_after_image TEXT, -- URL or path to before and after image
    gallery_image TEXT, -- URL or path to gallery image
    service_image TEXT, -- URL or path to service image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the dashboard_diagnostics_services table
CREATE TABLE IF NOT EXISTS dashboard_diagnostics_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_categories VARCHAR(255),
    price DECIMAL(10, 2),
    duration INT, -- Duration in minutes
    description TEXT,
    things_to_know TEXT,
    what_packages_include TEXT,
    precautions TEXT,
    products_used TEXT,
    before_and_after_image TEXT, -- URL or path to before and after image
    gallery_image TEXT, -- URL or path to gallery image
    service_image TEXT, -- URL or path to service image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salon_service_name ON dashboard_salon_services(service_name);
CREATE INDEX IF NOT EXISTS idx_prp_service_name ON dashboard_prp_services(service_name);
CREATE INDEX IF NOT EXISTS idx_diagnostics_service_name ON dashboard_diagnostics_services(service_name);

-- Add timestamps trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_dashboard_salon_services_updated_at
    BEFORE UPDATE ON dashboard_salon_services
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_dashboard_prp_services_updated_at
    BEFORE UPDATE ON dashboard_prp_services
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_dashboard_diagnostics_services_updated_at
    BEFORE UPDATE ON dashboard_diagnostics_services
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column(); 