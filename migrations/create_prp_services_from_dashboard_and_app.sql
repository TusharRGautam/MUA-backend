-- Migration to create prp_services_from_dashboard_and_app table
-- Date: 2023-10-29

-- Check if table already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = current_schema() 
    AND table_name = 'prp_services_from_dashboard_and_app'
  ) THEN
    -- Create the table
    CREATE TABLE prp_services_from_dashboard_and_app (
      id SERIAL PRIMARY KEY,
      icon_image TEXT,
      package_name VARCHAR(255) NOT NULL,
      package_duration VARCHAR(100),
      number_of_sessions INTEGER NOT NULL,
      package_description TEXT,
      package_includes TEXT,
      selected_days JSONB,
      package_price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      vendor_id INTEGER
    );

    -- Add comment to the table
    COMMENT ON TABLE prp_services_from_dashboard_and_app IS 'Stores PRP treatment services created through the dashboard and app interface';

    -- Add comments to individual columns
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.icon_image IS 'URL or path to the service icon image';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.package_name IS 'Name of the PRP service package';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.package_duration IS 'Duration of the PRP treatment package';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.number_of_sessions IS 'Number of sessions included in the package';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.package_description IS 'Detailed description of the PRP service';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.package_includes IS 'What is included in the service package';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.selected_days IS 'JSON array of days when the service is available';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.package_price IS 'Price of the PRP service package';
    COMMENT ON COLUMN prp_services_from_dashboard_and_app.vendor_id IS 'ID of the vendor offering this service';
    
    RAISE NOTICE 'Successfully created prp_services_from_dashboard_and_app table';
  ELSE
    RAISE NOTICE 'Table prp_services_from_dashboard_and_app already exists, skipping creation.';
  END IF;
END $$; 