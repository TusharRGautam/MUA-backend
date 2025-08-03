-- Migration: Rename package_services_from_dashboard to dashboard_prp_services

-- Check if the table exists before attempting to rename
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
    ) THEN
        -- Rename the table
        ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;
        
        -- Update the comments on the table
        COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP service packages created from the dashboard';
        
        RAISE NOTICE 'Successfully renamed package_services_from_dashboard to dashboard_prp_services';
    ELSE
        RAISE NOTICE 'Table package_services_from_dashboard does not exist, skipping rename operation.';
    END IF;
END
$$;