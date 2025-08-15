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
 * @route GET /api/vendors-optimized
 * @desc Get paginated list of vendors with filters and search
 * @access Public
 */
router.get('/', apiCache, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      businessType,
      category,
      city,
      verified = 'true',
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate and sanitize pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = generateCacheKey(
      'vendors_list', 
      pageNum, 
      limitNum, 
      businessType, 
      category, 
      city, 
      verified, 
      search, 
      sortBy, 
      sortOrder
    );

    const fetchVendors = async () => {
      // Build dynamic WHERE clause
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Base conditions
      if (verified === 'true') {
        conditions.push(`verification_status = $${paramIndex}`);
        params.push('verified');
        paramIndex++;
      }

      // Business type filter
      if (businessType) {
        conditions.push(`LOWER(business_type) = LOWER($${paramIndex})`);
        params.push(businessType);
        paramIndex++;
      }

      // Search functionality
      if (search && search.trim()) {
        conditions.push(`(
          LOWER(person_name) LIKE LOWER($${paramIndex}) OR 
          LOWER(business_name) LIKE LOWER($${paramIndex}) OR 
          LOWER(business_description) LIKE LOWER($${paramIndex})
        )`);
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // City filter
      if (city) {
        conditions.push(`LOWER(business_address) LIKE LOWER($${paramIndex})`);
        params.push(`%${city}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      
      // Validate sort parameters
      const allowedSortFields = ['created_at', 'person_name', 'business_name', 'ratings_average'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM registration_and_other_details ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);

      // Get paginated data with optimized fields
      const dataQuery = `
        SELECT 
          sr_no as id,
          person_name,
          business_name,
          business_type,
          business_address,
          phone_number,
          business_email,
          profile_picture,
          business_description,
          verification_status,
          COALESCE(ratings_average, 0) as rating,
          COALESCE(total_reviews, 0) as reviews_count,
          created_at,
          updated_at
        FROM registration_and_other_details 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limitNum, offset);
      const dataResult = await query(dataQuery, params);

      return {
        vendors: dataResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      };
    };

    // Cache for 5 minutes
    const result = await cacheQuery(cacheKey, fetchVendors, 300);

    res.json({
      success: true,
      data: result.vendors,
      pagination: result.pagination,
      meta: {
        filters: { businessType, category, city, verified, search },
        sort: { sortBy, sortOrder }
      }
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      message: error.message
    });
  }
});

/**
 * @route GET /api/vendors-optimized/:vendorId/complete
 * @desc Get complete vendor data including services, packages, gallery
 * @access Public
 */
