-- Verification Script: Check inserted packages and combos
-- Description: Verifies that the 5 packages and 5 combos were successfully inserted
-- Date: 2025-01-30

-- Show all service types count
SELECT 
    service_type,
    COUNT(*) as total_count
FROM dashboard_salon_services 
GROUP BY service_type
ORDER BY service_type;

-- Show detailed information about packages
SELECT 
    'PACKAGES' as type,
    id,
    package_name,
    service_name,
    service_category,
    service_price,
    service_duration,
    selected_services
FROM dashboard_salon_services 
WHERE service_type = 'Package'
ORDER BY service_price DESC;

-- Show detailed information about combos
SELECT 
    'COMBOS' as type,
    id,
    package_name,
    service_name,
    service_category,
    service_price,
    service_duration,
    selected_services
FROM dashboard_salon_services 
WHERE service_type = 'Combo'
ORDER BY service_price DESC;

-- Show pricing summary
SELECT 
    service_type,
    MIN(service_price) as min_price,
    MAX(service_price) as max_price,
    AVG(service_price) as avg_price,
    MIN(service_duration) as min_duration,
    MAX(service_duration) as max_duration,
    AVG(service_duration) as avg_duration
FROM dashboard_salon_services 
WHERE service_type IN ('Package', 'Combo')
GROUP BY service_type;

-- Show service categories breakdown
SELECT 
    service_category,
    COUNT(*) as count,
    service_type
FROM dashboard_salon_services 
WHERE service_type IN ('Package', 'Combo')
GROUP BY service_category, service_type
ORDER BY service_category, service_type;