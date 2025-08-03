-- Database Performance Optimization Script
-- Apply these optimizations to improve query performance

-- 1. Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_email ON registration_and_other_details(business_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_verification_status ON registration_and_other_details(verification_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_created_at ON registration_and_other_details(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_business_type ON registration_and_other_details(business_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_city ON registration_and_other_details(city);

-- 2. Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_status_created ON registration_and_other_details(verification_status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_type_status ON registration_and_other_details(business_type, verification_status);

-- 3. Customer table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_status ON customer_table_details(user_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_created_at ON customer_table_details(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_email ON customer_table_details(email);

-- 4. Vendor services indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_single_services(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_gallery_vendor_id ON vendor_gallery_images(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_transformations_vendor_id ON vendor_transformations(vendor_id);

-- 5. Performance monitoring views
CREATE OR REPLACE VIEW vendor_summary AS
SELECT 
  r.sr_no,
  r.business_name,
  r.person_name,
  r.business_email,
  r.verification_status,
  r.created_at,
  COALESCE(service_counts.total_services, 0) as total_services,
  COALESCE(gallery_counts.total_gallery_images, 0) as total_gallery_images,
  COALESCE(transformation_counts.total_transformations, 0) as total_transformations
FROM registration_and_other_details r
LEFT JOIN (
  SELECT vendor_id, COUNT(*) as total_services
  FROM vendor_single_services
  GROUP BY vendor_id
) service_counts ON r.sr_no = service_counts.vendor_id
LEFT JOIN (
  SELECT vendor_id, COUNT(*) as total_gallery_images
  FROM vendor_gallery_images
  GROUP BY vendor_id
) gallery_counts ON r.sr_no = gallery_counts.vendor_id
LEFT JOIN (
  SELECT vendor_id, COUNT(*) as total_transformations
  FROM vendor_transformations
  GROUP BY vendor_id
) transformation_counts ON r.sr_no = transformation_counts.vendor_id;

-- 6. Optimized pagination function
CREATE OR REPLACE FUNCTION get_vendors_paginated(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  sr_no INTEGER,
  business_name TEXT,
  person_name TEXT,
  business_email TEXT,
  verification_status TEXT,
  created_at TIMESTAMP,
  total_services BIGINT,
  total_gallery_images BIGINT,
  total_transformations BIGINT,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_vendors AS (
    SELECT v.*
    FROM vendor_summary v
    WHERE 
      (p_status IS NULL OR v.verification_status = p_status)
      AND (p_search IS NULL OR (
        v.person_name ILIKE '%' || p_search || '%' OR
        v.business_name ILIKE '%' || p_search || '%' OR
        v.business_email ILIKE '%' || p_search || '%'
      ))
  ),
  total_count_cte AS (
    SELECT COUNT(*) as total_count FROM filtered_vendors
  )
  SELECT 
    v.sr_no::INTEGER,
    v.business_name,
    v.person_name,
    v.business_email,
    v.verification_status,
    v.created_at,
    v.total_services,
    v.total_gallery_images,
    v.total_transformations,
    tc.total_count
  FROM filtered_vendors v
  CROSS JOIN total_count_cte tc
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$; 