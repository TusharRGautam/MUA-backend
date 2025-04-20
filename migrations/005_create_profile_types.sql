-- 005_create_profile_types.sql
-- Migration to create tables for different profile types with Indian names

-- 1. Create the salon_profiles table
CREATE TABLE IF NOT EXISTS salon_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES business_owners(id) ON DELETE CASCADE,
    salon_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL, -- e.g., 'Bridal', 'Hair', 'Skin', etc.
    established_year INTEGER,
    team_size INTEGER,
    service_area VARCHAR(255),
    operating_hours JSONB,
    amenities JSONB, -- e.g., parking, wifi, etc.
    image_urls JSONB, -- array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the prp_staff_profiles table
CREATE TABLE IF NOT EXISTS prp_staff_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES business_owners(id) ON DELETE CASCADE,
    staff_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    experience_years INTEGER,
    certifications JSONB,
    availability JSONB, -- JSON with days and hours
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the solo_artist_profiles table
CREATE TABLE IF NOT EXISTS solo_artist_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES business_owners(id) ON DELETE CASCADE,
    artist_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL, -- e.g., 'Makeup', 'Hair', 'Mehendi', etc.
    experience_years INTEGER,
    home_service BOOLEAN DEFAULT FALSE,
    portfolio_urls JSONB, -- array of portfolio image URLs
    availability JSONB, -- JSON with days and hours
    pricing_tier VARCHAR(20), -- 'budget', 'premium', 'luxury'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the doctor_profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES business_owners(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    medical_registration_no VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL, -- e.g., 'Dermatologist', 'Cosmetic Surgeon', etc.
    qualifications JSONB,
    clinic_name VARCHAR(255),
    experience_years INTEGER,
    consultation_fees DECIMAL(10,2),
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE salon_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prp_staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the salon_profiles table
CREATE POLICY "Business owners can manage their salon profiles" ON salon_profiles
    FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Anyone can view salon profiles" ON salon_profiles
    FOR SELECT USING (true);

-- Create policies for the prp_staff_profiles table
CREATE POLICY "Business owners can manage their staff profiles" ON prp_staff_profiles
    FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Anyone can view staff profiles" ON prp_staff_profiles
    FOR SELECT USING (true);

-- Create policies for the solo_artist_profiles table
CREATE POLICY "Business owners can manage their solo artist profiles" ON solo_artist_profiles
    FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Anyone can view solo artist profiles" ON solo_artist_profiles
    FOR SELECT USING (true);

-- Create policies for the doctor_profiles table
CREATE POLICY "Business owners can manage their doctor profiles" ON doctor_profiles
    FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Anyone can view doctor profiles" ON doctor_profiles
    FOR SELECT USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_salon_profiles_modified
BEFORE UPDATE ON salon_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_prp_staff_profiles_modified
BEFORE UPDATE ON prp_staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_solo_artist_profiles_modified
BEFORE UPDATE ON solo_artist_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_doctor_profiles_modified
BEFORE UPDATE ON doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert sample salon profiles with Indian names
INSERT INTO salon_profiles (business_id, salon_name, specialization, established_year, team_size, service_area, operating_hours, amenities, image_urls)
VALUES
    ((SELECT id FROM business_owners LIMIT 1), 'Geetanjali Beauty Salon', 'Bridal Makeup', 2015, 8, 'South Delhi', '{"monday": "9:00-20:00", "tuesday": "9:00-20:00", "wednesday": "9:00-20:00", "thursday": "9:00-20:00", "friday": "9:00-20:00", "saturday": "9:00-21:00", "sunday": "10:00-18:00"}', '["Parking", "WiFi", "AC", "Refreshments"]', '["https://example.com/salon1.jpg", "https://example.com/salon1_2.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 1), 'Lakme Salon', 'Hair and Skin', 2010, 12, 'Mumbai Suburbs', '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "09:00-20:00", "sunday": "09:00-20:00"}', '["WiFi", "AC", "Spa Facilities", "Juice Bar"]', '["https://example.com/salon2.jpg", "https://example.com/salon2_2.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 2), 'Jawed Habib Hair Studio', 'Hair Styling', 2008, 10, 'Pune', '{"monday": "10:30-20:00", "tuesday": "10:30-20:00", "wednesday": "10:30-20:00", "thursday": "10:30-20:00", "friday": "10:30-20:00", "saturday": "10:30-20:00", "sunday": "11:00-19:00"}', '["WiFi", "AC", "Hair Products"]', '["https://example.com/salon3.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 3), 'Shahnaz Husain Beauty', 'Herbal Treatments', 2012, 6, 'Hyderabad', '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-18:00", "sunday": "Closed"}', '["Organic Products", "AC", "Relaxation Zone"]', '["https://example.com/salon4.jpg", "https://example.com/salon4_2.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 4), 'Meher\'s Makeup Studio', 'Bridal & Party Makeup', 2018, 5, 'Bangalore', '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "09:00-21:00", "sunday": "09:00-21:00"}', '["WiFi", "AC", "Makeup Products"]', '["https://example.com/salon5.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 5), 'BBlunt Salon', 'Celebrity Hair Styling', 2014, 15, 'Mumbai', '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "08:00-20:00", "sunday": "10:00-18:00"}', '["Premium Products", "WiFi", "AC", "Coffee Bar"]', '["https://example.com/salon6.jpg", "https://example.com/salon6_2.jpg"]'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 6), 'Kaya Beauty Studio', 'Skin Treatments', 2016, 9, 'Chennai', '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "10:00-19:00", "sunday": "11:00-18:00"}', '["Dermatology Products", "WiFi", "AC", "Medical Grade Equipment"]', '["https://example.com/salon7.jpg"]');

-- Insert sample PRP staff profiles with Indian names
INSERT INTO prp_staff_profiles (business_id, staff_name, designation, specialization, experience_years, certifications, availability, image_url)
VALUES
    ((SELECT id FROM business_owners LIMIT 1), 'Priya Sharma', 'Senior Makeup Artist', 'Bridal Makeup', 8, '["Certified Makeup Artist", "Lakme Academy Graduate"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "09:00-19:00", "sunday": "Closed"}', 'https://example.com/staff1.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 1), 'Ravi Patel', 'Hair Specialist', 'Hair Coloring', 6, '["Toni&Guy Certified", "L\'Oreal Color Specialist"]', '{"monday": "11:00-19:00", "tuesday": "11:00-19:00", "wednesday": "11:00-19:00", "thursday": "11:00-19:00", "friday": "11:00-19:00", "saturday": "10:00-20:00", "sunday": "Closed"}', 'https://example.com/staff2.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 2), 'Anjali Gupta', 'Skin Expert', 'Facials & Treatments', 10, '["Dermalogica Certified", "VLCC Trained"]', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "10:00-16:00", "sunday": "Closed"}', 'https://example.com/staff3.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 3), 'Arjun Mehra', 'Nail Art Specialist', 'Nail Extensions', 4, '["Nail Artist Certificate", "Advanced Nail Art Training"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "12:00-16:00"}', 'https://example.com/staff4.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 4), 'Neha Kapoor', 'Senior Makeup Artist', 'Celebrity Makeup', 7, '["MAC Certified", "Bollywood Makeup Experience"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "By Appointment"}', 'https://example.com/staff5.jpg');

-- Insert sample solo artist profiles with Indian names
INSERT INTO solo_artist_profiles (business_id, artist_name, specialization, experience_years, home_service, portfolio_urls, availability, pricing_tier)
VALUES
    ((SELECT id FROM business_owners LIMIT 1), 'Vandana Luthra', 'Bridal Makeup', 12, TRUE, '["https://example.com/portfolio1_1.jpg", "https://example.com/portfolio1_2.jpg", "https://example.com/portfolio1_3.jpg"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "09:00-19:00", "sunday": "09:00-19:00"}', 'luxury'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 1), 'Namrata Soni', 'Celebrity Makeup', 15, FALSE, '["https://example.com/portfolio2_1.jpg", "https://example.com/portfolio2_2.jpg", "https://example.com/portfolio2_3.jpg"]', '{"monday": "By Appointment", "tuesday": "By Appointment", "wednesday": "By Appointment", "thursday": "By Appointment", "friday": "By Appointment", "saturday": "By Appointment", "sunday": "By Appointment"}', 'luxury'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 2), 'Meera Rajput', 'Mehendi Artist', 8, TRUE, '["https://example.com/portfolio3_1.jpg", "https://example.com/portfolio3_2.jpg"]', '{"monday": "10:00-17:00", "tuesday": "10:00-17:00", "wednesday": "10:00-17:00", "thursday": "10:00-17:00", "friday": "10:00-17:00", "saturday": "09:00-20:00", "sunday": "09:00-20:00"}', 'premium'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 3), 'Kapil Bhalla', 'Hair Stylist', 10, FALSE, '["https://example.com/portfolio4_1.jpg", "https://example.com/portfolio4_2.jpg"]', '{"monday": "11:00-19:00", "tuesday": "11:00-19:00", "wednesday": "11:00-19:00", "thursday": "11:00-19:00", "friday": "11:00-19:00", "saturday": "10:00-20:00", "sunday": "Closed"}', 'premium'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 4), 'Simran Takkar', 'Nail Art', 6, TRUE, '["https://example.com/portfolio5_1.jpg", "https://example.com/portfolio5_2.jpg"]', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-18:00", "sunday": "12:00-16:00"}', 'budget'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 5), 'Rahul Dev', 'Personal Grooming', 9, TRUE, '["https://example.com/portfolio6_1.jpg", "https://example.com/portfolio6_2.jpg"]', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "10:00-16:00", "sunday": "Closed"}', 'premium');

