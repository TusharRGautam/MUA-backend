-- Create Registration_And_Other_Details table for VendorDashboard
CREATE TABLE IF NOT EXISTS Registration_And_Other_Details (
    sr_no SERIAL PRIMARY KEY,
    business_type VARCHAR(50) NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL UNIQUE,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone_number VARCHAR(20) NOT NULL CHECK (phone_number ~ '^[0-9]{10,15}$'),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for each column to document purpose
COMMENT ON COLUMN Registration_And_Other_Details.sr_no IS 'Primary key with auto-increment';
COMMENT ON COLUMN Registration_And_Other_Details.business_type IS 'Type of business (salon, spa, freelancer, etc.)';
COMMENT ON COLUMN Registration_And_Other_Details.person_name IS 'Name of the vendor/business owner';
COMMENT ON COLUMN Registration_And_Other_Details.business_email IS 'Email address (must be unique)';
COMMENT ON COLUMN Registration_And_Other_Details.gender IS 'Gender (male, female, other)';
COMMENT ON COLUMN Registration_And_Other_Details.phone_number IS 'Contact phone number (validates format)';
COMMENT ON COLUMN Registration_And_Other_Details.password IS 'Hashed password for account security';

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_reg_details_email ON Registration_And_Other_Details(business_email);

-- Add index for faster lookups by business type
CREATE INDEX IF NOT EXISTS idx_reg_details_business_type ON Registration_And_Other_Details(business_type);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_registration_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_registration_details_timestamp
BEFORE UPDATE ON Registration_And_Other_Details
FOR EACH ROW
EXECUTE FUNCTION update_registration_details_timestamp();

-- Enable Row Level Security
ALTER TABLE Registration_And_Other_Details ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Vendors can view their own details" ON Registration_And_Other_Details
    FOR SELECT
    USING (business_email = auth.email());

CREATE POLICY "Vendors can update their own details" ON Registration_And_Other_Details
    FOR UPDATE
    USING (business_email = auth.email());

-- Admin can view all records
CREATE POLICY "Admins can view all records" ON Registration_And_Other_Details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.email() = 'admin@example.com' -- Replace with actual admin email or role check
        )
    ); 