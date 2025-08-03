-- Add service type and selected services columns to dashboard_salon_services table

ALTER TABLE dashboard_salon_services 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'Single';

ALTER TABLE dashboard_salon_services 
ADD COLUMN IF NOT EXISTS selected_services TEXT;

-- Update description for better clarity
COMMENT ON COLUMN dashboard_salon_services.service_type IS 'Type of service: Single, Combo, or Package';
COMMENT ON COLUMN dashboard_salon_services.selected_services IS 'Comma-separated IDs of services included in Combo or Package';