-- Add new columns to vendor_staff table
ALTER TABLE vendor_staff
ADD COLUMN specialization VARCHAR(255),
ADD COLUMN experience VARCHAR(50),
ADD COLUMN client_review TEXT;

-- Add comments to describe the vendor_staff columns
COMMENT ON COLUMN vendor_staff.specialization IS 'Staff member specialization or expertise';
COMMENT ON COLUMN vendor_staff.experience IS 'Staff member experience (e.g., "5 years")';
COMMENT ON COLUMN vendor_staff.client_review IS 'Client reviews and feedback for this staff member';

-- Add new column to vendor_packages_services table
ALTER TABLE vendor_packages_services
ADD COLUMN what_packages_includes TEXT;

-- Add comment to describe the vendor_packages_services column
COMMENT ON COLUMN vendor_packages_services.what_packages_includes IS 'Detailed description of what is included in the package'; 