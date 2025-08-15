const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { 
  apiCache, 
  vendorCache, 
  cacheQuery, 
  generateCacheKey 
} = require('../middleware/cache');

/**
 * Optimized Artist Profile Data Endpoint
 * Fetches all artist/vendor data in one request
 * GET /api/component-data/artist/:artistId
 */
router.get('/artist/:artistId', vendorCache, async (req, res) => {
  try {
    const { artistId } = req.params;
    console.log(`🎨 Fetching complete artist profile data for ID: ${artistId}`);
    const startTime = Date.now();

    const cacheKey = generateCacheKey('artist_profile_complete', artistId);

    const fetchArtistData = async () => {

    // Execute all queries in parallel for optimal performance
    const dataQueries = await Promise.allSettled([
      // 1. Artist Profile
      query(`
        SELECT 
          sr_no as id,
          person_name,
          business_name,
          business_type,
          business_address,
          phone_number,
          profile_picture,
          business_email,
          verification_status,
          ratings_average,
          total_reviews,
          experience_years,
          created_at,
          updated_at
        FROM registration_and_other_details 
        WHERE sr_no = $1
      `, [artistId]),

      // 2. Business Type & Categories
      query(`
        SELECT DISTINCT business_type 
        FROM registration_and_other_details 
        WHERE sr_no = $1
      `, [artistId]),

      // 3. Single Services
      query(`
        SELECT 
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          business_type
        FROM our_services_section 
        WHERE vendor_id = $1 AND business_type = 'single'
        ORDER BY service_name
      `, [artistId]),

      // 4. Package Services
      query(`
        SELECT 
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          business_type
        FROM our_services_section 
        WHERE vendor_id = $1 AND business_type = 'package'
        ORDER BY service_name
      `, [artistId]),

      // 5. Combo Services
      query(`
        SELECT 
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          business_type
        FROM our_services_section 
        WHERE vendor_id = $1 AND business_type = 'combo'
        ORDER BY service_name
      `, [artistId]),

      // 6. Vendor Staff
      query(`
        SELECT 
          id,
          staff_name,
          staff_specialization,
          staff_experience,
          staff_image,
          staff_phone,
          staff_availability
        FROM vendor_staff_details 
        WHERE vendor_id = $1
        ORDER BY staff_name
      `, [artistId]),

      // 7. Gallery Images
      query(`
        SELECT 
          id,
          image_url,
          image_description,
          category,
          is_featured,
          created_at
        FROM vendor_gallery 
        WHERE vendor_id = $1
        ORDER BY is_featured DESC, created_at DESC
        LIMIT 20
      `, [artistId]),

      // 8. Reviews
      query(`
        SELECT 
          b.id,
          b.customer_rating,
          b.customer_review,
          b.created_at,
          c.full_name as customer_name
        FROM salon_bookings b
        LEFT JOIN Customer_Table_Details c ON b.customer_id = c.id
        WHERE b.vendor_id = $1 
          AND b.customer_rating IS NOT NULL
          AND b.customer_review IS NOT NULL
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [artistId])
    ]);

    // Process results
    const [
      profileResult,
      businessTypeResult,
      servicesResult,
      packagesResult,
      combosResult,
      staffResult,
      galleryResult,
      reviewsResult
    ] = dataQueries;

    // Build response data
    const responseData = {
      id: artistId,
      profile: profileResult.status === 'fulfilled' && profileResult.value.rows.length > 0 
        ? profileResult.value.rows[0] 
        : null,
      businessType: businessTypeResult.status === 'fulfilled' && businessTypeResult.value.rows.length > 0
        ? businessTypeResult.value.rows[0].business_type
        : '',
      categories: businessTypeResult.status === 'fulfilled' 
        ? businessTypeResult.value.rows.map(row => row.business_type)
        : [],
      services: servicesResult.status === 'fulfilled' 
        ? servicesResult.value.rows 
        : [],
      packages: packagesResult.status === 'fulfilled' 
        ? packagesResult.value.rows 
        : [],
      combos: combosResult.status === 'fulfilled' 
        ? combosResult.value.rows 
        : [],
      staff: staffResult.status === 'fulfilled' 
        ? staffResult.value.rows 
        : [],
      gallery: galleryResult.status === 'fulfilled' 
        ? galleryResult.value.rows 
        : [],
      reviews: reviewsResult.status === 'fulfilled' 
        ? reviewsResult.value.rows 
        : []
    };

    const executionTime = Date.now() - startTime;
    console.log(`✅ Artist profile data fetched in ${executionTime}ms`);

    res.json({
      success: true,
      data: responseData,
      metadata: {
        execution_time_ms: executionTime,
        artist_id: artistId,
        data_completeness: {
          profile: !!responseData.profile,
          services_count: responseData.services.length,
          packages_count: responseData.packages.length,
          combos_count: responseData.combos.length,
          staff_count: responseData.staff.length,
          gallery_count: responseData.gallery.length,
          reviews_count: responseData.reviews.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Failed to fetch artist profile data for ${req.params.artistId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artist profile data',
      message: error.message,
      artist_id: req.params.artistId
    });
  }
});

/**
 * Optimized Salon Details Data Endpoint
 * Fetches all salon data in one request
 * GET /api/component-data/salon/:salonId
 */
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    console.log(`🏪 Fetching complete salon details data for ID: ${salonId}`);
    const startTime = Date.now();

    // Execute all queries in parallel
    const dataQueries = await Promise.allSettled([
      // 1. Salon Profile
      query(`
        SELECT 
          sr_no as id,
          person_name,
          business_name,
          business_type,
          business_address,
          phone_number,
          profile_picture,
          business_email,
          verification_status,
          ratings_average,
          total_reviews,
          created_at,
          updated_at
        FROM registration_and_other_details 
        WHERE sr_no = $1 AND business_type ILIKE '%salon%'
      `, [salonId]),

      // 2. Salon Services
      query(`
        SELECT 
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          business_type
        FROM our_services_section 
        WHERE vendor_id = $1
        ORDER BY business_type, service_name
      `, [salonId]),

      // 3. Salon Staff
      query(`
        SELECT 
          id,
          staff_name,
          staff_specialization,
          staff_experience,
          staff_image,
          staff_phone,
          staff_availability
        FROM vendor_staff_details 
        WHERE vendor_id = $1
        ORDER BY staff_name
      `, [salonId]),

      // 4. Salon Gallery
      query(`
        SELECT 
          id,
          image_url,
          image_description,
          category,
          is_featured,
          created_at
        FROM vendor_gallery 
        WHERE vendor_id = $1
        ORDER BY is_featured DESC, created_at DESC
        LIMIT 30
      `, [salonId]),

      // 5. Working Hours
      query(`
        SELECT 
          day_of_week,
          opening_time,
          closing_time,
          is_closed
        FROM vendor_working_hours 
        WHERE vendor_id = $1
        ORDER BY 
          CASE day_of_week 
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
            WHEN 'sunday' THEN 7
          END
      `, [salonId]),

      // 6. Reviews
      query(`
        SELECT 
          b.id,
          b.customer_rating,
          b.customer_review,
          b.created_at,
          c.full_name as customer_name
        FROM salon_bookings b
        LEFT JOIN Customer_Table_Details c ON b.customer_id = c.id
        WHERE b.vendor_id = $1 
          AND b.customer_rating IS NOT NULL
          AND b.customer_review IS NOT NULL
        ORDER BY b.created_at DESC
        LIMIT 15
      `, [salonId])
    ]);

    // Process results
    const [
      profileResult,
      servicesResult,
      staffResult,
      galleryResult,
      workingHoursResult,
      reviewsResult
    ] = dataQueries;

    // Group services by type
    const allServices = servicesResult.status === 'fulfilled' ? servicesResult.value.rows : [];
    const servicesByType = {
      single: allServices.filter(s => s.business_type === 'single'),
      package: allServices.filter(s => s.business_type === 'package'),
      combo: allServices.filter(s => s.business_type === 'combo')
    };

    // Build response data
    const responseData = {
      id: salonId,
      salon: profileResult.status === 'fulfilled' && profileResult.value.rows.length > 0 
        ? profileResult.value.rows[0] 
        : null,
      services: servicesByType.single,
      packages: servicesByType.package,
      combos: servicesByType.combo,
      staff: staffResult.status === 'fulfilled' 
        ? staffResult.value.rows 
        : [],
      gallery: galleryResult.status === 'fulfilled' 
        ? galleryResult.value.rows 
        : [],
      workingHours: workingHoursResult.status === 'fulfilled' 
        ? workingHoursResult.value.rows 
        : [],
      reviews: reviewsResult.status === 'fulfilled' 
        ? reviewsResult.value.rows 
        : []
    };

    const executionTime = Date.now() - startTime;
    console.log(`✅ Salon details data fetched in ${executionTime}ms`);

    res.json({
      success: true,
      data: responseData,
      metadata: {
        execution_time_ms: executionTime,
        salon_id: salonId,
        data_completeness: {
          profile: !!responseData.salon,
          services_count: responseData.services.length,
          packages_count: responseData.packages.length,
          combos_count: responseData.combos.length,
          staff_count: responseData.staff.length,
          gallery_count: responseData.gallery.length,
          working_hours_available: responseData.workingHours.length > 0,
          reviews_count: responseData.reviews.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Failed to fetch salon details data for ${req.params.salonId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch salon details data',
      message: error.message,
      salon_id: req.params.salonId
    });
  }
});

/**
 * Optimized Service Details Data Endpoint
 * Fetches service data by category and gender
 * POST /api/component-data/services
 */
router.post('/services', async (req, res) => {
  try {
    const { category, gender } = req.body;
    console.log(`🛍️ Fetching service details for category: ${category}, gender: ${gender}`);
    const startTime = Date.now();

    if (!category || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Category and gender are required'
      });
    }

    // Execute all queries in parallel
    const dataQueries = await Promise.allSettled([
      // 1. Main Services
      query(`
        SELECT 
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          toggle_gender_services as gender,
          icon_id,
          business_type,
          created_at
        FROM our_services_section 
        WHERE LOWER(category) = LOWER($1) 
          AND (
            LOWER(toggle_gender_services) = LOWER($2) 
            OR toggle_gender_services = 'unisex'
          )
        ORDER BY business_type, service_name
        LIMIT 50
      `, [category, gender]),

      // 2. Related Services (same category, different gender or related categories)
      query(`
        SELECT DISTINCT
          id,
          service_name as name,
          category,
          price,
          duration,
          service_image as image,
          service_description as description,
          toggle_gender_services as gender,
          business_type
        FROM our_services_section 
        WHERE (
          (LOWER(category) = LOWER($1) AND LOWER(toggle_gender_services) != LOWER($2))
          OR (LOWER(category) SIMILAR TO '%($1)%' AND LOWER(category) != LOWER($1))
        )
        ORDER BY business_type, service_name
        LIMIT 20
      `, [category, gender]),

      // 3. Service Icons
      query(`
        SELECT 
          id,
          icon_name,
          icon_url,
          category,
          gender
        FROM service_icons 
        WHERE LOWER(category) = LOWER($1)
        ORDER BY icon_name
      `, [category]),

      // 4. Service Sections/Categories
      query(`
        SELECT DISTINCT 
          category,
          COUNT(*) as service_count,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price) as avg_price
        FROM our_services_section 
        WHERE LOWER(toggle_gender_services) = LOWER($1) 
          OR toggle_gender_services = 'unisex'
        GROUP BY category
        ORDER BY service_count DESC
      `, [gender]),

      // 5. Popular Services (highest booking count)
      query(`
        SELECT 
          s.id,
          s.service_name as name,
          s.category,
          s.price,
          s.duration,
          s.service_image as image,
          COUNT(b.id) as booking_count
        FROM our_services_section s
        LEFT JOIN salon_bookings b ON s.id = ANY(string_to_array(b.selected_services, ',')::int[])
        WHERE LOWER(s.category) = LOWER($1)
          AND (
            LOWER(s.toggle_gender_services) = LOWER($2) 
            OR s.toggle_gender_services = 'unisex'
          )
        GROUP BY s.id, s.service_name, s.category, s.price, s.duration, s.service_image
        ORDER BY booking_count DESC, s.service_name
        LIMIT 10
      `, [category, gender])
    ]);

    // Process results
    const [
      servicesResult,
      relatedServicesResult,
      iconsResult,
      sectionsResult,
      popularServicesResult
    ] = dataQueries;

    // Group services by business type
    const allServices = servicesResult.status === 'fulfilled' ? servicesResult.value.rows : [];
    const servicesByType = {
      single: allServices.filter(s => s.business_type === 'single'),
      package: allServices.filter(s => s.business_type === 'package'),
      combo: allServices.filter(s => s.business_type === 'combo')
    };

    // Build response data
    const responseData = {
      category,
      gender,
      services: servicesByType.single,
      packages: servicesByType.package,
      combos: servicesByType.combo,
      relatedServices: relatedServicesResult.status === 'fulfilled' 
        ? relatedServicesResult.value.rows 
        : [],
      icons: iconsResult.status === 'fulfilled' 
        ? iconsResult.value.rows 
        : [],
      sections: sectionsResult.status === 'fulfilled' 
        ? sectionsResult.value.rows 
        : [],
      popularServices: popularServicesResult.status === 'fulfilled' 
        ? popularServicesResult.value.rows 
        : []
    };

    const executionTime = Date.now() - startTime;
    console.log(`✅ Service details data fetched in ${executionTime}ms`);

    res.json({
      success: true,
      data: responseData,
      metadata: {
        execution_time_ms: executionTime,
        category,
        gender,
        data_completeness: {
          services_count: responseData.services.length,
          packages_count: responseData.packages.length,
          combos_count: responseData.combos.length,
          related_services_count: responseData.relatedServices.length,
          icons_count: responseData.icons.length,
          sections_count: responseData.sections.length,
          popular_services_count: responseData.popularServices.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch service details data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service details data',
      message: error.message,
      category: req.body.category,
      gender: req.body.gender
    });
  }
});

/**
 * Batch Prefetch Endpoint
 * Allows prefetching multiple components at once
 * POST /api/component-data/batch-prefetch
 */
router.post('/batch-prefetch', async (req, res) => {
  try {
    const { requests } = req.body;
    console.log(`📦 Processing batch prefetch for ${requests?.length || 0} requests`);
    const startTime = Date.now();

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Requests array is required'
      });
    }

    // Process all requests in parallel
    const prefetchPromises = requests.map(async (request, index) => {
      try {
        const { type, ...params } = request;
        
        switch (type) {
          case 'artist':
            if (params.artistId) {
              const artistResponse = await query(`
                SELECT sr_no as id, person_name, business_name, business_type, ratings_average 
                FROM registration_and_other_details 
                WHERE sr_no = $1
              `, [params.artistId]);
              
              return {
                index,
                type: 'artist',
                id: params.artistId,
                success: true,
                data: artistResponse.rows[0] || null
              };
            }
            break;
            
          case 'salon':
            if (params.salonId) {
              const salonResponse = await query(`
                SELECT sr_no as id, person_name, business_name, business_type, ratings_average 
                FROM registration_and_other_details 
                WHERE sr_no = $1 AND business_type ILIKE '%salon%'
              `, [params.salonId]);
              
              return {
                index,
                type: 'salon',
                id: params.salonId,
                success: true,
                data: salonResponse.rows[0] || null
              };
            }
            break;
            
          case 'service':
            if (params.category && params.gender) {
              const serviceResponse = await query(`
                SELECT COUNT(*) as count 
                FROM our_services_section 
                WHERE LOWER(category) = LOWER($1) 
                  AND (LOWER(toggle_gender_services) = LOWER($2) OR toggle_gender_services = 'unisex')
              `, [params.category, params.gender]);
              
              return {
                index,
                type: 'service',
                id: `${params.category}-${params.gender}`,
                success: true,
                data: { serviceCount: serviceResponse.rows[0]?.count || 0 }
              };
            }
            break;
        }
        
        return {
          index,
          type: request.type,
          success: false,
          error: 'Invalid request parameters'
        };
        
      } catch (error) {
        return {
          index,
          type: request.type,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.allSettled(prefetchPromises);
    const prefetchData = results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
    );

    const executionTime = Date.now() - startTime;
    console.log(`✅ Batch prefetch completed in ${executionTime}ms`);

    res.json({
      success: true,
      data: prefetchData,
      metadata: {
        execution_time_ms: executionTime,
        requests_count: requests.length,
        successful_count: prefetchData.filter(item => item.success).length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Batch prefetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch prefetch failed',
      message: error.message
    });
  }
});

module.exports = router;