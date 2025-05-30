-- Add Drive file ID columns to vendor_transformations table

-- Check if before_drive_file_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'before_drive_file_id'
  ) THEN
    ALTER TABLE vendor_transformations ADD COLUMN before_drive_file_id TEXT;
  END IF;
END $$;

-- Check if after_drive_file_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'after_drive_file_id'
  ) THEN
    ALTER TABLE vendor_transformations ADD COLUMN after_drive_file_id TEXT;
  END IF;
END $$;

-- Rename the columns in the table to match the naming convention if they exist with old names
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'before'
  ) THEN
    ALTER TABLE vendor_transformations RENAME COLUMN before TO before_image;
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'after'
  ) THEN
    ALTER TABLE vendor_transformations RENAME COLUMN after TO after_image;
  END IF;
END $$; 