-- Migration: Implement Custom User ID System with CLUB01XX format
-- Date: 2024-01-25
-- Purpose: Add custom user_id with auto-increment CLUB01XX format

-- 1. Add custom_user_id column to Customer_Table_Details table
DO $$
BEGIN
    -- Add custom_user_id column for customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_table_details' 
                   AND column_name = 'custom_user_id') THEN
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN custom_user_id VARCHAR(10) UNIQUE;
        
        COMMENT ON COLUMN Customer_Table_Details.custom_user_id 
        IS 'Custom user ID with format CLUB01XX where XX is incremental number';
        
        RAISE NOTICE 'Added custom_user_id column to Customer_Table_Details';
    END IF;

    -- Add custom_user_id column for vendors/businesses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registration_and_other_details' 
                   AND column_name = 'custom_user_id') THEN
        ALTER TABLE registration_and_other_details 
        ADD COLUMN custom_user_id VARCHAR(10) UNIQUE;
        
        COMMENT ON COLUMN registration_and_other_details.custom_user_id 
        IS 'Custom user ID with format CLUB01XX where XX is incremental number';
        
        RAISE NOTICE 'Added custom_user_id column to registration_and_other_details';
    END IF;
END $$;

-- 2. Create a sequence for auto-incrementing the custom user IDs
CREATE SEQUENCE IF NOT EXISTS custom_user_id_seq START 1;

-- 3. Create a function to generate the next custom user ID
CREATE OR REPLACE FUNCTION generate_custom_user_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    next_number INTEGER;
    formatted_id VARCHAR(10);
BEGIN
    -- Get the next number from the sequence
    next_number := nextval('custom_user_id_seq');
    
    -- Format as CLUB01XX where XX is zero-padded to 2 digits
    formatted_id := 'CLUB01' || LPAD(next_number::TEXT, 2, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers to auto-generate custom_user_id on INSERT for customers
CREATE OR REPLACE FUNCTION trigger_generate_customer_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if custom_user_id is not already set
    IF NEW.custom_user_id IS NULL THEN
        NEW.custom_user_id := generate_custom_user_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers to auto-generate custom_user_id on INSERT for vendors
CREATE OR REPLACE FUNCTION trigger_generate_vendor_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if custom_user_id is not already set
    IF NEW.custom_user_id IS NULL THEN
        NEW.custom_user_id := generate_custom_user_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply triggers to tables
DROP TRIGGER IF EXISTS customer_custom_user_id_trigger ON Customer_Table_Details;
CREATE TRIGGER customer_custom_user_id_trigger
    BEFORE INSERT ON Customer_Table_Details
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_customer_user_id();

DROP TRIGGER IF EXISTS vendor_custom_user_id_trigger ON registration_and_other_details;
CREATE TRIGGER vendor_custom_user_id_trigger
    BEFORE INSERT ON registration_and_other_details
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_vendor_user_id();

-- 7. Update existing records with custom user IDs
DO $$
DECLARE
    customer_record RECORD;
    vendor_record RECORD;
BEGIN
    -- Update existing customers
    FOR customer_record IN 
        SELECT id FROM Customer_Table_Details 
        WHERE custom_user_id IS NULL 
        ORDER BY id ASC
    LOOP
        UPDATE Customer_Table_Details 
        SET custom_user_id = generate_custom_user_id()
        WHERE id = customer_record.id;
    END LOOP;
    
    -- Update existing vendors
    FOR vendor_record IN 
        SELECT sr_no FROM registration_and_other_details 
        WHERE custom_user_id IS NULL 
        ORDER BY sr_no ASC
    LOOP
        UPDATE registration_and_other_details 
        SET custom_user_id = generate_custom_user_id()
        WHERE sr_no = vendor_record.sr_no;
    END LOOP;
    
    RAISE NOTICE 'Updated existing records with custom user IDs';
END $$;

-- 8. Update booking table to use custom_user_id instead of regular user_id
DO $$
BEGIN
    -- Add custom_user_id column to booking table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'booking_all_details_of_user_to_vendor' 
                   AND column_name = 'custom_user_id') THEN
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ADD COLUMN custom_user_id VARCHAR(10);
        
        COMMENT ON COLUMN booking_all_details_of_user_to_vendor.custom_user_id 
        IS 'Custom user ID linking to customer or vendor (CLUB01XX format)';
        
        -- Create index for performance
        CREATE INDEX idx_booking_custom_user_id 
        ON booking_all_details_of_user_to_vendor(custom_user_id);
        
        RAISE NOTICE 'Added custom_user_id column to booking table';
    END IF;
END $$;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_custom_user_id 
ON Customer_Table_Details(custom_user_id);

CREATE INDEX IF NOT EXISTS idx_vendor_custom_user_id 
ON registration_and_other_details(custom_user_id);

-- 10. Create a view to easily lookup users by custom_user_id
CREATE OR REPLACE VIEW user_lookup AS
SELECT 
    custom_user_id,
    'customer' as user_type,
    id as internal_id,
    full_name as name,
    email,
    phone_number,
    created_at
FROM Customer_Table_Details
WHERE custom_user_id IS NOT NULL

UNION ALL

SELECT 
    custom_user_id,
    'vendor' as user_type,
    sr_no as internal_id,
    person_name as name,
    business_email as email,
    phone_number,
    created_at
FROM registration_and_other_details
WHERE custom_user_id IS NOT NULL;

-- Print confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Custom User ID system implemented with CLUB01XX format';
    RAISE NOTICE 'Auto-generation triggers are active for new registrations';
    RAISE NOTICE 'Existing users have been assigned custom user IDs';
    RAISE NOTICE 'Use the user_lookup view to find users by custom_user_id';
END $$; 