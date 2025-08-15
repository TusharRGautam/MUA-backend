-- Performance Optimization Indexes for MUA Backend
-- Run this file to add missing indexes for better query performance

-- ==================================================================
-- BOOKING PERFORMANCE INDEXES
-- ==================================================================

-- Composite index for booking queries by user and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_user_status_date 
ON booking_all_details_of_user_to_vendor (user_id, booking_status, booking_date DESC);

-- Composite index for vendor booking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_vendor_status_date 
ON booking_all_details_of_user_to_vendor (vendor_id, booking_status, booking_date DESC);

-- Index for booking search by email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_emails 
ON booking_all_details_of_user_to_vendor (user_email, vendor_email);

-- Index for service category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_service_category 
ON booking_all_details_of_user_to_vendor (service_category, service_gender);

-- Partial index for pending bookings (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_pending_status 
ON booking_all_details_of_user_to_vendor (created_at DESC) 
WHERE booking_status IN ('pending', 'pending_vendor_acceptance', 'pending_solo_vendor_acceptance');

-- Index for booking analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_analytics 
ON booking_all_details_of_user_to_vendor (created_at, booking_status, total_amount) 
WHERE booking_status IS NOT NULL;

-- ==================================================================
-- VENDOR PERFORMANCE INDEXES
-- ==================================================================

-- Composite index for vendor search and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_search_filter 
ON registration_and_other_details (verification_status, business_type, created_at DESC);

-- Full-text search index for vendor names and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_fulltext_search 
ON registration_and_other_details 
USING GIN (to_tsvector('english', 
  COALESCE(person_name, '') || ' ' || 
  COALESCE(business_name, '') || ' ' || 
  COALESCE(business_description, '')
));

-- Index for vendor location-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_address_search 
ON registration_and_other_details (business_address) 
WHERE business_address IS NOT NULL;

-- Composite index for popular vendors query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_popularity 
ON registration_and_other_details (verification_status, ratings_average DESC, total_reviews DESC) 
WHERE verification_status = 'verified';

-- ==================================================================
-- SERVICES PERFORMANCE INDEXES
-- ==================================================================

-- Composite index for service filtering by category and gender
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category_gender_type 
ON our_services_section (category, toggle_gender_services, business_type, vendor_id);

-- Index for service pricing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_price_range 
ON our_services_section (category, price, business_type) 
WHERE price IS NOT NULL AND price > 0;

-- Index for vendor services lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_vendor_type 
ON our_services_section (vendor_id, business_type, created_at DESC);

-- Partial index for active services only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active 
ON our_services_section (category, vendor_id, price) 
WHERE service_name IS NOT NULL AND price > 0;

-- ==================================================================
-- VENDOR DATA INDEXES
-- ==================================================================

-- Index for ready_services_vendors_data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ready_vendors_business_verified 
ON ready_services_vendors_data (business_type, vendor_id) 
WHERE business_type IS NOT NULL;

-- Index for vendor categories search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ready_vendors_categories 
ON ready_services_vendors_data 
USING GIN (selected_categories);

-- ==================================================================
-- GALLERY AND MEDIA INDEXES
-- ==================================================================

-- Index for vendor gallery queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_gallery_featured 
ON vendor_gallery_images (vendor_id, is_featured DESC, created_at DESC);

-- Index for random gallery images
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_random_gallery_vendor_featured 
ON random_images_gallery_and_transformation (vendor_id, featured_or_not DESC, upload_timestamp DESC);

-- ==================================================================
-- NOTIFICATION INDEXES
-- ==================================================================

-- Index for vendor notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_notifications_status 
ON vendor_notifications (vendor_id, is_read, sent_at DESC);

-- ==================================================================
-- CUSTOMER DATA INDEXES
-- ==================================================================

-- Composite index for customer lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_auth_lookup 
ON customer_table_details (email, phone_number, custom_user_id);

-- Index for customer address queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_address 
ON customer_table_details (address_label, address_line1) 
WHERE address_line1 IS NOT NULL;

-- ==================================================================
-- VENDOR STAFF INDEXES
-- ==================================================================

-- Index for vendor staff queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_staff_availability 
ON vendor_staff_details (vendor_id, staff_availability);

-- ==================================================================
-- PERFORMANCE MONITORING INDEXES
-- ==================================================================

-- Index for monitoring booking trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_trends 
ON booking_all_details_of_user_to_vendor (DATE(created_at), booking_status, total_amount);

-- Index for vendor performance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_performance_tracking 
ON booking_all_details_of_user_to_vendor (vendor_id, booking_status, created_at) 
WHERE booking_status = 'completed';

-- ==================================================================
-- CLEANUP OLD/UNUSED INDEXES
-- ==================================================================

-- Note: Before dropping indexes, ensure they're not being used
-- You can check index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan ASC;

-- Drop duplicate or unused indexes (uncomment if confirmed unused)
-- DROP INDEX IF EXISTS old_unused_index_name;

-- ==================================================================
-- STATISTICS UPDATE
-- ==================================================================

-- Update table statistics for better query planning
ANALYZE booking_all_details_of_user_to_vendor;
ANALYZE registration_and_other_details;
ANALYZE our_services_section;
ANALYZE ready_services_vendors_data;
ANALYZE vendor_gallery_images;
ANALYZE customer_table_details;

-- ==================================================================
-- VACUUM AND MAINTENANCE
-- ==================================================================

-- Vacuum frequently updated tables to reclaim space and update statistics
VACUUM ANALYZE booking_all_details_of_user_to_vendor;
VACUUM ANALYZE registration_and_other_details;

-- ==================================================================
-- PERFORMANCE MONITORING QUERIES
-- ==================================================================

-- Use these queries to monitor index usage and performance:

/*
-- Check index usage:
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes:
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_live_tuples(c.oid) as live_tuples,
  pg_stat_get_dead_tuples(c.oid) as dead_tuples
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries:
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
*/