router.get('/:vendorId/complete', vendorCache, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const cacheKey = generateCacheKey('vendor_complete_data', vendorId);

    const fetchCompleteVendorData = async () => {
      // Execute all queries in parallel for maximum performance
      const [
        profileResult,
        servicesResult,
        packagesResult,
        combosResult,
        staffResult,
        galleryResult,
        reviewsResult,
        businessInfoResult
      ] = await Promise.allSettled([
        // Basic profile
        query(`
          SELECT 
            sr_no as id,
            person_name,
            business_name,
            business_type,
            business_address,
            phone_number,
            business_email,
            profile_picture,
            business_description,
            verification_status,
            COALESCE(ratings_average, 0) as rating,
            COALESCE(total_reviews, 0) as reviews_count,
            experience_years,
            created_at,
            updated_at
          FROM registration_and_other_details 
          WHERE sr_no = $1
        `, [vendorId]),

        // Services
        query(`
          SELECT 
            id,
            service_name as name,
            category,
            price,
            duration,
            service_image as image,
            service_description as description,
            business_type as service_type
          FROM our_services_section 
          WHERE vendor_id = $1 AND business_type = 'single'
          ORDER BY service_name
          LIMIT 20
        `, [vendorId]),

        // Packages
        query(`
          SELECT 
            id,
            service_name as name,
            category,
            price,
            duration,
            service_image as image,
            service_description as description,
            business_type as service_type
          FROM our_services_section 
          WHERE vendor_id = $1 AND business_type = 'package'
          ORDER BY service_name
          LIMIT 15
        `, [vendorId]),

        // Combos
        query(`
          SELECT 
            id,
            service_name as name,
            category,
            price,
            duration,
            service_image as image,
            service_description as description,
            business_type as service_type
          FROM our_services_section 
          WHERE vendor_id = $1 AND business_type = 'combo'
          ORDER BY service_name
          LIMIT 10
        `, [vendorId]),

        // Staff
        query(`
          SELECT 
            id,
            staff_name,
            staff_specialization,
            staff_experience,
            staff_image,
            staff_availability
          FROM vendor_staff_details 
          WHERE vendor_id = $1
          ORDER BY staff_name
          LIMIT 10
        `, [vendorId]),

        // Gallery (limited for performance)
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
          LIMIT 15
        `, [vendorId]),

        // Recent reviews (limited for performance)
        query(`
          SELECT 
            b.id,
            b.customer_rating,
            b.customer_review,
            b.created_at,
            COALESCE(c.full_name, 'Anonymous') as customer_name
          FROM salon_bookings b
          LEFT JOIN customer_table_details c ON b.customer_id = c.id
          WHERE b.vendor_id = $1 
            AND b.customer_rating IS NOT NULL
            AND b.customer_review IS NOT NULL
          ORDER BY b.created_at DESC
          LIMIT 8
        `, [vendorId]),

        // Business info
        query(`
          SELECT 
            working_hours,
            business_hours,
            specializations,
            certifications,
            years_experience
          FROM vendor_business_info 
          WHERE vendor_id = $1
        `, [vendorId])
      ]);

      // Process results with error handling
      const responseData = {
        id: vendorId,
        profile: profileResult.status === 'fulfilled' && profileResult.value.rows.length > 0 
          ? profileResult.value.rows[0] 
          : null,
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
          : [],
        businessInfo: businessInfoResult.status === 'fulfilled' && businessInfoResult.value.rows.length > 0
          ? businessInfoResult.value.rows[0]
          : null
      };

      // Calculate summary statistics
      const totalServices = responseData.services.length + responseData.packages.length + responseData.combos.length;
      const priceRange = {
        min: Math.min(
          ...responseData.services.map(s => parseFloat(s.price) || 0),
          ...responseData.packages.map(s => parseFloat(s.price) || 0),
          ...responseData.combos.map(s => parseFloat(s.price) || 0)
        ),
        max: Math.max(
          ...responseData.services.map(s => parseFloat(s.price) || 0),
          ...responseData.packages.map(s => parseFloat(s.price) || 0),
          ...responseData.combos.map(s => parseFloat(s.price) || 0)
        )
      };

      return {
        ...responseData,
        summary: {
          totalServices,
          priceRange: priceRange.min > 0 ? priceRange : null,
          hasStaff: responseData.staff.length > 0,
          hasGallery: responseData.gallery.length > 0,
          reviewsCount: responseData.reviews.length
        }
      };
    };

    // Cache complete vendor data for 10 minutes
    const vendorData = await cacheQuery(cacheKey, fetchCompleteVendorData, 600);

    if (!vendorData.profile) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
        vendorId
      });
    }

    res.json({
      success: true,
      data: vendorData
    });

  } catch (error) {
    console.error(`Error fetching complete vendor data for ${req.params.vendorId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor data',
      message: error.message,
      vendorId: req.params.vendorId
    });
  }
});

/**
 * @route GET /api/vendors-optimized/popular
 * @desc Get popular vendors with enhanced caching
 * @access Public
 */
