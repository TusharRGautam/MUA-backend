-- Migration to add missing columns to prp_services_from_dashboard_and_app table
-- Date: 2025-06-19

-- Add missing columns for PRP services
DO $$
BEGIN
  -- Add category column for different types of PRP treatments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN category VARCHAR(100) DEFAULT 'Hair PRP';
    RAISE NOTICE 'Added category column';
  END IF;

  -- Add gender column for gender-specific treatments  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'gender'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN gender VARCHAR(20) DEFAULT 'both';
    RAISE NOTICE 'Added gender column';
  END IF;

  -- Add service_details JSONB column for detailed service information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'service_details'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN service_details JSONB;
    RAISE NOTICE 'Added service_details column';
  END IF;

  -- Add benefits column for treatment benefits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'benefits'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN benefits TEXT;
    RAISE NOTICE 'Added benefits column';
  END IF;

  -- Add preparation_instructions column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'preparation_instructions'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN preparation_instructions TEXT;
    RAISE NOTICE 'Added preparation_instructions column';
  END IF;

  -- Add aftercare_instructions column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'aftercare_instructions'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN aftercare_instructions TEXT;
    RAISE NOTICE 'Added aftercare_instructions column';
  END IF;

  -- Add expected_results column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'expected_results'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN expected_results TEXT;
    RAISE NOTICE 'Added expected_results column';
  END IF;

  -- Add is_featured column for highlighting premium packages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_featured column';
  END IF;

  -- Add contraindications column for safety information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'contraindications'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN contraindications TEXT;
    RAISE NOTICE 'Added contraindications column';
  END IF;

  -- Add age_range column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prp_services_from_dashboard_and_app' 
    AND column_name = 'age_range'
  ) THEN
    ALTER TABLE prp_services_from_dashboard_and_app 
    ADD COLUMN age_range VARCHAR(50) DEFAULT '18-65';
    RAISE NOTICE 'Added age_range column';
  END IF;

  RAISE NOTICE 'Successfully added all missing columns to prp_services_from_dashboard_and_app table';
END $$;

-- Add comments for new columns
COMMENT ON COLUMN prp_services_from_dashboard_and_app.category IS 'Category of PRP treatment (Hair PRP, Face PRP, Joint PRP, etc.)';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.gender IS 'Target gender for the treatment (male, female, both)';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.service_details IS 'Detailed service information in JSON format';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.benefits IS 'Treatment benefits and expected outcomes';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.preparation_instructions IS 'Instructions for pre-treatment preparation';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.aftercare_instructions IS 'Post-treatment care instructions';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.expected_results IS 'Expected results and timeline';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.is_featured IS 'Whether this package is featured/premium';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.contraindications IS 'Conditions where treatment is not recommended';
COMMENT ON COLUMN prp_services_from_dashboard_and_app.age_range IS 'Recommended age range for treatment'; 