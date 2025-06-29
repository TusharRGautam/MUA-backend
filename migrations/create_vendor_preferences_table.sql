-- Vendor Preferences Migration
-- This table stores vendor onboarding preferences and service routing configurations

CREATE TABLE IF NOT EXISTS vendor_preferences (
    id SERIAL PRIMARY KEY,
    vendor_email VARCHAR(255) NOT NULL UNIQUE,
    service_setup_type VARCHAR(50) NOT NULL, -- 'ready' or 'custom'
    provider_type VARCHAR(50) DEFAULT 'single', -- 'single' or 'multi'
    selected_categories TEXT, -- comma-separated list of categories
    accepts_our_services BOOLEAN DEFAULT true,
    auto_accept_bookings BOOLEAN DEFAULT false,
    max_service_radius INTEGER DEFAULT 15,
    minimum_order_amount INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_email ON vendor_preferences (vendor_email);
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_setup_type ON vendor_preferences (service_setup_type);
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_created_at ON vendor_preferences (created_at);

-- Add foreign key constraint if registration_and_other_details table exists
-- ALTER TABLE vendor_preferences 
-- ADD CONSTRAINT fk_vendor_preferences_email 
-- FOREIGN KEY (vendor_email) REFERENCES registration_and_other_details(business_email) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for faster vendor lookup
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_email ON vendor_preferences(vendor_email);
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_setup_type ON vendor_preferences(service_setup_type);
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_provider_type ON vendor_preferences(provider_type);

-- Admin Services Table (for ready services)
CREATE TABLE IF NOT EXISTS admin_services (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    base_price INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    service_icon VARCHAR(100),
    service_color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin services
INSERT INTO admin_services (category_id, category_name, service_name, service_description, base_price, duration_minutes, service_icon, service_color) VALUES
-- Hair Care
('hair-care', 'Hair Care', 'Basic Hair Cut', 'Professional hair cutting and styling', 500, 60, 'content-cut', '#6A0DAD'),
('hair-care', 'Hair Care', 'Hair Wash & Blow Dry', 'Hair washing and professional blow drying', 300, 45, 'content-cut', '#6A0DAD'),
('hair-care', 'Hair Care', 'Hair Styling', 'Special occasion hair styling', 800, 90, 'content-cut', '#6A0DAD'),

-- Hair Coloring
('hair-coloring', 'Hair Coloring', 'Full Hair Color', 'Complete hair coloring service', 2000, 180, 'color-lens', '#E75480'),
('hair-coloring', 'Hair Coloring', 'Hair Highlights', 'Partial highlighting service', 1500, 120, 'color-lens', '#E75480'),
('hair-coloring', 'Hair Coloring', 'Root Touch Up', 'Root color maintenance', 800, 60, 'color-lens', '#E75480'),

-- Facial Services
('facial', 'Facial Services', 'Basic Facial', 'Deep cleansing facial treatment', 1000, 90, 'face', '#4A90E2'),
('facial', 'Facial Services', 'Anti-Aging Facial', 'Premium anti-aging treatment', 2000, 120, 'face', '#4A90E2'),
('facial', 'Facial Services', 'Acne Treatment', 'Specialized acne facial treatment', 1500, 75, 'face', '#4A90E2'),

-- Nail Services
('nails', 'Nail Services', 'Manicure', 'Hand and nail care treatment', 600, 60, 'pan-tool', '#FF6B6B'),
('nails', 'Nail Services', 'Pedicure', 'Foot and nail care treatment', 800, 75, 'pan-tool', '#FF6B6B'),
('nails', 'Nail Services', 'Nail Art', 'Creative nail design service', 1000, 90, 'pan-tool', '#FF6B6B'),

-- Bridal Services
('bridal', 'Bridal Services', 'Bridal Makeup', 'Complete bridal makeup package', 5000, 180, 'favorite', '#8B4513'),
('bridal', 'Bridal Services', 'Bridal Hair Styling', 'Professional bridal hairstyling', 3000, 120, 'favorite', '#8B4513'),
('bridal', 'Bridal Services', 'Pre-Bridal Package', 'Complete pre-wedding beauty package', 8000, 240, 'favorite', '#8B4513'),

-- Mehendi
('mehendi', 'Mehendi', 'Bridal Mehendi', 'Intricate bridal henna designs', 3000, 180, 'brush', '#228B22'),
('mehendi', 'Mehendi', 'Simple Mehendi', 'Basic henna design service', 1000, 60, 'brush', '#228B22'),
('mehendi', 'Mehendi', 'Arabic Mehendi', 'Arabic style henna patterns', 2000, 120, 'brush', '#228B22'),

-- Massage & Spa
('massage', 'Massage & Spa', 'Full Body Massage', 'Relaxing full body massage', 2500, 90, 'spa', '#9C27B0'),
('massage', 'Massage & Spa', 'Head & Shoulder Massage', 'Targeted stress relief massage', 1200, 45, 'spa', '#9C27B0'),
('massage', 'Massage & Spa', 'Aromatherapy', 'Essential oil therapy session', 2000, 75, 'spa', '#9C27B0'),

-- Makeup
('makeup', 'Makeup', 'Party Makeup', 'Glamorous party makeup look', 2000, 90, 'face-retouching-natural', '#FF5722'),
('makeup', 'Makeup', 'Natural Makeup', 'Everyday natural makeup look', 1200, 60, 'face-retouching-natural', '#FF5722'),
('makeup', 'Makeup', 'Professional Makeup', 'High-end professional makeup', 3500, 120, 'face-retouching-natural', '#FF5722');

-- Vendor Service Selection Table (for vendors who choose ready services)
CREATE TABLE IF NOT EXISTS vendor_selected_services (
    id SERIAL PRIMARY KEY,
    vendor_email VARCHAR(255) NOT NULL,
    admin_service_id INTEGER NOT NULL REFERENCES admin_services(id),
    custom_price INTEGER, -- Vendor can customize price
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_email, admin_service_id)
);

-- Service Routing Table (for smart order assignment)
CREATE TABLE IF NOT EXISTS service_routing_rules (
    id SERIAL PRIMARY KEY,
    service_type VARCHAR(100) NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    priority_score INTEGER DEFAULT 0,
    distance_weight DECIMAL(3,2) DEFAULT 0.4,
    price_weight DECIMAL(3,2) DEFAULT 0.3,
    rating_weight DECIMAL(3,2) DEFAULT 0.3,
    auto_assign BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update vendor registration table to include new fields
ALTER TABLE registration_and_other_details 
ADD COLUMN IF NOT EXISTS provider_type_single_or_multi VARCHAR(50),
ADD COLUMN IF NOT EXISTS selected_category JSON,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_preferences_updated_at 
    BEFORE UPDATE ON vendor_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_services_updated_at 
    BEFORE UPDATE ON admin_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 