-- Simple Vendor Preferences Table Migration
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