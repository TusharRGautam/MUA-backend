-- Add reviews column to ready_services_vendors_data table (PostgreSQL compatible)
-- This column will store an array of review objects in JSON format
-- Each review will contain: user_id, rating, comment, date

-- Add reviews column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ready_services_vendors_data' 
        AND column_name = 'reviews'
    ) THEN
        ALTER TABLE ready_services_vendors_data 
        ADD COLUMN reviews JSONB DEFAULT NULL;
        
        COMMENT ON COLUMN ready_services_vendors_data.reviews IS 'Store review data as JSONB array with user_id, rating, comment, date';
    END IF;
END $$;

-- Add business_type column if it doesn't exist (needed for salon filtering)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ready_services_vendors_data' 
        AND column_name = 'business_type'
    ) THEN
        ALTER TABLE ready_services_vendors_data 
        ADD COLUMN business_type VARCHAR(50) DEFAULT 'salon';
        
        COMMENT ON COLUMN ready_services_vendors_data.business_type IS 'Type of business: salon, prp, diagnostics, etc.';
    END IF;
END $$;

-- Add index for business_type to improve query performance (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'ready_services_vendors_data' 
        AND indexname = 'idx_ready_services_vendors_business_type'
    ) THEN
        CREATE INDEX idx_ready_services_vendors_business_type ON ready_services_vendors_data(business_type);
    END IF;
END $$;

-- Update existing records to have business_type = 'salon' if NULL
UPDATE ready_services_vendors_data 
SET business_type = 'salon' 
WHERE business_type IS NULL;