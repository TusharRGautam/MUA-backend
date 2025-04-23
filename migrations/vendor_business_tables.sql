-- Vendor Business Information
CREATE TABLE IF NOT EXISTS vendor_business_info (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL UNIQUE, -- Foreign key to vendor account
    business_name VARCHAR(100) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    about TEXT,
    working_hours JSONB NOT NULL DEFAULT '{}', -- Store as JSON with day keys and open/close/isOpen values
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Individual Services offered by vendors
CREATE TABLE IF NOT EXISTS vendor_single_services (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Service category/type
    price VARCHAR(20) NOT NULL, -- Store as string to match frontend format "₹XXX"
    duration VARCHAR(20), -- Duration of service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_service FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Service Packages
CREATE TABLE IF NOT EXISTS vendor_packages_services (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    price VARCHAR(20) NOT NULL, -- Total package price
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_package FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Individual services within packages
CREATE TABLE IF NOT EXISTS package_services (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL, -- Service name
    price VARCHAR(20) NOT NULL, -- Individual service price
    CONSTRAINT fk_package FOREIGN KEY (package_id) REFERENCES vendor_packages_services(id) ON DELETE CASCADE
);

-- Transformations (Before/After)
CREATE TABLE IF NOT EXISTS vendor_transformations (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    before_image VARCHAR(255) NOT NULL, -- Image path
    after_image VARCHAR(255) NOT NULL, -- Image path
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_transformation FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Gallery Images
CREATE TABLE IF NOT EXISTS vendor_gallery_images (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    url VARCHAR(255) NOT NULL, -- Image path
    caption VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_gallery FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE IF NOT EXISTS vendor_bookings (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, denied, started, completed
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- paid, pending, failed
    contact_number VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    is_new BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_booking FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_business_info
BEFORE UPDATE ON vendor_business_info
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_vendor_single_services
BEFORE UPDATE ON vendor_single_services
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_vendor_packages_services
BEFORE UPDATE ON vendor_packages_services
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_vendor_bookings
BEFORE UPDATE ON vendor_bookings
FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 