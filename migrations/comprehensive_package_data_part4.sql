-- Comprehensive Package Data Part 4 - Final Categories
-- Date: 2024-01-15
-- Description: Makeup, Hair Styling, and Other category packages

BEGIN;

-- ==============================================
-- MAKEUP PACKAGES
-- ==============================================

-- Professional Makeup Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=14Makeup_Professional_Icon',
  'Professional Makeup Artistry', 
  'female', 
  '[
    {"id": "service-70", "name": "HD Professional Makeup", "category": "Makeup", "price": 5000},
    {"id": "service-71", "name": "Contouring & Highlighting", "category": "Makeup", "price": 2000},
    {"id": "service-72", "name": "Eye Makeup Specialist", "category": "Makeup", "price": 2500},
    {"id": "service-73", "name": "Lip Art & Definition", "category": "Makeup", "price": 1000}
  ]',
  'Makeup',
  10500,
  120,
  'Professional makeup artistry with advanced techniques, contouring, highlighting, and specialized eye and lip makeup.',
  '[
    {"id": "product-70", "name": "HD Makeup Professional Kit"},
    {"id": "product-71", "name": "Contouring Palette"},
    {"id": "product-72", "name": "Eye Makeup Collection"},
    {"id": "product-73", "name": "Lip Color Range"}
  ]',
  'Professional makeup techniques. Long-lasting results. Photo and video ready.',
  'Expert makeup application for any occasion',
  'Skin preparation advised. Bring reference photos if specific look desired. Suitable for all skin types.',
  1,
  'Makeup Artist Pro',
  TRUE,
  'Professional consultation included. Book 3 days ahead.',
  '["https://drive.google.com/uc?id=14Makeup_Professional_1", "https://drive.google.com/uc?id=14Makeup_Professional_2"]'
),

-- Natural Makeup Package (Both)
(
  'https://drive.google.com/uc?id=15Makeup_Natural_Icon',
  'Natural Everyday Makeup', 
  'both', 
  '[
    {"id": "service-74", "name": "Natural Base Makeup", "category": "Makeup", "price": 2500},
    {"id": "service-75", "name": "Subtle Eye Enhancement", "category": "Makeup", "price": 1500},
    {"id": "service-76", "name": "Natural Lip Color", "category": "Makeup", "price": 800},
    {"id": "service-77", "name": "Grooming & Finishing", "category": "Makeup", "price": 1200}
  ]',
  'Makeup',
  6000,
  90,
  'Natural and subtle makeup perfect for everyday wear, office, or casual events with minimal yet polished appearance.',
  '[
    {"id": "product-74", "name": "Natural Makeup Collection"},
    {"id": "product-75", "name": "Subtle Eye Products"},
    {"id": "product-76", "name": "Natural Lip Colors"},
    {"id": "product-77", "name": "Finishing Products"}
  ]',
  'Natural enhancement. Suitable for daily wear. Light and comfortable.',
  'Natural beauty enhancement for everyday confidence',
  'Quick and easy application. Suitable for all ages. Focus on enhancing natural features.',
  1,
  'Natural Beauty Expert',
  FALSE,
  'Easy booking. Same-day service available.',
  '["https://drive.google.com/uc?id=15Makeup_Natural_1"]'
);

-- ==============================================
-- HAIR STYLING PACKAGES
-- ==============================================

-- Elaborate Hair Styling Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=16Hair_Elaborate_Icon',
  'Elaborate Hair Artistry', 
  'female', 
  '[
    {"id": "service-80", "name": "Intricate Hair Braiding", "category": "Hair Styling", "price": 4000},
    {"id": "service-81", "name": "Hair Extensions & Volume", "category": "Hair Styling", "price": 3000},
    {"id": "service-82", "name": "Decorative Hair Accessories", "category": "Hair Styling", "price": 2000},
    {"id": "service-83", "name": "Hair Texturing & Curls", "category": "Hair Styling", "price": 2500}
  ]',
  'Hair Styling',
  11500,
  180,
  'Elaborate hair styling with intricate braiding, extensions, decorative accessories, and professional texturing techniques.',
  '[
    {"id": "product-80", "name": "Professional Hair Tools"},
    {"id": "product-81", "name": "Hair Extensions Collection"},
    {"id": "product-82", "name": "Decorative Accessories"},
    {"id": "product-83", "name": "Texturing Products"}
  ]',
  'Complex hairstyles. Long-lasting hold. Professional techniques used.',
  'Stunning elaborate hairstyles for special occasions',
  'Hair should be clean and dry. Bring any specific accessories desired. Time-intensive service.',
  1,
  'Hair Artist Expert',
  TRUE,
  'Advance booking required. Consultation recommended.',
  '["https://drive.google.com/uc?id=16Hair_Elaborate_1", "https://drive.google.com/uc?id=16Hair_Elaborate_2"]'
),

