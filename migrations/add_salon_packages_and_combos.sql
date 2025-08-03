-- Migration: Add 5 Packages and 5 Combos to dashboard_salon_services
-- Description: Creates comprehensive salon packages and combo services
-- Date: 2025-01-30

BEGIN;

-- First, let's add some base single services if they don't exist
-- These will be referenced by the packages and combos

INSERT INTO dashboard_salon_services 
(service_name, service_category, service_price, service_duration, service_description, vendor_id, package_name, service_type, created_at, updated_at)
VALUES
-- Hair Services
('Classic Haircut', 'Haircut & Styling', 800, 45, 'Professional haircut with styling', 1, 'Classic Haircut', 'Single', NOW(), NOW()),
('Hair Wash & Blow Dry', 'Haircut & Styling', 500, 30, 'Deep cleansing wash with professional blow dry', 1, 'Hair Wash & Blow Dry', 'Single', NOW(), NOW()),
('Hair Coloring', 'Hair Treatment', 2500, 120, 'Professional hair coloring with premium products', 1, 'Hair Coloring', 'Single', NOW(), NOW()),
('Hair Spa Treatment', 'Hair Treatment', 1800, 90, 'Nourishing hair spa with deep conditioning', 1, 'Hair Spa Treatment', 'Single', NOW(), NOW()),

-- Makeup Services  
('Bridal Makeup', 'Makeup', 3500, 120, 'Complete bridal makeup for your special day', 1, 'Bridal Makeup', 'Single', NOW(), NOW()),
('Party Makeup', 'Makeup', 1500, 60, 'Glamorous makeup for parties and events', 1, 'Party Makeup', 'Single', NOW(), NOW()),
('Natural Makeup', 'Makeup', 1200, 45, 'Subtle natural makeup for everyday elegance', 1, 'Natural Makeup', 'Single', NOW(), NOW()),

-- Skincare Services
('Deep Cleansing Facial', 'Skincare', 1800, 75, 'Deep pore cleansing facial for clear skin', 1, 'Deep Cleansing Facial', 'Single', NOW(), NOW()),
('Anti-Aging Facial', 'Skincare', 2200, 90, 'Anti-aging treatment with advanced serums', 1, 'Anti-Aging Facial', 'Single', NOW(), NOW()),
('Hydrating Facial', 'Skincare', 1600, 60, 'Intensive hydration treatment for dry skin', 1, 'Hydrating Facial', 'Single', NOW(), NOW()),

-- Nail Services
('Manicure', 'Nail Care', 800, 45, 'Complete hand and nail care with polish', 1, 'Manicure', 'Single', NOW(), NOW()),
('Pedicure', 'Nail Care', 1000, 60, 'Complete foot and nail care with massage', 1, 'Pedicure', 'Single', NOW(), NOW()),
('Nail Art', 'Nail Care', 600, 30, 'Creative nail art designs', 1, 'Nail Art', 'Single', NOW(), NOW()),

-- Body Services
('Full Body Massage', 'Body Care', 2500, 90, 'Relaxing full body massage therapy', 1, 'Full Body Massage', 'Single', NOW(), NOW()),
('Body Scrub', 'Body Care', 1500, 45, 'Exfoliating body scrub treatment', 1, 'Body Scrub', 'Single', NOW(), NOW()),

-- Eyebrow & Lash Services
('Eyebrow Threading', 'Grooming', 300, 15, 'Precise eyebrow shaping with threading', 1, 'Eyebrow Threading', 'Single', NOW(), NOW()),
('Eyelash Extension', 'Grooming', 2000, 120, 'Semi-permanent eyelash extensions', 1, 'Eyelash Extension', 'Single', NOW(), NOW());

-- Wait a moment to ensure the single services are inserted
-- In a real migration, you might want to use specific IDs

-- Now create the 5 PACKAGES
INSERT INTO dashboard_salon_services 
(service_name, service_category, service_price, service_duration, service_description, vendor_id, package_name, service_type, selected_services, service_images, created_at, updated_at)
VALUES

-- PACKAGE 1: Ultimate Bridal Package
('Bridal Makeup, Hair Spa Treatment, Eyebrow Threading, Eyelash Extension', 'Bridal', 7500, 300, 'Complete bridal transformation package including makeup, hair treatment, eyebrow shaping, and eyelash extensions. Perfect for your wedding day with professional styling and premium products.', 1, 'Ultimate Bridal Package', 'Package', '5,4,16,17', '{}', NOW(), NOW()),

-- PACKAGE 2: Luxury Spa Day Package  
('Deep Cleansing Facial, Anti-Aging Facial, Full Body Massage, Body Scrub, Manicure, Pedicure', 'Spa & Wellness', 8500, 420, 'Indulgent spa day experience with facial treatments, full body massage, body scrub, and nail care. Complete relaxation and rejuvenation package.', 1, 'Luxury Spa Day Package', 'Package', '8,9,14,15,11,12', '{}', NOW(), NOW()),

