-- Drop existing table if exists
DROP TABLE IF EXISTS salonestoreowner;

-- Create SaloneStoreOwner table
CREATE TABLE salonestoreowner (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    salonName VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    speciality VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) DEFAULT 'stylist-background.jpg',
    rating DECIMAL(3,2) DEFAULT 4.5,
    distance DECIMAL(3,1) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Mumbai-based salon records
INSERT INTO salonestoreowner (name, salonName, address, city, speciality, rating, distance) VALUES
('Anjali Mehta', 'Glamour Touch', 'Shop 12, Link Road, Andheri West', 'Mumbai', 'Bridal Makeup', 4.7, 0.8),
('Ritika Shah', 'Bliss Salon', '1st Floor, Infinity Mall, Malad West', 'Mumbai', 'Hair Coloring', 4.9, 1.2),
('Priya Nair', 'Style Secrets', 'Opp. High Street Phoenix, Lower Parel', 'Mumbai', 'Facial & Skin Care', 4.6, 1.5),
('Rahul Verma', 'Urban Cuts', 'Near Carter Road, Bandra West', 'Mumbai', 'Men''s Hair Styling', 4.8, 0.7),
('Sneha Patil', 'Glow Zone', 'IC Colony, Borivali West', 'Mumbai', 'Nail Art', 4.5, 1.8),
('Karan Joshi', 'The Hair Lab', 'Powai Plaza, Hiranandani Gardens', 'Mumbai', 'Beard Styling', 4.7, 2.0),
('Meera Rao', 'Aura Beauty Lounge', 'Chembur East, Near Ambedkar Garden', 'Mumbai', 'Hair Spa & Smoothening', 4.8, 1.3),
('Vikram Desai', 'Chop Shop', 'Opp. Oberoi Mall, Goregaon East', 'Mumbai', 'Men''s Grooming', 4.6, 1.7),
('Swati Iyer', 'Pretty Please', '5th Floor, R-City Mall, Ghatkopar West', 'Mumbai', 'Makeup & Hairstyling', 4.9, 0.9),
('Ayesha Khan', 'Luxe Beauty Bar', 'Hill Road, Bandra West', 'Mumbai', 'Keratin Treatment', 4.8, 1.0);

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_salon_owner_modified ON salonestoreowner;

-- Create trigger
CREATE TRIGGER update_salon_owner_modified
BEFORE UPDATE ON salonestoreowner
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 