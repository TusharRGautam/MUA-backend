-- Fix Vendor Matching - Add Test Data
-- Run this script in your PostgreSQL database

-- 1. Create ready_services_vendors_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS ready_services_vendors_data (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    selected_categories JSONB NOT NULL,
    service_setup_type VARCHAR(50) DEFAULT 'ready',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Check existing data
SELECT 'Current vendor count in ready_services_vendors_data:' as info, COUNT(*) as count 
FROM ready_services_vendors_data;

SELECT 'Current verified vendors in registration:' as info, COUNT(*) as count 
FROM registration_and_other_details 
WHERE verification_status = 'verified';

-- 3. Update existing vendors to be verified (if any exist)
UPDATE registration_and_other_details 
SET verification_status = 'verified' 
WHERE sr_no IN (SELECT sr_no FROM registration_and_other_details LIMIT 5);

-- 4. Create test vendor if no vendors exist
INSERT INTO registration_and_other_details 
(sr_no, person_name, business_email, phone_number, verification_status, push_token, business_type)
VALUES 
(999, 'Test Hair Salon', 'test@hairsalon.com', '9876543210', 'verified', 'ExponentPushToken[test-hair-salon]', 'salon'),
(998, 'Test Beauty Parlor', 'test@beauty.com', '9876543211', 'verified', 'ExponentPushToken[test-beauty]', 'salon'),
(997, 'Test Bridal Studio', 'test@bridal.com', '9876543212', 'verified', 'ExponentPushToken[test-bridal]', 'salon')
ON CONFLICT (sr_no) DO UPDATE SET
    verification_status = 'verified',
    person_name = EXCLUDED.person_name,
    business_email = EXCLUDED.business_email,
    business_type = EXCLUDED.business_type;

-- 5. Add comprehensive service categories to vendors
INSERT INTO ready_services_vendors_data 
(vendor_id, vendor_email, selected_categories, service_setup_type)
VALUES 
-- Hair salon - covers haircut services
(999, 'test@hairsalon.com', '["Haircut", "haircut", "Hair", "hair", "Styling", "styling", "Coloring", "coloring"]', 'ready'),

-- Beauty parlor - covers facial, makeup
(998, 'test@beauty.com', '["Facial", "facial", "Makeup", "makeup", "Beauty", "beauty", "Haircut", "haircut"]', 'ready'),

-- Bridal studio - covers bridal services  
(997, 'test@bridal.com', '["Bridal", "bridal", "Makeup", "makeup", "Hair", "hair", "Mehendi", "mehendi"]', 'ready')

ON CONFLICT (vendor_id) DO UPDATE SET
    selected_categories = EXCLUDED.selected_categories,
    updated_at = CURRENT_TIMESTAMP;

-- 6. If you have existing vendors, add them with haircut category
-- This finds existing vendors and adds them to ready_services_vendors_data
INSERT INTO ready_services_vendors_data 
(vendor_id, vendor_email, selected_categories, service_setup_type)
SELECT 
    sr_no,
    COALESCE(business_email, 'vendor' || sr_no || '@test.com'),
    '["Haircut", "haircut", "Hair", "hair", "Bridal", "bridal", "Makeup", "makeup", "Facial", "facial", "Massage", "massage", "Mehendi", "mehendi", "Grooming", "grooming"]'::jsonb,
    'ready'
FROM registration_and_other_details 
WHERE sr_no NOT IN (SELECT vendor_id FROM ready_services_vendors_data)
  AND sr_no < 900  -- Avoid conflicts with test vendors
LIMIT 10
ON CONFLICT (vendor_id) DO UPDATE SET
    selected_categories = EXCLUDED.selected_categories;

-- 7. Verify the fix
SELECT 'Vendors with haircut category:' as info, COUNT(*) as count
FROM ready_services_vendors_data rsv
JOIN registration_and_other_details reg ON rsv.vendor_id = reg.sr_no
WHERE reg.verification_status = 'verified'
  AND rsv.selected_categories::text ILIKE '%haircut%';

-- 8. Show sample data
SELECT 
    rsv.vendor_id,
    reg.person_name,
    reg.verification_status,
    rsv.selected_categories
FROM ready_services_vendors_data rsv
JOIN registration_and_other_details reg ON rsv.vendor_id = reg.sr_no
WHERE reg.verification_status = 'verified'
LIMIT 5;

-- Success message
SELECT '🎉 Vendor matching data has been added! Test the booking system now.' as message; 