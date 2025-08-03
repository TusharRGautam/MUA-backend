-- Comprehensive PRP Packages Data
-- Date: 2025-06-19
-- This file contains detailed PRP service packages across multiple categories

-- Clear existing data first (optional - remove if you want to keep existing data)
-- TRUNCATE TABLE prp_services_from_dashboard_and_app RESTART IDENTITY CASCADE;

-- Insert comprehensive PRP packages data
INSERT INTO prp_services_from_dashboard_and_app (
  icon_image, 
  package_name, 
  package_duration, 
  number_of_sessions, 
  package_description, 
  package_includes, 
  selected_days, 
  package_price, 
  category, 
  gender, 
  service_details, 
  benefits, 
  preparation_instructions, 
  aftercare_instructions, 
  expected_results, 
  is_featured, 
  contraindications, 
  age_range, 
  vendor_id
) VALUES

-- ============ HAIR PRP PACKAGES ============

-- 1. Premium Hair PRP Treatment (Featured)
(
  'https://drive.google.com/uc?export=view&id=1Hair_PRP_Premium_Icon',
  'Premium Hair PRP Restoration',
  '90 minutes per session',
  6,
  'Advanced hair restoration therapy using concentrated platelet-rich plasma to stimulate hair follicles, promote natural hair growth, and improve hair density. This premium package includes comprehensive consultation, advanced PRP extraction, and specialized injection techniques.',
  'Pre-treatment consultation, Advanced PRP extraction, Scalp analysis, 6 PRP sessions, Nutritional guidance, Hair growth monitoring, Post-treatment follow-ups, Complementary hair care products',
  '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
  45000.00,
  'Hair PRP',
  'both',
  '{
    "session_interval": "2-3 weeks",
    "technique": "Micro-injection technique",
    "equipment": "Advanced centrifuge system",
    "blood_volume": "20ml per session",
    "injection_depth": "2-4mm",
    "coverage_area": "Full scalp",
    "anesthesia": "Topical numbing cream",
    "consultation_time": "30 minutes"
  }',
  'Stimulates hair follicles, Increases hair density by 60-80%, Reduces hair fall, Improves hair texture and strength, Natural hair growth promotion, Enhanced scalp circulation, Stronger hair roots, Improved hair thickness',
  'Avoid blood-thinning medications 1 week prior, Stay hydrated, Wash hair with mild shampoo on treatment day, Avoid alcohol 48 hours before, Get adequate sleep, Eat protein-rich diet',
  'Avoid washing hair for 24 hours, No direct sun exposure for 2 days, Avoid strenuous exercise for 24 hours, Use prescribed hair care products, Gentle hair handling, Avoid chemical treatments for 2 weeks',
  'Initial results visible in 3-4 months, Significant improvement in 6-8 months, Peak results at 12 months, Long-lasting effects for 18-24 months',
  true,
  'Active scalp infections, Autoimmune disorders, Blood clotting disorders, Pregnancy and breastfeeding, Cancer patients, Severe scalp psoriasis',
  '21-65',
  23
),

-- 2. Essential Hair PRP Package
(
  'https://drive.google.com/uc?export=view&id=2Hair_PRP_Essential_Icon',
  'Essential Hair PRP Treatment',
  '60 minutes per session',
  4,
  'Effective hair restoration treatment using platelet-rich plasma to combat hair loss and promote healthy hair growth. This essential package provides fundamental PRP therapy with professional care and guidance.',
  'Initial consultation, Basic PRP extraction, 4 PRP sessions, Scalp preparation, Basic aftercare guidance, Progress monitoring',
  '["Monday", "Wednesday", "Friday", "Saturday"]',
  28000.00,
  'Hair PRP',
  'both',
  '{
    "session_interval": "3-4 weeks",
    "technique": "Standard injection technique",
    "equipment": "Standard centrifuge",
    "blood_volume": "15ml per session",
    "injection_depth": "2-3mm",
    "coverage_area": "Problem areas",
    "anesthesia": "Topical numbing",
    "consultation_time": "20 minutes"
  }',
  'Reduces hair fall, Strengthens existing hair, Improves hair quality, Stimulates dormant follicles, Enhanced scalp health, Natural hair growth',
  'Avoid anti-inflammatory drugs 3 days prior, Stay well-hydrated, Clean hair before treatment, Avoid smoking 24 hours before',
  'No hair washing for 12 hours, Avoid heat styling for 48 hours, Use gentle hair products, Protect scalp from sun',
  'Reduced hair fall in 6-8 weeks, New hair growth in 3-4 months, Noticeable improvement in 6 months',
  false,
  'Active scalp infections, Autoimmune conditions, Blood disorders, Pregnancy, Recent scalp injury',
  '18-60',
  23
),

