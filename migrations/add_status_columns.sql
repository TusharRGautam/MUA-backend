-- Migration to add status columns to vendor and customer tables

-- Add vendor_status column to Registration_And_Other_Details table
ALTER TABLE Registration_And_Other_Details
ADD COLUMN IF NOT EXISTS vendor_status VARCHAR(50) DEFAULT 'active' NOT NULL;

-- Add comment for the vendor_status column
COMMENT ON COLUMN Registration_And_Other_Details.vendor_status IS 'Status of the vendor (active, inactive, suspended, etc.)';

-- Add user_status column to Customer_Table_Details table
ALTER TABLE Customer_Table_Details
ADD COLUMN IF NOT EXISTS user_status VARCHAR(50) DEFAULT 'active' NOT NULL;

-- Add comment for the user_status column
COMMENT ON COLUMN Customer_Table_Details.user_status IS 'Status of the user (active, inactive, suspended, etc.)'; 