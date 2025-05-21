-- Sample data for vendor_id: 23 - Single Services
-- Created: May 20, 2025

-- ============================================
-- Add vendor_single_services entries
-- ============================================
INSERT INTO vendor_single_services 
(vendor_id, name, description, price, duration, type, created_at, updated_at)
VALUES
(23, 'Men''s Haircut', 'Professional haircut for men including styling', 300, 30, 'Haircare', NOW(), NOW()),
(23, 'Women''s Haircut', 'Professional haircut for women including blow dry', 500, 45, 'Haircare', NOW(), NOW()),
(23, 'Hair Coloring', 'Professional hair coloring service with premium products', 1500, 90, 'Haircare', NOW(), NOW()),
(23, 'Basic Facial', 'Cleansing facial treatment for all skin types', 800, 40, 'Skincare', NOW(), NOW()),
(23, 'Deep Cleansing Facial', 'Deep cleansing treatment for oily and acne-prone skin', 1200, 60, 'Skincare', NOW(), NOW()),
(23, 'Manicure', 'Basic nail care and polish for hands', 400, 30, 'Nails', NOW(), NOW()),
(23, 'Pedicure', 'Basic nail care and polish for feet', 500, 40, 'Nails', NOW(), NOW()),
(23, 'Full Body Massage', 'Relaxing full body massage to relieve stress', 1500, 60, 'Massage', NOW(), NOW()),
(23, 'Bridal Makeup', 'Complete bridal makeup for the special day', 5000, 120, 'Makeup', NOW(), NOW()); 