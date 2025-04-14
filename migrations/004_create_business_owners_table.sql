-- Create business_owners table
CREATE TABLE IF NOT EXISTS business_owners (
    id UUID PRIMARY KEY, -- This will be the same as the user id from Supabase Auth
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    business_type VARCHAR(50) NOT NULL, -- 'salon', 'solo', 'spa', 'hair', 'nail', etc.
    address TEXT,
    website VARCHAR(255),
    bio TEXT,
    logo_url VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create services table for business owners
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES business_owners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER, -- duration in minutes
    image_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS (Row Level Security) policies
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows business owners to view their own profile
CREATE POLICY "Business owners can view their own profile" ON business_owners
    FOR SELECT
    USING (auth.uid() = id);

-- Create a policy that allows business owners to update their own profile
CREATE POLICY "Business owners can update their own profile" ON business_owners
    FOR UPDATE
    USING (auth.uid() = id);

-- Create a policy that allows insertion into business_owners during registration
CREATE POLICY "Allow business owner registration" ON business_owners
    FOR INSERT
    WITH CHECK (true);

-- Create policies for services table
CREATE POLICY "Business owners can view their own services" ON services
    FOR SELECT
    USING (business_id = auth.uid());

CREATE POLICY "Business owners can insert their own services" ON services
    FOR INSERT
    WITH CHECK (business_id = auth.uid());

CREATE POLICY "Business owners can update their own services" ON services
    FOR UPDATE
    USING (business_id = auth.uid());

CREATE POLICY "Business owners can delete their own services" ON services
    FOR DELETE
    USING (business_id = auth.uid());

-- Customers can view all active services
CREATE POLICY "Customers can view active services" ON services
    FOR SELECT
    USING (active = true);

-- Create triggers to automatically update the updated_at timestamp
CREATE TRIGGER update_business_owners_modified
BEFORE UPDATE ON business_owners
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_services_modified
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 