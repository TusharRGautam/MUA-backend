-- Sample data for vendor_id: 23
-- Created: May 20, 2025

-- ============================================
-- 1. Add vendor_single_services entries
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

-- ============================================
-- 2. Add vendor_combo_services entries
-- ============================================
INSERT INTO vendor_combo_services 
(vendor_id, combo_service_name1, combo_service_name2, combo_description, combo_price, combo_duration, what_includes, discount, created_at, updated_at)
VALUES
(23, 'Hair & Facial Combo', 'Look Refresher', 'Complete hair styling and facial treatment for a refreshed look', 1200, 90, 'Women''s haircut, basic facial, head massage, and styling', 100, NOW(), NOW()),
(23, 'Mani-Pedi Special', 'Hand & Foot Care', 'Complete nail care package for hands and feet', 800, 60, 'Manicure with nail polish, pedicure with nail polish, hand massage, foot scrub', 100, NOW(), NOW()),
(23, 'Full Relaxation', 'Spa Day', 'Complete relaxation package with massage and facial', 2000, 120, 'Full body massage, basic facial, aromatherapy, and complimentary herbal tea', 300, NOW(), NOW()),
(23, 'Pre-Wedding Glow', 'Bride-to-be Special', 'Complete beauty package for pre-wedding preparation', 3500, 180, 'Hair styling, facial, manicure, pedicure, and makeup trial', 500, NOW(), NOW());

-- ============================================
-- 3. Add vendor_packages_services entries
-- ============================================
INSERT INTO vendor_packages_services 
(vendor_id, name, description, price, what_packages_includes, created_at, updated_at)
VALUES
(23, 'Bridal Beauty Package', 'Complete beauty package for brides', 8000, 'Bridal makeup, hair styling, facial, manicure, pedicure, draping assistance, complimentary touch-up kit, and family makeup consultation', NOW(), NOW()),
(23, 'Groom Grooming Package', 'Complete grooming package for grooms', 3500, 'Hair styling, facial, beard grooming, manicure, and light makeup for photo-ready look', NOW(), NOW()),
(23, 'Family Function Package', 'Beauty services for family special occasions', 12000, 'Makeup and hair styling for up to 4 family members, touch-up service during event, and photography consultation', NOW(), NOW()),
(23, 'Corporate Ready Package', 'Professional look package for corporate events', 2500, 'Hair styling, light makeup, manicure, and wardrobe consultation', NOW(), NOW());

-- ============================================
-- 4. Add vendor_gallery_images entries
-- ============================================
INSERT INTO vendor_gallery_images 
(vendor_id, url, image_type, caption, created_at)
VALUES
(23, '/images/salon/salon_interior_1.jpg', 'salon', 'Our modern salon interior with state-of-the-art equipment', NOW()),
(23, '/images/salon/salon_interior_2.jpg', 'salon', 'Relaxing waiting area for our valued clients', NOW()),
(23, '/images/services/hair_styling_1.jpg', 'service', 'Professional hair styling by our experts', NOW()),
(23, '/images/services/makeup_1.jpg', 'service', 'Bridal makeup session by our chief makeup artist', NOW()),
(23, '/images/transformations/hair_before_after_1.jpg', 'transformation', 'Hair transformation - before and after', NOW()),
(23, '/images/transformations/makeup_before_after_1.jpg', 'transformation', 'Makeup transformation for a wedding function', NOW()),
(23, '/images/events/wedding_1.jpg', 'event', 'Our team providing services at a destination wedding', NOW()),
(23, '/images/staff/team_photo.jpg', 'team', 'Our talented team of beauty professionals', NOW());

-- ============================================
-- 5. Add vendor_staff entries
-- ============================================
INSERT INTO vendor_staff 
(vendor_id, name, position, email, contact_number, profile_image, skills, active, created_at, updated_at, specialization, experience, client_review)
VALUES
(23, 'Priya Sharma', 'Senior Hair Stylist', 'priya@glamourlounge.com', '+91 9876543210', '/images/staff/priya_sharma.jpg', 'Hair Cutting, Coloring, Styling', TRUE, NOW(), NOW(), 'Hair Coloring, Trendy Haircuts, Hair Treatments', '8 years', 'Priya is amazing! She understood exactly what I wanted and gave me the perfect haircut. Highly recommended! - Neha M.'),

(23, 'Vikram Desai', 'Makeup Artist', 'vikram@glamourlounge.com', '+91 9876543211', '/images/staff/vikram_desai.jpg', 'Bridal Makeup, Party Makeup, SFX', TRUE, NOW(), NOW(), 'Bridal Makeup, HD Makeup, Airbrush Techniques', '6 years', 'Vikram did my bridal makeup and it was perfect! Everyone complimented how natural yet glamorous it looked. - Anjali S.'),

(23, 'Meera Patel', 'Spa & Skincare Specialist', 'meera@glamourlounge.com', '+91 9876543212', '/images/staff/meera_patel.jpg', 'Facials, Massage, Aromatherapy', TRUE, NOW(), NOW(), 'Facials, Body Massage, Aromatherapy', '5 years', 'Meera''s massages are therapeutic and relaxing. Her facial completely transformed my skin! - Rahul D.'); 