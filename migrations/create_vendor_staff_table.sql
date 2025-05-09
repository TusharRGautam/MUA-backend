-- Create vendor_staff table to store staff information
CREATE TABLE IF NOT EXISTS vendor_staff (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  email VARCHAR(255),
  profile_image TEXT,
  skills JSONB,
  availability JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraint
  CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) 
    REFERENCES registration_and_other_details (sr_no) 
    ON DELETE CASCADE
);

-- Add index for faster queries
CREATE INDEX idx_vendor_staff_vendor_id ON vendor_staff (vendor_id);

-- Add comments for documentation
COMMENT ON TABLE vendor_staff IS 'Stores information about staff members for each vendor';
COMMENT ON COLUMN vendor_staff.vendor_id IS 'Foreign key to registration_and_other_details table';
COMMENT ON COLUMN vendor_staff.name IS 'Name of the staff member';
COMMENT ON COLUMN vendor_staff.position IS 'Job title or position of the staff member';
COMMENT ON COLUMN vendor_staff.contact_number IS 'Phone number of the staff member';
COMMENT ON COLUMN vendor_staff.email IS 'Email address of the staff member';
COMMENT ON COLUMN vendor_staff.profile_image IS 'Profile picture URL or base64 data';
COMMENT ON COLUMN vendor_staff.skills IS 'JSON array of skills (e.g., ["Bridal Makeup", "Hair Styling"])';
COMMENT ON COLUMN vendor_staff.availability IS 'JSON object containing schedule information by day';
COMMENT ON COLUMN vendor_staff.active IS 'Whether the staff member is currently active'; 