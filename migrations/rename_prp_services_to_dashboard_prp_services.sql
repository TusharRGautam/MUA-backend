-- Migration to rename prp_services_from_dashboard_and_app table to dashboard_prp_services

-- Check if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'prp_services_from_dashboard_and_app'
  ) THEN
    -- Rename the table
    ALTER TABLE prp_services_from_dashboard_and_app RENAME TO dashboard_prp_services;
    
    -- Update the table comment
    COMMENT ON TABLE dashboard_prp_services IS 'Stores PRP treatment services created through the dashboard and app interface';
    
    RAISE NOTICE 'Successfully renamed prp_services_from_dashboard_and_app to dashboard_prp_services';
  ELSE
    RAISE NOTICE 'Table prp_services_from_dashboard_and_app does not exist, skipping rename operation.';
  END IF;
END
$$;