-- ============ FACE PRP PACKAGES ============

-- 3. Vampire Facial Premium (Featured)
(
  'https://drive.google.com/uc?export=view&id=3Face_PRP_Vampire_Icon',
  'Vampire Facial Premium',
  '120 minutes per session',
  4,
  'Luxurious anti-aging treatment combining microneedling with platelet-rich plasma for ultimate skin rejuvenation. This premium vampire facial promotes collagen production, reduces fine lines, and gives you radiant, youthful skin.',
  'Comprehensive skin analysis, Professional microneedling, PRP extraction and application, 4 treatment sessions, LED light therapy, Premium skincare products, Detailed aftercare kit, Follow-up consultations',
  '["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
  35000.00,
  'Face PRP',
  'both',
  '{
    "session_interval": "4-6 weeks",
    "microneedling_depth": "0.5-2.5mm",
    "technique": "Automated microneedling + PRP",
    "blood_volume": "15ml per session",
    "led_therapy": "20 minutes red light",
    "numbing_time": "30 minutes",
    "treatment_area": "Full face and neck",
    "aftercare_products": "Included"
  }',
  'Dramatic skin rejuvenation, Reduces wrinkles and fine lines, Improves skin texture and tone, Tightens sagging skin, Minimizes pore size, Enhances natural glow, Stimulates collagen production, Evens skin pigmentation',
  'Avoid retinoids 1 week prior, No sun exposure 48 hours before, Discontinue blood thinners, Stay hydrated, Use gentle skincare',
  'Avoid makeup for 24 hours, No direct sunlight for 1 week, Use prescribed skincare products, Gentle face washing, Apply sunscreen daily',
  'Immediate glow after treatment, Significant improvement in 4-6 weeks, Optimal results in 3-4 months, Effects last 12-18 months',
  true,
  'Active acne, Skin infections, Keloid scarring tendency, Pregnancy, Blood disorders, Recent facial procedures',
  '25-65',
  23
),

-- 4. Facial PRP Anti-Aging
(
  'https://drive.google.com/uc?export=view&id=4Face_PRP_AntiAging_Icon',
  'Facial PRP Anti-Aging Treatment',
  '90 minutes per session',
  3,
  'Professional anti-aging treatment using your own platelet-rich plasma to naturally rejuvenate facial skin, reduce signs of aging, and restore youthful appearance.',
  'Skin consultation, PRP extraction, 3 facial PRP sessions, Basic aftercare guidance, Progress photos, Skincare recommendations',
  '["Monday", "Tuesday", "Thursday", "Friday", "Saturday"]',
  22000.00,
  'Face PRP',
  'both',
  '{
    "session_interval": "4-5 weeks",
    "technique": "Micro-injection",
    "blood_volume": "12ml per session",
    "injection_depth": "1-2mm",
    "treatment_area": "Face and neck",
    "numbing": "Topical anesthetic",
    "session_duration": "90 minutes"
  }',
  'Reduces fine lines, Improves skin elasticity, Natural collagen boost, Enhanced skin hydration, Smoother skin texture, Youthful appearance',
  'Avoid alcohol 24 hours before, No retinoids 3 days prior, Stay hydrated, Clean skin before treatment',
  'No makeup for 12 hours, Avoid sun exposure, Use gentle cleanser, Apply moisturizer regularly',
  'Gradual improvement over 2-3 months, Best results after completing all sessions, Effects last 8-12 months',
  false,
  'Active facial infections, Severe acne, Pregnancy, Blood clotting disorders, Recent cosmetic procedures',
  '30-65',
  23
),

