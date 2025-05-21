-- Sample data for vendor_id: 23 - Gallery Images
-- Created: May 20, 2025

-- ============================================
-- Add vendor_gallery_images entries
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