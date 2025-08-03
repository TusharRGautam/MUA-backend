-- Comprehensive Package Data Part 3 - Remaining Categories
-- Date: 2024-01-15
-- Description: Reception, Engagement, Pre-wedding, Makeup, Hair Styling, Other packages

BEGIN;

-- ==============================================
-- RECEPTION PACKAGES
-- ==============================================

-- Glamorous Reception Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=9Reception_Glam_Icon',
  'Glamorous Reception Look', 
  'female', 
  '[
    {"id": "service-40", "name": "Evening Glam Makeup", "category": "Reception", "price": 8000},
    {"id": "service-41", "name": "Elegant Hair Updo", "category": "Reception", "price": 4000},
    {"id": "service-42", "name": "Shimmer & Glow Treatment", "category": "Reception", "price": 2000},
    {"id": "service-43", "name": "Jewelry & Accessories Setup", "category": "Reception", "price": 1500}
  ]',
  'Reception',
  15500,
  180,
  'Stunning reception package with glamorous evening makeup, elegant hairstyles, and radiant glow for the perfect party look.',
  '[
    {"id": "product-40", "name": "Evening Makeup Collection"},
    {"id": "product-41", "name": "Hair Styling Products"},
    {"id": "product-42", "name": "Shimmer & Highlight Kit"},
    {"id": "product-43", "name": "Accessory Setting Tools"}
  ]',
  'Long-lasting evening makeup. Photography and video friendly. Elegant and sophisticated look.',
  'Perfect glamorous look for reception celebration',
  'Bring reception outfit for color coordination. Jewelry consultation included. Touch-up kit provided.',
  1,
  'Glam Team',
  TRUE,
  'Book 1 week in advance. Evening appointment preferred.',
  '["https://drive.google.com/uc?id=9Reception_Glam_1", "https://drive.google.com/uc?id=9Reception_Glam_2"]'
),

-- Classic Reception Package (Both)
(
  'https://drive.google.com/uc?id=10Reception_Classic_Icon',
  'Classic Reception Style', 
  'both', 
  '[
    {"id": "service-44", "name": "Classic Evening Makeup", "category": "Reception", "price": 5000},
    {"id": "service-45", "name": "Formal Hair Styling", "category": "Reception", "price": 3000},
    {"id": "service-46", "name": "Formal Grooming", "category": "Reception", "price": 2000}
  ]',
  'Reception',
  10000,
  120,
  'Classic and timeless reception styling perfect for formal evening celebrations with sophisticated makeup and styling.',
  '[
    {"id": "product-44", "name": "Classic Makeup Kit"},
    {"id": "product-45", "name": "Formal Hair Products"},
    {"id": "product-46", "name": "Grooming Essentials"}
  ]',
  'Timeless and elegant styling. Suitable for all ages. Professional appearance.',
  'Classic sophisticated look for reception',
  'Formal outfit coordination. Classic styling approach. Suitable for traditional and modern outfits.',
  1,
  'Classic Team',
  FALSE,
  'Standard booking. Flexible timing.',
  '["https://drive.google.com/uc?id=10Reception_Classic_1"]'
);

-- ==============================================
-- ENGAGEMENT PACKAGES
-- ==============================================

-- Romantic Engagement Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=11Engagement_Romantic_Icon',
  'Romantic Engagement Glow', 
  'female', 
  '[
    {"id": "service-50", "name": "Soft Romantic Makeup", "category": "Engagement", "price": 6000},
    {"id": "service-51", "name": "Romantic Hair Waves", "category": "Engagement", "price": 3500},
    {"id": "service-52", "name": "Natural Glow Enhancement", "category": "Engagement", "price": 2000},
    {"id": "service-53", "name": "Ring Ceremony Styling", "category": "Engagement", "price": 1500}
  ]',
  'Engagement',
  13000,
  150,
  'Romantic engagement package with soft, natural makeup and elegant styling perfect for this special milestone celebration.',
  '[
    {"id": "product-50", "name": "Romantic Makeup Collection"},
    {"id": "product-51", "name": "Hair Wave Products"},
    {"id": "product-52", "name": "Natural Glow Kit"},
    {"id": "product-53", "name": "Styling Accessories"}
  ]',
  'Soft and romantic appearance. Perfect for photography. Natural glow enhancement.',
  'Beautiful romantic look for engagement celebration',
  'Bring engagement outfit. Coordinate with partner styling. Photography-friendly makeup.',
  1,
  'Romance Specialist',
  FALSE,
  'Book 5 days in advance. Couple styling available.',
  '["https://drive.google.com/uc?id=11Engagement_Romantic_1"]'
),

-- Modern Engagement Package (Both)
(
  'https://drive.google.com/uc?id=12Engagement_Modern_Icon',
  'Modern Engagement Style', 
  'both', 
  '[
    {"id": "service-54", "name": "Contemporary Makeup", "category": "Engagement", "price": 4500},
    {"id": "service-55", "name": "Trendy Hair Styling", "category": "Engagement", "price": 2500},
    {"id": "service-56", "name": "Modern Grooming", "category": "Engagement", "price": 2000}
  ]',
  'Engagement',
  9000,
  120,
  'Modern and trendy engagement styling with contemporary makeup techniques and current fashion trends.',
  '[
    {"id": "product-54", "name": "Contemporary Makeup"},
    {"id": "product-55", "name": "Trendy Hair Products"},
    {"id": "product-56", "name": "Modern Grooming Kit"}
  ]',
  'Current trends and styles. Instagram-worthy looks. Modern techniques.',
  'Trendy modern look for contemporary engagement',
  'Modern outfit coordination. Social media friendly styling. Trendy techniques used.',
  1,
  'Modern Team',
  FALSE,
  'Flexible booking. Modern styling consultation.',
  '["https://drive.google.com/uc?id=12Engagement_Modern_1"]'
);

-- ==============================================
-- PRE-WEDDING PACKAGES
-- ==============================================

-- Dreamy Pre-Wedding Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=13PreWedding_Dreamy_Icon',
  'Dreamy Pre-Wedding Shoot', 
  'female', 
  '[
    {"id": "service-60", "name": "Photo Shoot Makeup", "category": "Pre-wedding", "price": 7000},
    {"id": "service-61", "name": "Multiple Hair Looks", "category": "Pre-wedding", "price": 4000},
    {"id": "service-62", "name": "Outfit Change Styling", "category": "Pre-wedding", "price": 3000},
    {"id": "service-63", "name": "Touch-up Services", "category": "Pre-wedding", "price": 1500}
  ]',
  'Pre-wedding',
  15500,
  240,
  'Complete pre-wedding shoot package with camera-ready makeup, multiple hairstyles, and styling for outfit changes.',
  '[
    {"id": "product-60", "name": "Camera-Ready Makeup"},
    {"id": "product-61", "name": "Versatile Hair Products"},
    {"id": "product-62", "name": "Quick Styling Kit"},
    {"id": "product-63", "name": "Touch-up Essentials"}
  ]',
  'Multiple looks possible. Camera and lighting optimized. Long-duration service.',
  'Perfect styling for memorable pre-wedding photos',
  'Coordinate with photographer. Multiple outfit options. Location-appropriate styling.',
  1,
  'Photo Team',
  TRUE,
  'Advance booking required. Photography coordination included.',
  '["https://drive.google.com/uc?id=13PreWedding_Dreamy_1", "https://drive.google.com/uc?id=13PreWedding_Dreamy_2"]'
);

COMMIT; 