-- 006_add_indian_profiles.sql
-- Migration to add Indian profiles for different profile types

-- Create temporary table for business owners to help with insertions
CREATE TEMP TABLE temp_business_owners (
    id UUID DEFAULT gen_random_uuid(),
    business_name VARCHAR(255),
    owner_name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    business_type VARCHAR(50),
    address TEXT
);

-- Insert sample business owners with Indian details
INSERT INTO temp_business_owners (business_name, owner_name, email, phone_number, business_type, address)
VALUES
    ('Lakshmi Beauty Salon', 'Lakshmi Agarwal', 'lakshmi@example.com', '+919876543210', 'salon', 'M.G. Road, Bangalore, Karnataka'),
    ('Meenakshi Makeup Studio', 'Meenakshi Sharma', 'meenakshi@example.com', '+919876543211', 'salon', 'Jubilee Hills, Hyderabad, Telangana'),
    ('Brijesh Hair Academy', 'Brijesh Singh', 'brijesh@example.com', '+919876543212', 'salon', 'Linking Road, Mumbai, Maharashtra'),
    ('Royal Beauty Studio', 'Rajveer Kapoor', 'rajveer@example.com', '+919876543213', 'salon', 'Connaught Place, New Delhi, Delhi'),
    ('Ananya Bridal Salon', 'Ananya Gupta', 'ananya@example.com', '+919876543214', 'salon', 'Park Street, Kolkata, West Bengal'),
    ('Divine Beauty Bar', 'Divya Malhotra', 'divya@example.com', '+919876543215', 'salon', 'M.G. Road, Pune, Maharashtra'),
    ('Deepika Glow Studio', 'Deepika Patel', 'deepika@example.com', '+919876543216', 'salon', 'Anna Nagar, Chennai, Tamil Nadu'),
    ('Ramesh Wellness Centre', 'Ramesh Reddy', 'ramesh@example.com', '+919876543217', 'prp', 'Koramangala, Bangalore, Karnataka'),
    ('Sunil Skin Experts', 'Sunil Kumar', 'sunil@example.com', '+919876543218', 'prp', 'Punjagutta, Hyderabad, Telangana'),
    ('Neeta Beauty Academy', 'Neeta Joshi', 'neeta@example.com', '+919876543219', 'prp', 'Bandra, Mumbai, Maharashtra'),
    ('Preeti Makeup Class', 'Preeti Singh', 'preeti@example.com', '+919876543220', 'prp', 'Vasant Kunj, New Delhi, Delhi'),
    ('Vedic Wellness Studio', 'Vidya Nair', 'vidya@example.com', '+919876543221', 'prp', 'Alwarpet, Chennai, Tamil Nadu'),
    ('Kiran Makeovers', 'Kiran Bajaj', 'kiran@example.com', '+919876543222', 'solo', 'Indiranagar, Bangalore, Karnataka'),
    ('Shalini Artist', 'Shalini Verma', 'shalini@example.com', '+919876543223', 'solo', 'Film Nagar, Hyderabad, Telangana'),
    ('Arjun Hairstylist', 'Arjun Mehra', 'arjun@example.com', '+919876543224', 'solo', 'Andheri, Mumbai, Maharashtra'),
    ('Pooja Mehendi Art', 'Pooja Malhotra', 'pooja@example.com', '+919876543225', 'solo', 'Lajpat Nagar, New Delhi, Delhi'),
    ('Rohan Nail Studio', 'Rohan Choudhary', 'rohan@example.com', '+919876543226', 'solo', 'Salt Lake, Kolkata, West Bengal'),
    ('Artistic Aashna', 'Aashna Kapoor', 'aashna@example.com', '+919876543227', 'solo', 'Aundh, Pune, Maharashtra'),
    ('Dr. Sharma Skin Clinic', 'Dr. Rajat Sharma', 'rajat@example.com', '+919876543228', 'doctor', 'HSR Layout, Bangalore, Karnataka'),
    ('Dr. Patel Aesthetics', 'Dr. Anish Patel', 'anish@example.com', '+919876543229', 'doctor', 'Gachibowli, Hyderabad, Telangana'),
    ('Dr. Gupta Dermatology', 'Dr. Aditi Gupta', 'aditi@example.com', '+919876543230', 'doctor', 'Powai, Mumbai, Maharashtra'),
    ('Dr. Kumar Hair Clinic', 'Dr. Aniket Kumar', 'aniket@example.com', '+919876543231', 'doctor', 'Greater Kailash, New Delhi, Delhi'),
    ('Dr. Shah Dental Aesthetics', 'Dr. Priya Shah', 'priya@example.com', '+919876543232', 'doctor', 'T. Nagar, Chennai, Tamil Nadu');

-- Insert business owners from temp table
INSERT INTO business_owners (id, business_name, owner_name, email, phone_number, business_type, address)
SELECT id, business_name, owner_name, email, phone_number, business_type, address
FROM temp_business_owners
ON CONFLICT (email) DO NOTHING;