-- ============ JOINT PRP PACKAGES ============

-- 5. Joint PRP Therapy Premium (Featured)
(
  'https://drive.google.com/uc?export=view&id=5Joint_PRP_Premium_Icon',
  'Joint PRP Therapy Premium',
  '45 minutes per session',
  3,
  'Advanced orthopedic treatment using platelet-rich plasma to treat joint pain, arthritis, and sports injuries. This premium package includes comprehensive assessment, precise injection techniques, and complete rehabilitation guidance.',
  'Orthopedic consultation, X-ray analysis, PRP extraction, 3 joint injections, Physical therapy guidance, Pain management plan, Recovery monitoring, Follow-up care',
  '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
  40000.00,
  'Joint PRP',
  'both',
  '{
    "session_interval": "2-3 weeks",
    "injection_technique": "Ultrasound-guided",
    "blood_volume": "30ml per session",
    "common_joints": ["Knee", "Shoulder", "Hip", "Ankle", "Elbow"],
    "preparation_time": "60 minutes",
    "local_anesthesia": "Yes",
    "imaging_guidance": "Ultrasound"
  }',
  'Reduces joint pain, Improves mobility, Accelerates healing, Reduces inflammation, Delays need for surgery, Natural pain relief, Enhanced joint function, Long-lasting results',
  'Avoid anti-inflammatory drugs 1 week prior, Stay hydrated, Light meal before treatment, Wear comfortable clothing',
  'Rest for 24-48 hours, Avoid strenuous activity for 1 week, Apply ice as needed, Follow physiotherapy plan, Gradual return to activities',
  'Pain reduction in 2-4 weeks, Significant improvement in 6-8 weeks, Maximum benefit in 3-6 months, Effects last 12-18 months',
  true,
  'Active joint infections, Severe arthritis requiring surgery, Blood disorders, Pregnancy, Cancer, Immunosuppression',
  '18-75',
  23
),

-- 6. Sports Injury PRP Recovery
(
  'https://drive.google.com/uc?export=view&id=6Sports_PRP_Recovery_Icon',
  'Sports Injury PRP Recovery',
  '60 minutes per session',
  2,
  'Specialized PRP treatment for athletes and active individuals to accelerate recovery from sports injuries, reduce downtime, and enhance performance.',
  'Sports medicine consultation, Injury assessment, PRP preparation, 2 targeted injections, Recovery protocol, Return-to-sport guidance',
  '["Monday", "Wednesday", "Friday", "Saturday"]',
  25000.00,
  'Joint PRP',
  'both',
  '{
    "session_interval": "1-2 weeks",
    "target_injuries": ["Tendon injuries", "Muscle strains", "Ligament sprains"],
    "blood_volume": "20ml per session",
    "injection_technique": "Precise targeting",
    "recovery_protocol": "Customized",
    "follow_up": "Regular monitoring"
  }',
  'Faster injury healing, Reduced recovery time, Enhanced tissue repair, Pain relief, Improved performance, Natural healing acceleration',
  'Avoid NSAIDs 5 days prior, Maintain fitness level, Stay hydrated, Pre-treatment stretching',
  'Modified activity for 48 hours, Gradual return to training, Ice therapy, Physiotherapy compliance',
  'Initial improvement in 1-2 weeks, Significant healing in 4-6 weeks, Full recovery accelerated',
  false,
  'Complete tendon rupture, Acute infections, Blood disorders, Recent steroid injections',
  '16-50',
  23
),

-- ============ SKIN PRP PACKAGES ============

