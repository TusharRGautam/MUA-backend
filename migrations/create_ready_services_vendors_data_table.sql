-- Create ready_services_vendors_data table
CREATE TABLE IF NOT EXISTS ready_services_vendors_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    selected_categories JSON NOT NULL,
    service_type ENUM('single', 'multi') DEFAULT 'single',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_created_at (created_at)
);

-- Add foreign key constraint if registration_and_other_details table exists
-- ALTER TABLE ready_services_vendors_data 
-- ADD CONSTRAINT fk_ready_services_vendor_id 
-- FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) 
-- ON DELETE CASCADE ON UPDATE CASCADE; 