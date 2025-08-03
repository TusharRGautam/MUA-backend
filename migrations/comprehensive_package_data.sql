-- Comprehensive Package Data for package_services_from_dashboard
-- Date: 2024-01-15
-- Description: Complete package data with bridal, groom, and all category packages

BEGIN;

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM package_services_from_dashboard;

-- ==============================================
-- BRIDAL PACKAGES (Female)
-- ==============================================

-- Premium Bridal Package
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=1Bridal_Premium_Icon',
  'Premium Bridal Makeover', 
  'female', 
  '[
    {"id": "service-1", "name": "HD Bridal Makeup", "category": "Bridal", "price": 15000},
    {"id": "service-2", "name": "Hair Styling & Setting", "category": "Bridal", "price": 8000},
    {"id": "service-3", "name": "Mehendi Application", "category": "Bridal", "price": 5000},
    {"id": "service-4", "name": "Saree Draping", "category": "Bridal", "price": 3000},
    {"id": "service-5", "name": "Jewelry Setting", "category": "Bridal", "price": 2000}
  ]',
  'Bridal',
  33000,
  300,
  'Complete premium bridal transformation package including HD makeup, elaborate hair styling, traditional mehendi, expert saree draping, and jewelry arrangement. Perfect for the most important day of your life.',
  '[
    {"id": "product-1", "name": "HD Foundation & Concealer"},
    {"id": "product-2", "name": "Waterproof Makeup Set"},
    {"id": "product-3", "name": "Hair Extensions & Accessories"},
    {"id": "product-4", "name": "Natural Mehendi Paste"},
    {"id": "product-5", "name": "Setting Spray & Powder"}
  ]',
  'Book 2 weeks in advance. Trial session recommended. Makeup lasts 12+ hours. Includes touch-up kit.',
  'Complete bridal transformation for the most special day',
  'Trial makeup session 1 week before wedding. Arrive with clean face and washed hair. Bring jewelry and outfit. Have assistant present for saree draping.',
  1,
  'Priya Sharma',
  TRUE,
  'Advance booking required. Trial session mandatory. 50% advance payment.',
  '["https://drive.google.com/uc?id=1Bridal_Premium_1", "https://drive.google.com/uc?id=1Bridal_Premium_2"]'
),

-- Traditional Bridal Package
(
  'https://drive.google.com/uc?id=2Bridal_Traditional_Icon',
  'Traditional Bridal Package', 
  'female', 
  '[
    {"id": "service-6", "name": "Traditional Bridal Makeup", "category": "Bridal", "price": 12000},
    {"id": "service-7", "name": "Classic Hair Bun", "category": "Bridal", "price": 5000},
    {"id": "service-8", "name": "Basic Mehendi", "category": "Bridal", "price": 3000},
    {"id": "service-9", "name": "Traditional Jewelry Setting", "category": "Bridal", "price": 1500}
  ]',
  'Bridal',
  21500,
  240,
  'Classic traditional bridal package with authentic makeup techniques, traditional hairstyles, and cultural elements for a timeless bridal look.',
  '[
    {"id": "product-6", "name": "Traditional Makeup Kit"},
    {"id": "product-7", "name": "Flower Decorations"},
    {"id": "product-8", "name": "Traditional Hair Accessories"},
    {"id": "product-9", "name": "Natural Beauty Products"}
  ]',
  'Traditional techniques passed down through generations. Uses natural and safe products.',
  'Authentic traditional bridal transformation',
  'Bring traditional jewelry and outfit. Hair should be oil-free. Cultural music can be arranged.',
  1,
  'Priya Sharma',
  FALSE,
  'Book 10 days in advance. Cultural consultation included.',
  '["https://drive.google.com/uc?id=2Bridal_Traditional_1"]'
);

-- ==============================================
-- GROOM PACKAGES (Male)  
-- ==============================================

-- Premium Groom Package
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=3Groom_Premium_Icon',
  'Premium Groom Makeover', 
  'male', 
  '[
    {"id": "service-10", "name": "HD Makeup for Groom", "category": "Wedding", "price": 8000},
    {"id": "service-11", "name": "Premium Hair Styling", "category": "Wedding", "price": 4000},
    {"id": "service-12", "name": "Beard Trimming & Styling", "category": "Wedding", "price": 2000},
    {"id": "service-13", "name": "Turban/Pagdi Styling", "category": "Wedding", "price": 3000},
    {"id": "service-14", "name": "Complete Grooming", "category": "Wedding", "price": 3000}
  ]',
  'Wedding',
  20000,
  180,
  'Complete premium groom transformation with HD makeup, professional hair styling, beard grooming, traditional turban arrangement, and overall grooming for the perfect groom look.',
  '[
    {"id": "product-10", "name": "Men HD Foundation"},
    {"id": "product-11", "name": "Hair Styling Products"},
    {"id": "product-12", "name": "Beard Grooming Kit"},
    {"id": "product-13", "name": "Traditional Turban Material"},
    {"id": "product-14", "name": "Grooming Essentials"}
  ]',
  'Natural masculine enhancement. Long-lasting results. Includes grooming consultation.',
  'Complete groom transformation for wedding day confidence',
  'Clean shave or trimmed beard required 2 days before. Bring turban/pagdi material if specific design needed. Have all accessories ready.',
  1,
  'Rajesh Kumar',
  TRUE,
  'Advance booking required. Grooming consultation included.',
  '["https://drive.google.com/uc?id=3Groom_Premium_1", "https://drive.google.com/uc?id=3Groom_Premium_2"]'
),

-- Traditional Groom Package
(
  'https://drive.google.com/uc?id=4Groom_Traditional_Icon',
  'Traditional Groom Package', 
  'male', 
  '[
    {"id": "service-15", "name": "Light Makeup for Photos", "category": "Wedding", "price": 5000},
    {"id": "service-16", "name": "Traditional Hair Styling", "category": "Wedding", "price": 2500},
    {"id": "service-17", "name": "Turban/Pagdi Assistance", "category": "Wedding", "price": 2500},
    {"id": "service-18", "name": "Basic Grooming", "category": "Wedding", "price": 2000}
  ]',
  'Wedding',
  12000,
  120,
  'Essential traditional groom package with subtle makeup for photography, traditional hairstyling, and turban arrangement assistance.',
  '[
    {"id": "product-15", "name": "Light Foundation"},
    {"id": "product-16", "name": "Hair Oil & Styling"},
    {"id": "product-17", "name": "Traditional Accessories"},
    {"id": "product-18", "name": "Basic Grooming Kit"}
  ]',
  'Subtle enhancement maintaining natural look. Traditional techniques used.',
  'Traditional groom styling for cultural ceremonies',
  'Schedule 3 hours before baraat. Bring turban/pagdi material. Have assistant present for traditional styling.',
  1,
  'Rajesh Kumar',
  FALSE,
  'Book 7 days in advance. Cultural styling consultation.',
  '["https://drive.google.com/uc?id=4Groom_Traditional_1"]'
);

COMMIT; 