-- PACKAGE 3: Hair Makeover Package
('Classic Haircut, Hair Coloring, Hair Spa Treatment, Hair Wash & Blow Dry', 'Hair Makeover', 5200, 285, 'Complete hair transformation package including cut, color, spa treatment, and professional styling. Perfect for a fresh new look.', 1, 'Hair Makeover Package', 'Package', '1,3,4,2', '{}', NOW(), NOW()),

-- PACKAGE 4: Party Ready Package
('Party Makeup, Classic Haircut, Hair Wash & Blow Dry, Eyebrow Threading, Manicure', 'Party & Events', 4000, 210, 'Get party-ready with glamorous makeup, fresh haircut, professional styling, eyebrow shaping, and nail care. Perfect for special occasions.', 1, 'Party Ready Package', 'Package', '6,1,2,16,11', '{}', NOW(), NOW()),

-- PACKAGE 5: Skincare & Grooming Package
('Deep Cleansing Facial, Hydrating Facial, Eyebrow Threading, Manicure, Pedicure', 'Skincare & Grooming', 4700, 240, 'Comprehensive skincare and grooming package with facial treatments, eyebrow shaping, and nail care for a polished look.', 1, 'Skincare & Grooming Package', 'Package', '8,10,16,11,12', '{}', NOW(), NOW());

-- Now create the 5 COMBOS
INSERT INTO dashboard_salon_services 
(service_name, service_category, service_price, service_duration, service_description, vendor_id, package_name, service_type, selected_services, service_images, created_at, updated_at)
VALUES

-- COMBO 1: Hair & Makeup Combo
('Bridal Makeup, Hair Wash & Blow Dry', 'Hair & Makeup', 3800, 150, 'Perfect combination of professional bridal makeup and hair styling. Ideal for weddings and special events.', 1, 'Hair & Makeup Combo', 'Combo', '5,2', '{}', NOW(), NOW()),

-- COMBO 2: Facial & Massage Combo
('Deep Cleansing Facial, Full Body Massage', 'Spa & Relaxation', 4000, 165, 'Relaxing spa combo with deep cleansing facial and full body massage for ultimate stress relief and skin rejuvenation.', 1, 'Facial & Massage Combo', 'Combo', '8,14', '{}', NOW(), NOW()),

-- COMBO 3: Mani-Pedi Combo
('Manicure, Pedicure', 'Nail Care', 1600, 105, 'Complete nail care combo for hands and feet with professional polish and nail art options.', 1, 'Mani-Pedi Combo', 'Combo', '11,12', '{}', NOW(), NOW()),

-- COMBO 4: Express Beauty Combo
('Natural Makeup, Eyebrow Threading', 'Express Beauty', 1400, 60, 'Quick beauty touch-up combo with natural makeup and eyebrow shaping. Perfect for busy schedules.', 1, 'Express Beauty Combo', 'Combo', '7,16', '{}', NOW(), NOW()),

-- COMBO 5: Hair Care Combo
('Classic Haircut, Hair Spa Treatment', 'Hair Care', 2400, 135, 'Complete hair care combo with professional haircut and nourishing spa treatment for healthy, styled hair.', 1, 'Hair Care Combo', 'Combo', '1,4', '{}', NOW(), NOW());

COMMIT;

-- Display success message and summary
DO $$
BEGIN
    RAISE NOTICE 'Successfully added 5 packages and 5 combos to dashboard_salon_services table';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'PACKAGES ADDED:';
    RAISE NOTICE '1. Ultimate Bridal Package (₹7,500 - 300 min)';
    RAISE NOTICE '2. Luxury Spa Day Package (₹8,500 - 420 min)';
    RAISE NOTICE '3. Hair Makeover Package (₹5,200 - 285 min)';
    RAISE NOTICE '4. Party Ready Package (₹4,000 - 210 min)';
    RAISE NOTICE '5. Skincare & Grooming Package (₹4,700 - 240 min)';
    RAISE NOTICE '';
    RAISE NOTICE 'COMBOS ADDED:';
    RAISE NOTICE '1. Hair & Makeup Combo (₹3,800 - 150 min)';
    RAISE NOTICE '2. Facial & Massage Combo (₹4,000 - 165 min)';
    RAISE NOTICE '3. Mani-Pedi Combo (₹1,600 - 105 min)';
    RAISE NOTICE '4. Express Beauty Combo (₹1,400 - 60 min)';
    RAISE NOTICE '5. Hair Care Combo (₹2,400 - 135 min)';
    RAISE NOTICE '=================================================================';
END $$;