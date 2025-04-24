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

-- Create policies for business_owners table
DO $$
BEGIN
    -- Check for business_owners policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_owners' AND policyname = 'Business owners can view their own profile'
    ) THEN
        -- Create a policy that allows business owners to view their own profile
        CREATE POLICY "Business owners can view their own profile" ON business_owners
                FOR SELECT
                USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_owners' AND policyname = 'Business owners can update their own profile'
    ) THEN
        -- Create a policy that allows business owners to update their own profile
        CREATE POLICY "Business owners can update their own profile" ON business_owners
                FOR UPDATE
                USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_owners' AND policyname = 'Allow business owner registration'
    ) THEN
        -- Create a policy that allows insertion into business_owners during registration
        CREATE POLICY "Allow business owner registration" ON business_owners
                FOR INSERT
                WITH CHECK (true);
    END IF;
END
$$ LANGUAGE plpgsql;

-- Create policies for services table
DO $$
BEGIN
    -- Check for services policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Business owners can view their own services'
    ) THEN
        -- Create a policy that allows business owners to view their own services
        CREATE POLICY "Business owners can view their own services" ON services
                FOR SELECT
                USING (business_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Business owners can insert their own services'
    ) THEN
        -- Create a policy that allows business owners to insert their own services
        CREATE POLICY "Business owners can insert their own services" ON services
                FOR INSERT
                WITH CHECK (business_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Business owners can update their own services'
    ) THEN
        -- Create a policy that allows business owners to update their own services
        CREATE POLICY "Business owners can update their own services" ON services
                FOR UPDATE
                USING (business_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Business owners can delete their own services'
    ) THEN
        -- Create a policy that allows business owners to delete their own services
        CREATE POLICY "Business owners can delete their own services" ON services
                FOR DELETE
                USING (business_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' AND policyname = 'Customers can view active services'
    ) THEN
        -- Create a policy that allows customers to view active services
        CREATE POLICY "Customers can view active services" ON services
                FOR SELECT
                USING (active = true);
    END IF;
END
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at timestamp
DO $$
BEGIN
  -- Create or check for update_modified_column function
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_modified_column'
  ) THEN
    -- Create the function to update modified timestamp
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;

  -- Check if trigger for business_owners exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_business_owners_modified'
  ) THEN
    CREATE TRIGGER update_business_owners_modified
    BEFORE UPDATE ON business_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;

  -- Check if trigger for services exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_services_modified'
  ) THEN
    CREATE TRIGGER update_services_modified
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$ LANGUAGE plpgsql; 