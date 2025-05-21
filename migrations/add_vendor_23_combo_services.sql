-- Sample data for vendor_id: 23 - Combo Services
-- Created: May 20, 2025

-- ============================================
-- Add vendor_combo_services entries
-- ============================================
INSERT INTO vendor_combo_services 
(vendor_id, combo_service_name1, combo_service_name2, combo_description, combo_price, combo_duration, what_includes, discount, created_at, updated_at)
VALUES
(23, 'Hair & Facial Combo', 'Look Refresher', 'Complete hair styling and facial treatment for a refreshed look', 1200, 90, 'Women''s haircut, basic facial, head massage, and styling', 100, NOW(), NOW()),
(23, 'Mani-Pedi Special', 'Hand & Foot Care', 'Complete nail care package for hands and feet', 800, 60, 'Manicure with nail polish, pedicure with nail polish, hand massage, foot scrub', 100, NOW(), NOW()),
(23, 'Full Relaxation', 'Spa Day', 'Complete relaxation package with massage and facial', 2000, 120, 'Full body massage, basic facial, aromatherapy, and complimentary herbal tea', 300, NOW(), NOW()),
(23, 'Pre-Wedding Glow', 'Bride-to-be Special', 'Complete beauty package for pre-wedding preparation', 3500, 180, 'Hair styling, facial, manicure, pedicure, and makeup trial', 500, NOW(), NOW()); 