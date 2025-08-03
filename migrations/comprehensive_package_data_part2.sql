-- Comprehensive Package Data Part 2 - All Categories
-- Date: 2024-01-15
-- Description: Packages for Wedding, Haldi, Reception, Engagement, Pre-wedding, Makeup, Hair Styling, Other

BEGIN;

-- ==============================================
-- WEDDING PACKAGES
-- ==============================================

-- Luxury Wedding Package (Both Genders)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=5Wedding_Luxury_Icon',
  'Luxury Wedding Makeover', 
  'both', 
  '[
    {"id": "service-20", "name": "Luxury HD Makeup", "category": "Wedding", "price": 12000},
    {"id": "service-21", "name": "Designer Hair Styling", "category": "Wedding", "price": 6000},
    {"id": "service-22", "name": "Professional Photography Makeup", "category": "Wedding", "price": 4000},
    {"id": "service-23", "name": "Complete Styling", "category": "Wedding", "price": 3000}
  ]',
  'Wedding',
  25000,
  200,
  'Luxury wedding package suitable for both bride and groom with premium products, designer styling, and photography-ready makeup.',
  '[
    {"id": "product-20", "name": "Luxury Makeup Collection"},
    {"id": "product-21", "name": "Designer Hair Products"},
    {"id": "product-22", "name": "Photography Makeup Kit"},
    {"id": "product-23", "name": "Premium Styling Tools"}
  ]',
  'Premium luxury experience. Camera-ready makeup. Professional styling team.',
  'Luxury wedding transformation for memorable moments',
  'Premium consultation required. Photography session coordination available. Designer outfit suggestions provided.',
  1,
  'Luxury Team',
  TRUE,
  'Advance booking mandatory. Luxury package consultation required.',
  '["https://drive.google.com/uc?id=5Wedding_Luxury_1", "https://drive.google.com/uc?id=5Wedding_Luxury_2"]'
),

-- Simple Wedding Package
(
  'https://drive.google.com/uc?id=6Wedding_Simple_Icon',
  'Simple Wedding Package', 
  'both', 
  '[
    {"id": "service-24", "name": "Basic Wedding Makeup", "category": "Wedding", "price": 6000},
    {"id": "service-25", "name": "Simple Hair Styling", "category": "Wedding", "price": 3000},
    {"id": "service-26", "name": "Basic Grooming", "category": "Wedding", "price": 2000}
  ]',
  'Wedding',
  11000,
  120,
  'Simple and elegant wedding package with essential makeup and styling services for a beautiful yet understated look.',
  '[
    {"id": "product-24", "name": "Basic Makeup Kit"},
    {"id": "product-25", "name": "Simple Hair Products"},
    {"id": "product-26", "name": "Grooming Essentials"}
  ]',
  'Natural and elegant look. Budget-friendly option. Quality products used.',
  'Simple yet beautiful wedding styling',
  'Book 5 days in advance. Minimal preparation required. Focus on natural beauty enhancement.',
  1,
  'Simple Team',
  FALSE,
  'Easy booking process. No trial required.',
  '["https://drive.google.com/uc?id=6Wedding_Simple_1"]'
);

-- ==============================================
-- HALDI PACKAGES  
-- ==============================================

-- Haldi Celebration Package (Female)
INSERT INTO package_services_from_dashboard 
(icon_image, package_name, gender, service_names, category, price, duration, description, product_names, things_to_know, reason, specific_todo, vendor_id, contact_name, is_featured, booking_requirements, additional_images)
VALUES 
(
  'https://drive.google.com/uc?id=7Haldi_Female_Icon',
  'Haldi Celebration Glam', 
  'female', 
  '[
    {"id": "service-30", "name": "Waterproof Makeup", "category": "Haldi", "price": 4000},
    {"id": "service-31", "name": "Flower Hair Decoration", "category": "Haldi", "price": 2000},
    {"id": "service-32", "name": "Traditional Gajra Setting", "category": "Haldi", "price": 1500},
    {"id": "service-33", "name": "Haldi-Safe Makeup", "category": "Haldi", "price": 3000}
  ]',
  'Haldi',
  10500,
  150,
  'Special Haldi ceremony package with waterproof makeup that withstands turmeric application, flower decorations, and traditional styling.',
  '[
    {"id": "product-30", "name": "Waterproof Makeup Products"},
    {"id": "product-31", "name": "Fresh Flower Decorations"},
    {"id": "product-32", "name": "Traditional Gajra"},
    {"id": "product-33", "name": "Haldi-Resistant Products"}
  ]',
  'Waterproof and haldi-resistant products. Easy to remove after ceremony. Natural flower decorations.',
  'Perfect styling for haldi ceremony fun and photos',
  'Use waterproof base. Bring fresh flowers or we can arrange. Wear clothes suitable for haldi application.',
  1,
  'Haldi Specialist',
  FALSE,
  'Book 3 days before haldi ceremony.',
  '["https://drive.google.com/uc?id=7Haldi_Female_1"]'
),

-- Haldi Groom Package (Male)
(
  'https://drive.google.com/uc?id=8Haldi_Male_Icon',
  'Haldi Groom Ready', 
  'male', 
  '[
    {"id": "service-34", "name": "Minimal Waterproof Makeup", "category": "Haldi", "price": 2500},
    {"id": "service-35", "name": "Hair Styling with Flowers", "category": "Haldi", "price": 1500},
    {"id": "service-36", "name": "Traditional Preparation", "category": "Haldi", "price": 1000}
  ]',
  'Haldi',
  5000,
  90,
  'Groom-specific Haldi package with minimal waterproof makeup and traditional preparation for the ceremony.',
  '[
    {"id": "product-34", "name": "Waterproof Men Makeup"},
    {"id": "product-35", "name": "Hair Products & Flowers"},
    {"id": "product-36", "name": "Traditional Items"}
  ]',
  'Minimal natural enhancement. Haldi-resistant products. Traditional ceremony preparation.',
  'Groom preparation for traditional haldi ceremony',
  'Wear comfortable clothes. Products easily washable. Ceremony-appropriate styling.',
  1,
  'Haldi Specialist',
  FALSE,
  'Simple booking. Ceremony day service available.',
  '["https://drive.google.com/uc?id=8Haldi_Male_1"]'
);

COMMIT; 