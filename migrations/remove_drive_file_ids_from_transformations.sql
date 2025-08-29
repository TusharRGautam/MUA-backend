-- Remove Google Drive file ID columns from vendor_transformations table
-- This migration removes the before_drive_file_id and after_drive_file_id columns

-- Check if before_drive_file_id column exists, if so remove it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'before_drive_file_id'
  ) THEN
    ALTER TABLE vendor_transformations DROP COLUMN before_drive_file_id;
    RAISE NOTICE 'Column before_drive_file_id removed from vendor_transformations table';
  ELSE
    RAISE NOTICE 'Column before_drive_file_id does not exist in vendor_transformations table';
  END IF;
END $$;

-- Check if after_drive_file_id column exists, if so remove it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_transformations' 
    AND column_name = 'after_drive_file_id'
  ) THEN
    ALTER TABLE vendor_transformations DROP COLUMN after_drive_file_id;
    RAISE NOTICE 'Column after_drive_file_id removed from vendor_transformations table';
  ELSE
    RAISE NOTICE 'Column after_drive_file_id does not exist in vendor_transformations table';
  END IF;
END $$;