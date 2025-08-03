-- Migration: Create dashboard service tables
-- Description: Creates tables for salon, PRP, and diagnostics services from dashboard
-- Date: 2025-01-01

BEGIN;

-- Create dashboard_salon_services table
CREATE TABLE IF NOT EXISTS dashboard_salon_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    service_duration INTEGER NOT NULL, -- in minutes
    service_description TEXT,
    vendor_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_prp_services table
CREATE TABLE IF NOT EXISTS dashboard_prp_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    service_duration INTEGER NOT NULL, -- in minutes
    service_sessions INTEGER NOT NULL DEFAULT 1,
    service_description TEXT,
    included_services TEXT,
    vendor_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_diagnostics_services table
CREATE TABLE IF NOT EXISTS dashboard_diagnostics_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    service_duration INTEGER NOT NULL, -- in minutes
    service_description TEXT,
    preparation_requirements TEXT,
    home_collection VARCHAR(10) DEFAULT 'no' CHECK (home_collection IN ('yes', 'no')),
    report_delivery_time VARCHAR(50), -- e.g., '24 hours', '2-3 days'
    included_services TEXT,
    vendor_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE dashboard_salon_services IS 'Stores salon services created from dashboard';
COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP services created from dashboard';
COMMENT ON TABLE dashboard_diagnostics_services IS 'Stores diagnostic services created from dashboard';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_salon_services_vendor_id ON dashboard_salon_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_salon_services_category ON dashboard_salon_services(service_category);

CREATE INDEX IF NOT EXISTS idx_dashboard_prp_services_vendor_id ON dashboard_prp_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_prp_services_category ON dashboard_prp_services(service_category);

CREATE INDEX IF NOT EXISTS idx_dashboard_diagnostics_services_vendor_id ON dashboard_diagnostics_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_diagnostics_services_category ON dashboard_diagnostics_services(service_category);

COMMIT;

RAISE NOTICE 'Dashboard service tables created successfully';