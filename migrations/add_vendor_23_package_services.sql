-- Sample data for vendor_id: 23 - Package Services
-- Created: May 20, 2025

-- ============================================
-- Add vendor_packages_services entries
-- ============================================
INSERT INTO vendor_packages_services 
(vendor_id, name, description, price, what_packages_includes, created_at, updated_at)
VALUES
(23, 'Bridal Beauty Package', 'Complete beauty package for brides', 8000, 'Bridal makeup, hair styling, facial, manicure, pedicure, draping assistance, complimentary touch-up kit, and family makeup consultation', NOW(), NOW()),
(23, 'Groom Grooming Package', 'Complete grooming package for grooms', 3500, 'Hair styling, facial, beard grooming, manicure, and light makeup for photo-ready look', NOW(), NOW()),
(23, 'Family Function Package', 'Beauty services for family special occasions', 12000, 'Makeup and hair styling for up to 4 family members, touch-up service during event, and photography consultation', NOW(), NOW()),
(23, 'Corporate Ready Package', 'Professional look package for corporate events', 2500, 'Hair styling, light makeup, manicure, and wardrobe consultation', NOW(), NOW()); 