-- Insert sample doctor profiles with Indian names
INSERT INTO doctor_profiles (business_id, doctor_name, medical_registration_no, specialization, qualifications, clinic_name, experience_years, consultation_fees, image_url)
VALUES
    ((SELECT id FROM business_owners LIMIT 1), 'Dr. Anjali Mukherji', 'MCI-12345', 'Dermatologist', '["MBBS", "MD Dermatology", "Fellowship in Cosmetic Dermatology"]', 'Skin Radiance Clinic', 15, 1500.00, 'https://example.com/doctor1.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 1), 'Dr. Vikram Desai', 'MCI-23456', 'Cosmetic Surgeon', '["MBBS", "MS", "MCh Plastic Surgery"]', 'Aesthetica Clinic', 18, 2500.00, 'https://example.com/doctor2.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 2), 'Dr. Rekha Singh', 'MCI-34567', 'Trichologist', '["MBBS", "Diploma in Trichology"]', 'HairCare Clinic', 12, 1200.00, 'https://example.com/doctor3.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 3), 'Dr. Rajesh Kumar', 'MCI-45678', 'Aesthetic Physician', '["MBBS", "Diploma in Aesthetic Medicine"]', 'Eternal Youth Clinic', 10, 1800.00, 'https://example.com/doctor4.jpg'),
    ((SELECT id FROM business_owners LIMIT 1 OFFSET 4), 'Dr. Sunita Agarwal', 'MCI-56789', 'Cosmetic Dentist', '["BDS", "MDS Prosthodontics"]', 'Perfect Smile Clinic', 14, 1000.00, 'https://example.com/doctor5.jpg'); 