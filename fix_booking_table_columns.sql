-- Fix booking table by adding missing columns
ALTER TABLE booking_all_details_of_user_to_vendor 
ADD COLUMN IF NOT EXISTS booking_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS services_booked JSONB,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS booking_date DATE,
ADD COLUMN IF NOT EXISTS booking_time TIME,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS service_category VARCHAR(100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_vendor_id ON booking_all_details_of_user_to_vendor(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking_all_details_of_user_to_vendor(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking_all_details_of_user_to_vendor(status);
CREATE INDEX IF NOT EXISTS idx_booking_date ON booking_all_details_of_user_to_vendor(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_category ON booking_all_details_of_user_to_vendor(service_category); 