router.get('/popular', apiCache, async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    const cacheKey = generateCacheKey('popular_vendors', limitNum);

    const fetchPopularVendors = async () => {
      const popularQuery = `
        SELECT 
          r.sr_no as id,
          r.person_name,
          r.business_name,
          r.business_type,
          r.business_address,
          r.profile_picture,
          r.business_description,
          COALESCE(r.ratings_average, 0) as rating,
          COALESCE(r.total_reviews, 0) as reviews_count,
          COUNT(DISTINCT b.id) as booking_count,
          COUNT(DISTINCT s.id) as services_count
        FROM registration_and_other_details r
        LEFT JOIN booking_all_details_of_user_to_vendor b ON r.sr_no = b.vendor_id 
          AND b.created_at >= NOW() - INTERVAL '30 days'
          AND b.booking_status = 'completed'
        LEFT JOIN our_services_section s ON r.sr_no = s.vendor_id
        WHERE r.verification_status = 'verified'
          AND r.business_type IS NOT NULL
        GROUP BY r.sr_no, r.person_name, r.business_name, r.business_type, 
                 r.business_address, r.profile_picture, r.business_description,
                 r.ratings_average, r.total_reviews
        HAVING COUNT(DISTINCT s.id) > 0
        ORDER BY 
          (COALESCE(r.ratings_average, 0) * 0.4) + 
          (COUNT(DISTINCT b.id) * 0.4) + 
          (COUNT(DISTINCT s.id) * 0.2) DESC
        LIMIT $1
      `;

      const result = await query(popularQuery, [limitNum]);
      return result.rows;
    };

    // Cache popular vendors for 15 minutes
    const vendors = await cacheQuery(cacheKey, fetchPopularVendors, 900);

    res.json({
      success: true,
      data: vendors,
      meta: {
        count: vendors.length,
        algorithm: 'rating_booking_services_weighted'
      }
    });

  } catch (error) {
    console.error('Error fetching popular vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular vendors',
      message: error.message
    });
  }
});

/**
 * @route GET /api/vendors-optimized/search
 * @desc Enhanced search with autocomplete support
 * @access Public
 */
router.get('/search', apiCache, async (req, res) => {
  try {
    const { q, type = 'full', limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.trim();
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const cacheKey = generateCacheKey('vendor_search', searchTerm, type, limitNum);

    const performSearch = async () => {
      if (type === 'autocomplete') {
        // Fast autocomplete search
        const autocompleteQuery = `
          SELECT DISTINCT
            person_name as name,
            business_name,
            'vendor' as type
          FROM registration_and_other_details
          WHERE verification_status = 'verified'
            AND (
              LOWER(person_name) LIKE LOWER($1) OR 
              LOWER(business_name) LIKE LOWER($1)
            )
          ORDER BY 
            CASE 
              WHEN LOWER(person_name) LIKE LOWER($2) THEN 1
              WHEN LOWER(business_name) LIKE LOWER($2) THEN 2
              ELSE 3
            END,
            person_name
          LIMIT $3
        `;

        const result = await query(autocompleteQuery, [`${searchTerm}%`, `${searchTerm}%`, limitNum]);
        return result.rows;
      } else {
        // Full search
        const fullSearchQuery = `
          SELECT 
            sr_no as id,
            person_name,
            business_name,
            business_type,
            business_address,
            profile_picture,
            business_description,
            COALESCE(ratings_average, 0) as rating,
            COALESCE(total_reviews, 0) as reviews_count,
            ts_rank(
              to_tsvector('english', 
                COALESCE(person_name, '') || ' ' || 
                COALESCE(business_name, '') || ' ' || 
                COALESCE(business_description, '')
              ),
              plainto_tsquery('english', $1)
            ) as relevance_score
          FROM registration_and_other_details
          WHERE verification_status = 'verified'
            AND (
              to_tsvector('english', 
                COALESCE(person_name, '') || ' ' || 
                COALESCE(business_name, '') || ' ' || 
                COALESCE(business_description, '')
              ) @@ plainto_tsquery('english', $1)
              OR
              LOWER(person_name) LIKE LOWER($2) OR 
              LOWER(business_name) LIKE LOWER($2) OR 
              LOWER(business_description) LIKE LOWER($2)
            )
          ORDER BY relevance_score DESC, ratings_average DESC
          LIMIT $3
        `;

        const result = await query(fullSearchQuery, [searchTerm, `%${searchTerm}%`, limitNum]);
        return result.rows;
      }
    };

    // Cache search results for 5 minutes
    const results = await cacheQuery(cacheKey, performSearch, 300);

    res.json({
      success: true,
      data: results,
      meta: {
        searchTerm,
        type,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error in vendor search:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

module.exports = router;