-- Migration: Rename dashboard_prp_services back to package_services_from_dashboard

-- Check if the table exists before attempting to rename
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
    ) THEN
        -- Rename the table
        ALTER TABLE dashboard_prp_services RENAME TO package_services_from_dashboard;
        
        -- Update the comments on the table
        COMMENT ON TABLE package_services_from_dashboard IS 'Stores package services created from the dashboard';
        
        RAISE NOTICE 'Successfully renamed dashboard_prp_services back to package_services_from_dashboard';
    ELSE
        RAISE NOTICE 'Table dashboard_prp_services does not exist, skipping rename operation';
    END IF;
END
$$;