-- 1. Insert salon profiles with Indian names
INSERT INTO salon_profiles (business_id, salon_name, specialization, established_year, team_size, service_area, operating_hours, amenities, image_urls)
VALUES
    ((SELECT id FROM business_owners WHERE email = 'lakshmi@example.com'), 'Lakshmi Beauty Salon', 'Bridal Makeup', 2010, 12, 'Bangalore Central', '{"monday": "9:00-20:00", "tuesday": "9:00-20:00", "wednesday": "9:00-20:00", "thursday": "9:00-20:00", "friday": "9:00-20:00", "saturday": "9:00-21:00", "sunday": "10:00-18:00"}', '["Parking", "WiFi", "AC", "Refreshments", "Traditional Herbal Treatments"]', '["https://example.com/lakshmi1.jpg", "https://example.com/lakshmi2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'meenakshi@example.com'), 'Meenakshi Makeup Studio', 'Celebrity Makeup', 2015, 8, 'Hyderabad', '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "09:00-20:00", "sunday": "09:00-20:00"}', '["WiFi", "AC", "Premium Makeup Brands", "Celebrity Portfolio"]', '["https://example.com/meenakshi1.jpg", "https://example.com/meenakshi2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'brijesh@example.com'), 'Brijesh Hair Academy', 'Hair Styling', 2012, 10, 'Mumbai', '{"monday": "10:30-20:00", "tuesday": "10:30-20:00", "wednesday": "10:30-20:00", "thursday": "10:30-20:00", "friday": "10:30-20:00", "saturday": "10:30-20:00", "sunday": "11:00-19:00"}', '["WiFi", "AC", "Hair Products", "Training Classes"]', '["https://example.com/brijesh1.jpg", "https://example.com/brijesh2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'rajveer@example.com'), 'Royal Beauty Studio', 'Complete Makeover', 2008, 15, 'Delhi NCR', '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-18:00", "sunday": "10:00-17:00"}', '["Luxury Lounge", "WiFi", "AC", "Premium Products", "Spa Services"]', '["https://example.com/rajveer1.jpg", "https://example.com/rajveer2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'ananya@example.com'), 'Ananya Bridal Salon', 'Bridal & Occasion Makeup', 2014, 7, 'Kolkata', '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "09:00-21:00", "sunday": "09:00-21:00"}', '["WiFi", "AC", "Bridal Lounge", "Traditional & Modern Styles"]', '["https://example.com/ananya1.jpg", "https://example.com/ananya2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'divya@example.com'), 'Divine Beauty Bar', 'Skin Treatments', 2016, 9, 'Pune', '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "08:00-20:00", "sunday": "10:00-18:00"}', '["Herbal Treatments", "WiFi", "AC", "Organic Products"]', '["https://example.com/divya1.jpg", "https://example.com/divya2.jpg"]'),
    
    ((SELECT id FROM business_owners WHERE email = 'deepika@example.com'), 'Deepika Glow Studio', 'HD Makeup', 2017, 6, 'Chennai', '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "10:00-19:00", "sunday": "11:00-18:00"}', '["Premium Products", "WiFi", "AC", "Instagram Worthy Setup"]', '["https://example.com/deepika1.jpg", "https://example.com/deepika2.jpg"]');

-- 2. Insert PRP staff profiles with Indian names
INSERT INTO prp_staff_profiles (business_id, staff_name, designation, specialization, experience_years, certifications, availability, image_url)
VALUES
    ((SELECT id FROM business_owners WHERE email = 'ramesh@example.com'), 'Radhika Menon', 'Master Stylist', 'Hair Transformation', 10, '["LOreal Professional", "Wella Master Colorist"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "09:00-19:00", "sunday": "Closed"}', 'https://example.com/radhika.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'sunil@example.com'), 'Vikram Chandrasekhar', 'Skin Expert', 'Acne & Pigmentation', 8, '["Dermalogica Certified", "Medical Aesthetician"]', '{"monday": "11:00-19:00", "tuesday": "11:00-19:00", "wednesday": "11:00-19:00", "thursday": "11:00-19:00", "friday": "11:00-19:00", "saturday": "10:00-20:00", "sunday": "Closed"}', 'https://example.com/vikram.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'neeta@example.com'), 'Komal Trivedi', 'Makeup Educator', 'Bridal & HD Makeup', 12, '["MAC Certified", "Makeup Educator Certificate"]', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "10:00-16:00", "sunday": "Closed"}', 'https://example.com/komal.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'preeti@example.com'), 'Sanjay Rathore', 'Senior Makeup Artist', 'Celebrity & Fashion Makeup', 7, '["Lakmé Expert", "Fashion Week Artist"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "12:00-16:00"}', 'https://example.com/sanjay.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'vidya@example.com'), 'Meera Iyer', 'Ayurvedic Beauty Expert', 'Herbal Treatments', 9, '["Ayurvedic Beauty Specialist", "Herbal Formulation Expert"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "By Appointment"}', 'https://example.com/meera.jpg');

-- 3. Insert solo artist profiles with Indian names
INSERT INTO solo_artist_profiles (business_id, artist_name, specialization, experience_years, home_service, portfolio_urls, availability, pricing_tier)
VALUES
    ((SELECT id FROM business_owners WHERE email = 'kiran@example.com'), 'Kiran Bajaj', 'Celebrity Makeup Artist', 15, FALSE, '["https://example.com/kiran1.jpg", "https://example.com/kiran2.jpg", "https://example.com/kiran3.jpg"]', '{"monday": "By Appointment", "tuesday": "By Appointment", "wednesday": "By Appointment", "thursday": "By Appointment", "friday": "By Appointment", "saturday": "By Appointment", "sunday": "By Appointment"}', 'luxury'),
    
    ((SELECT id FROM business_owners WHERE email = 'shalini@example.com'), 'Shalini Verma', 'Bridal Makeup Specialist', 12, TRUE, '["https://example.com/shalini1.jpg", "https://example.com/shalini2.jpg", "https://example.com/shalini3.jpg"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "09:00-19:00", "sunday": "09:00-19:00"}', 'luxury'),
    
    ((SELECT id FROM business_owners WHERE email = 'arjun@example.com'), 'Arjun Mehra', 'Hair Stylist & Colorist', 10, FALSE, '["https://example.com/arjun1.jpg", "https://example.com/arjun2.jpg"]', '{"monday": "11:00-19:00", "tuesday": "11:00-19:00", "wednesday": "11:00-19:00", "thursday": "11:00-19:00", "friday": "11:00-19:00", "saturday": "10:00-20:00", "sunday": "Closed"}', 'premium'),
    
    ((SELECT id FROM business_owners WHERE email = 'pooja@example.com'), 'Pooja Malhotra', 'Mehendi Artist', 8, TRUE, '["https://example.com/pooja1.jpg", "https://example.com/pooja2.jpg", "https://example.com/pooja3.jpg"]', '{"monday": "10:00-17:00", "tuesday": "10:00-17:00", "wednesday": "10:00-17:00", "thursday": "10:00-17:00", "friday": "10:00-17:00", "saturday": "09:00-20:00", "sunday": "09:00-20:00"}', 'premium'),
    
    ((SELECT id FROM business_owners WHERE email = 'rohan@example.com'), 'Rohan Choudhary', 'Nail Artist', 6, TRUE, '["https://example.com/rohan1.jpg", "https://example.com/rohan2.jpg"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "12:00-16:00"}', 'budget'),
    
    ((SELECT id FROM business_owners WHERE email = 'aashna@example.com'), 'Aashna Kapoor', 'Creative Makeup Artist', 7, TRUE, '["https://example.com/aashna1.jpg", "https://example.com/aashna2.jpg"]', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "10:00-16:00", "sunday": "By Appointment"}', 'premium');

-- 4. Insert doctor profiles with Indian names
INSERT INTO doctor_profiles (business_id, doctor_name, medical_registration_no, specialization, qualifications, clinic_name, experience_years, consultation_fees, image_url)
VALUES
    ((SELECT id FROM business_owners WHERE email = 'rajat@example.com'), 'Dr. Rajat Sharma', 'MCI-123456', 'Dermatologist', '["MBBS", "MD Dermatology", "Fellowship in Aesthetic Dermatology"]', 'Sharma Skin & Aesthetic Clinic', 15, 1500.00, 'https://example.com/drsharma.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'anish@example.com'), 'Dr. Anish Patel', 'MCI-234567', 'Cosmetic Surgeon', '["MBBS", "MS", "MCh Plastic Surgery"]', 'Patel Aesthetics & Cosmetic Surgery', 18, 2500.00, 'https://example.com/drpatel.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'aditi@example.com'), 'Dr. Aditi Gupta', 'MCI-345678', 'Aesthetic Dermatologist', '["MBBS", "MD Dermatology", "Advanced Certification in Lasers"]', 'Skin Radiance Clinic', 12, 1800.00, 'https://example.com/drgupta.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'aniket@example.com'), 'Dr. Aniket Kumar', 'MCI-456789', 'Trichologist', '["MBBS", "Diploma in Trichology", "Hair Transplant Specialist"]', 'Kumar Hair Restoration Centre', 10, 1200.00, 'https://example.com/drkumar.jpg'),
    
    ((SELECT id FROM business_owners WHERE email = 'priya@example.com'), 'Dr. Priya Shah', 'MCI-567890', 'Cosmetic Dentist', '["BDS", "MDS Prosthodontics", "Certification in Smile Design"]', 'Aesthetic Dental Studio', 14, 1000.00, 'https://example.com/drshah.jpg');

-- Drop temporary table
DROP TABLE temp_business_owners; 