-- 7. Skin Rejuvenation PRP Deluxe
(
  'https://drive.google.com/uc?export=view&id=7Skin_PRP_Deluxe_Icon',
  'Skin Rejuvenation PRP Deluxe',
  '105 minutes per session',
  4,
  'Comprehensive skin rejuvenation treatment using advanced PRP techniques to address multiple skin concerns including aging, acne scars, pigmentation, and overall skin quality improvement.',
  'Detailed skin analysis, Professional photography, PRP extraction, 4 rejuvenation sessions, Customized skincare regimen, Progress tracking, Home care products',
  '["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
  32000.00,
  'Skin PRP',
  'both',
  '{
    "session_interval": "3-4 weeks",
    "technique": "Multi-layer injection",
    "blood_volume": "15ml per session",
    "treatment_areas": ["Face", "Neck", "Décolletage"],
    "depth_levels": "Multiple",
    "additional_treatments": "Optional microneedling",
    "skin_analysis": "Digital imaging"
  }',
  'Overall skin rejuvenation, Scar reduction, Improved skin texture, Even skin tone, Reduced pigmentation, Enhanced skin radiance, Tightened skin, Youthful appearance',
  'Gentle skincare routine 1 week prior, No chemical peels 2 weeks before, Avoid sun exposure, Stay hydrated',
  'Gentle skincare for 1 week, Sun protection essential, Use recommended products, Avoid harsh treatments',
  'Visible improvement in 4-6 weeks, Continued improvement over 3-4 months, Optimal results in 6 months',
  false,
  'Active skin infections, Severe acne, Pregnancy, Autoimmune skin conditions, Recent skin procedures',
  '25-60',
  23
),

-- 8. Acne Scar PRP Treatment
(
  'https://drive.google.com/uc?export=view&id=8Acne_Scar_PRP_Icon',
  'Acne Scar PRP Treatment',
  '75 minutes per session',
  5,
  'Specialized PRP treatment specifically designed to improve acne scars, reduce pitted scars, and smooth skin texture for a more even complexion.',
  'Scar assessment, PRP preparation, 5 targeted treatments, Scar monitoring, Skincare guidance, Progress documentation',
  '["Monday", "Wednesday", "Friday", "Saturday"]',
  27000.00,
  'Skin PRP',
  'both',
  '{
    "session_interval": "2-3 weeks",
    "scar_types": ["Ice pick", "Boxcar", "Rolling scars"],
    "technique": "Targeted injection",
    "blood_volume": "12ml per session",
    "combination_therapy": "Optional microneedling",
    "assessment_method": "Digital photography"
  }',
  'Reduces acne scar appearance, Improves skin texture, Smooths uneven skin, Stimulates collagen formation, Enhanced skin healing, Better skin tone',
  'Active acne must be controlled, No retinoids 1 week prior, Gentle skincare, Avoid picking at skin',
  'No makeup for 24 hours, Gentle cleansing, Sun protection, Use prescribed products, Avoid irritating ingredients',
  'Gradual scar improvement over 3-4 months, Continued improvement up to 6 months, Significant texture improvement',
  false,
  'Active severe acne, Keloid scarring tendency, Skin infections, Pregnancy, Recent isotretinoin use',
  '18-45',
  23
);

-- Update selected_days for all records to ensure proper JSON format
UPDATE prp_services_from_dashboard_and_app 
SET selected_days = CASE 
  WHEN selected_days IS NULL THEN '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'
  ELSE selected_days
END;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prp_category ON prp_services_from_dashboard_and_app(category);
CREATE INDEX IF NOT EXISTS idx_prp_gender ON prp_services_from_dashboard_and_app(gender);
CREATE INDEX IF NOT EXISTS idx_prp_featured ON prp_services_from_dashboard_and_app(is_featured);
CREATE INDEX IF NOT EXISTS idx_prp_price ON prp_services_from_dashboard_and_app(package_price);

-- Statistics after insertion
DO $$
DECLARE
  total_count INTEGER;
  featured_count INTEGER;
  category_counts TEXT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM prp_services_from_dashboard_and_app;
  SELECT COUNT(*) INTO featured_count FROM prp_services_from_dashboard_and_app WHERE is_featured = true;
  
  SELECT string_agg(category_summary, ', ') INTO category_counts
  FROM (
    SELECT category || ': ' || COUNT(*) || ' packages' as category_summary
    FROM prp_services_from_dashboard_and_app 
    GROUP BY category 
    ORDER BY category
  ) t;
  
  RAISE NOTICE 'PRP Packages Data Summary:';
  RAISE NOTICE '- Total packages inserted: %', total_count;
  RAISE NOTICE '- Featured packages: %', featured_count;
  RAISE NOTICE '- Categories: %', category_counts;
  RAISE NOTICE 'Successfully inserted comprehensive PRP packages data!';
END $$; 