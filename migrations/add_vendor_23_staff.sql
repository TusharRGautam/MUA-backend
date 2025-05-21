-- Sample data for vendor_id: 23 - Staff
-- Created: May 20, 2025

-- ============================================
-- Add vendor_staff entries
-- ============================================
INSERT INTO vendor_staff 
(vendor_id, name, position, email, contact_number, profile_image, skills, active, created_at, updated_at, specialization, experience, client_review)
VALUES
(23, 'Priya Sharma', 'Senior Hair Stylist', 'priya@glamourlounge.com', '+91 9876543210', '/images/staff/priya_sharma.jpg', '["Hair Cutting", "Coloring", "Styling"]', TRUE, NOW(), NOW(), 'Hair Coloring, Trendy Haircuts, Hair Treatments', '8 years', 'Priya is amazing! She understood exactly what I wanted and gave me the perfect haircut. Highly recommended! - Neha M.'),

(23, 'Vikram Desai', 'Makeup Artist', 'vikram@glamourlounge.com', '+91 9876543211', '/images/staff/vikram_desai.jpg', '["Bridal Makeup", "Party Makeup", "SFX"]', TRUE, NOW(), NOW(), 'Bridal Makeup, HD Makeup, Airbrush Techniques', '6 years', 'Vikram did my bridal makeup and it was perfect! Everyone complimented how natural yet glamorous it looked. - Anjali S.'),

(23, 'Meera Patel', 'Spa & Skincare Specialist', 'meera@glamourlounge.com', '+91 9876543212', '/images/staff/meera_patel.jpg', '["Facials", "Massage", "Aromatherapy"]', TRUE, NOW(), NOW(), 'Facials, Body Massage, Aromatherapy', '5 years', 'Meera''s massages are therapeutic and relaxing. Her facial completely transformed my skin! - Rahul D.'); 