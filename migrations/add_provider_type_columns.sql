-- Migration: Add provider type columns to registration_and_other_details table
-- This migration adds columns to track whether a vendor is a single-service or multi-service provider

-- Add provider_type_single_or_multi column
ALTER TABLE registration_and_other_details 
ADD COLUMN IF NOT EXISTS provider_type_single_or_multi VARCHAR(10) CHECK (provider_type_single_or_multi IN ('single', 'multi'));

-- Add selected_category column to store the specific category for single-service providers
ALTER TABLE registration_and_other_details 
ADD COLUMN IF NOT EXISTS selected_category VARCHAR(50);

-- Add comments to document the new columns
COMMENT ON COLUMN registration_and_other_details.provider_type_single_or_multi IS 'Indicates if vendor is single-service or multi-service provider (single/multi)';
COMMENT ON COLUMN registration_and_other_details.selected_category IS 'Selected service category for single-service providers (e.g., Mehendi, Hair Cut, etc.)';

-- Create an index for faster queries on provider type
CREATE INDEX IF NOT EXISTS idx_registration_provider_type ON registration_and_other_details(provider_type_single_or_multi);
CREATE INDEX IF NOT EXISTS idx_registration_selected_category ON registration_and_other_details(selected_category); 