-- Simple Hair Styling Package (Both)
(
  'https://drive.google.com/uc?id=17Hair_Simple_Icon',
  'Simple & Elegant Hair Styling', 
  'both', 
  '[
    {"id": "service-84", "name": "Basic Hair Styling", "category": "Hair Styling", "price": 2000},
    {"id": "service-85", "name": "Hair Washing & Conditioning", "category": "Hair Styling", "price": 1000},
    {"id": "service-86", "name": "Hair Setting & Finishing", "category": "Hair Styling", "price": 1500}
  ]',
  'Hair Styling',
  4500,
  90,
  'Simple and elegant hair styling with basic techniques, proper washing, conditioning, and professional finishing.',
  '[
    {"id": "product-84", "name": "Basic Hair Styling Kit"},
    {"id": "product-85", "name": "Shampoo & Conditioner"},
    {"id": "product-86", "name": "Setting Products"}
  ]',
  'Simple yet elegant results. Quick service. Suitable for regular occasions.',
  'Clean and polished hair styling',
  'Quick and efficient service. Suitable for regular events. Focus on neat and tidy appearance.',
  1,
  'Hair Styling Team',
  FALSE,
  'Walk-in service available. Easy booking.',
  '["https://drive.google.com/uc?id=17Hair_Simple_1"]'
);

-- ==============================================
-- OTHER PACKAGES
-- ==============================================

-- Special Occasion Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=18Other_Special_Icon',
  'Special Occasion Styling', 
  'female', 
  '[
    {"id": "service-90", "name": "Custom Occasion Makeup", "category": "Other", "price": 4000},
    {"id": "service-91", "name": "Event-Specific Styling", "category": "Other", "price": 3000},
    {"id": "service-92", "name": "Outfit Coordination", "category": "Other", "price": 1500},
    {"id": "service-93", "name": "Photography Prep", "category": "Other", "price": 2000}
  ]',
  'Other',
  10500,
  150,
  'Customized styling for special occasions including festivals, parties, corporate events, or any celebration requiring professional appearance.',
  '[
    {"id": "product-90", "name": "Versatile Makeup Kit"},
    {"id": "product-91", "name": "Styling Tools Collection"},
    {"id": "product-92", "name": "Coordination Accessories"},
    {"id": "product-93", "name": "Photography Makeup"}
  ]',
  'Customizable to any occasion. Professional advice included. Flexible service.',
  'Perfect styling for any special occasion',
  'Discuss occasion details in advance. Bring outfit for coordination. Flexible timing available.',
  1,
  'Special Events Team',
  FALSE,
  'Flexible booking. Occasion consultation required.',
  '["https://drive.google.com/uc?id=18Other_Special_1"]'
),

-- Corporate & Professional Package (Both)
(
  'https://drive.google.com/uc?id=19Other_Corporate_Icon',
  'Corporate & Professional Look', 
  'both', 
  '[
    {"id": "service-94", "name": "Professional Makeup", "category": "Other", "price": 3000},
    {"id": "service-95", "name": "Corporate Hair Styling", "category": "Other", "price": 2000},
    {"id": "service-96", "name": "Professional Grooming", "category": "Other", "price": 1500}
  ]',
  'Other',
  6500,
  90,
  'Professional corporate styling perfect for business meetings, interviews, corporate events, or professional photography.',
  '[
    {"id": "product-94", "name": "Professional Makeup Kit"},
    {"id": "product-95", "name": "Corporate Hair Products"},
    {"id": "product-96", "name": "Professional Grooming Kit"}
  ]',
  'Professional and polished appearance. Suitable for business environment.',
  'Professional styling for corporate success',
  'Understand dress code requirements. Suitable for business environment. Quick and efficient service.',
  1,
  'Corporate Team',
  FALSE,
  'Corporate packages available. Flexible scheduling.',
  '["https://drive.google.com/uc?id=19Other_Corporate_1"]'
);

-- ==============================================
-- SUMMARY STATISTICS
-- ==============================================

-- Add a comment with package count summary
COMMENT ON TABLE package_services_from_dashboard IS '
Comprehensive package database with the following distribution:
- Bridal: 2 packages (Premium & Traditional)
- Wedding: 4 packages (2 General + 2 Groom-specific)
- Haldi: 2 packages (Female & Male)
- Reception: 2 packages (Glamorous & Classic)
- Engagement: 2 packages (Romantic & Modern)
- Pre-wedding: 1 package (Dreamy)
- Makeup: 2 packages (Professional & Natural)
- Hair Styling: 2 packages (Elaborate & Simple)
- Other: 2 packages (Special Occasion & Corporate)
Total: 19 comprehensive packages covering all categories and genders
';

COMMIT; 