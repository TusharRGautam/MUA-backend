-- Add specialization column to registration_and_other_details table
ALTER TABLE registration_and_other_details
ADD COLUMN specialization VARCHAR(255);

COMMENT ON COLUMN registration_and_other_details.specialization IS 'Specialization or expertise of the vendor/business';

-- Modify vendor_combo_services table
-- 1. Rename combo_name column to combo_service_name1
ALTER TABLE vendor_combo_services 
RENAME COLUMN combo_name TO combo_service_name1;

-- 2. Add new columns
ALTER TABLE vendor_combo_services
ADD COLUMN combo_service_name2 VARCHAR(255),
ADD COLUMN what_includes TEXT,
ADD COLUMN discount DECIMAL(10, 2);

-- Add comments to describe the new columns
COMMENT ON COLUMN vendor_combo_services.combo_service_name1 IS 'Primary name of the combo service (renamed from combo_name)';
COMMENT ON COLUMN vendor_combo_services.combo_service_name2 IS 'Secondary name of the combo service';
COMMENT ON COLUMN vendor_combo_services.what_includes IS 'Description of what is included in the combo service';
COMMENT ON COLUMN vendor_combo_services.discount IS 'Discount amount applied to the combo service'; 