const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Combined User Dashboard Data Endpoint
 * Fetches all necessary data for the user dashboard in one request
 * GET /api/combined/user-dashboard
 */
router.get('/user-dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Fetching combined user dashboard data...');
    const user = req.user;
    const startTime = Date.now();

    // Parallel data fetching for optimal performance
    const dataFetchPromises = [];

    // 1. User Profile Data
    dataFetchPromises.push(
      (async () => {
        try {
          if (user.role === 'customer') {
            return {
              id: user.id,
              custom_user_id: user.custom_user_id,
              full_name: user.full_name,
              fullName: user.full_name,
              email: user.email,
              phone_number: user.phone_number,
              phoneNumber: user.phone_number,
              role: user.role
            };
          } else {
            return {
              id: user.id,
              custom_user_id: user.custom_user_id,
              full_name: user.person_name,
              fullName: user.person_name,
              name: user.person_name,
              email: user.business_email || user.email,
              phone_number: user.phone_number,
              phoneNumber: user.phone_number,
              business_type: user.business_type,
              business_name: user.business_name,
              role: user.role
            };
          }
        } catch (error) {
          console.warn('Failed to fetch profile data:', error);
          return null;
        }
      })()
    );

    // 2. Recent Bookings
    dataFetchPromises.push(
      (async () => {
        try {
          let bookingsQuery;
          let queryParams;
          
          if (user.role === 'customer') {
            bookingsQuery = `
              SELECT 
                b.*,
                v.person_name as vendor_name,
                v.business_name,
                v.business_type
              FROM salon_bookings b
              LEFT JOIN registration_and_other_details v ON b.vendor_id = v.sr_no
              WHERE b.customer_id = $1
              ORDER BY b.created_at DESC
              LIMIT 10
            `;
            queryParams = [user.id];
          } else {
            bookingsQuery = `
              SELECT 
                b.*,
                c.full_name as customer_name,
                c.phone_number as customer_phone
              FROM salon_bookings b
              LEFT JOIN Customer_Table_Details c ON b.customer_id = c.id
              WHERE b.vendor_id = $1
              ORDER BY b.created_at DESC
              LIMIT 10
            `;
            queryParams = [user.id];
          }

          const result = await query(bookingsQuery, queryParams);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch bookings:', error);
          return [];
        }
      })()
    );

    // 3. Featured Vendors (for customers) or Business Stats (for vendors)
    dataFetchPromises.push(
      (async () => {
        try {
          if (user.role === 'customer') {
            // Fetch featured vendors
            const vendorsQuery = `
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
                total_reviews
              FROM registration_and_other_details 
              WHERE verification_status = 'verified'
              AND business_type IS NOT NULL
              ORDER BY ratings_average DESC NULLS LAST, total_reviews DESC NULLS LAST
              LIMIT 20
            `;
            const result = await query(vendorsQuery);
            return result.rows || [];
          } else {
            // Fetch business stats for vendors
            const statsQuery = `
              SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COALESCE(AVG(CASE WHEN customer_rating IS NOT NULL THEN customer_rating END), 0) as avg_rating
              FROM salon_bookings 
              WHERE vendor_id = $1
            `;
            const result = await query(statsQuery, [user.id]);
            return result.rows[0] || {};
          }
        } catch (error) {
          console.warn('Failed to fetch vendors/stats:', error);
          return [];
        }
      })()
    );

    // 4. Service Categories
    dataFetchPromises.push(
      (async () => {
        try {
          const servicesQuery = `
            SELECT DISTINCT 
              business_type as category,
              COUNT(*) as vendor_count
            FROM registration_and_other_details 
            WHERE business_type IS NOT NULL
            AND verification_status = 'verified'
            GROUP BY business_type
            ORDER BY vendor_count DESC
            LIMIT 10
          `;
          const result = await query(servicesQuery);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch service categories:', error);
          return [];
        }
      })()
    );

    // Execute all queries in parallel
    const [
      profileData,
      bookingsData,
      vendorsOrStatsData,
      serviceCategories
    ] = await Promise.all(dataFetchPromises);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ Combined data fetch completed in ${executionTime}ms`);

    // Return combined data
    res.json({
      success: true,
      data: {
        profile: profileData,
        bookings: bookingsData,
        vendors: user.role === 'customer' ? vendorsOrStatsData : [],
        stats: user.role !== 'customer' ? vendorsOrStatsData : {},
        services: serviceCategories
      },
      metadata: {
        execution_time_ms: executionTime,
        user_role: user.role,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch combined dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

/**
 * Public Vendor Data Endpoint (No Auth Required)
 * Fetches vendor data for public display
 * GET /api/combined/public-vendors
 */
router.get('/public-vendors', async (req, res) => {
  try {
    console.log('🌐 Fetching public vendor data...');
    const { limit = 20, category, featured = false } = req.query;
    const startTime = Date.now();

    let vendorsQuery = `
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
        created_at
      FROM registration_and_other_details 
      WHERE verification_status = 'verified'
      AND business_type IS NOT NULL
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      vendorsQuery += ` AND business_type = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      vendorsQuery += ` AND (ratings_average >= 4.0 OR total_reviews >= 10)`;
    }

    vendorsQuery += ` ORDER BY ratings_average DESC NULLS LAST, total_reviews DESC NULLS LAST`;
    vendorsQuery += ` LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));

    const result = await query(vendorsQuery, queryParams);
    const endTime = Date.now();

    console.log(`✅ Public vendor data fetched in ${endTime - startTime}ms`);

    res.json({
      success: true,
      data: {
        vendors: result.rows || [],
        count: result.rows?.length || 0
      },
      metadata: {
        execution_time_ms: endTime - startTime,
        filters: { category, featured, limit },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch public vendor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor data',
      message: error.message
    });
  }
});

/**
 * ⚡ CRITICAL: Instant Booking Home Data (for immediate UI display)
 * GET /api/combined/booking-home/critical
 */
router.get('/booking-home/critical', async (req, res) => {
  try {
    console.log('🚀 [CRITICAL] Fetching critical booking-home data for instant UI...');
    const startTime = Date.now();

    // ONLY fetch critical data needed for immediate UI display
    const criticalDataPromises = [];

    // 1. Service Icons (essential for main UI)
    criticalDataPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT id, icon_title, icon, icon_description
            FROM our_services_icons
            LIMIT 8
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch service icons:', error);
          return [];
        }
      })()
    );

    // 2. Minimal vendor profiles (just 3 for initial display)
    criticalDataPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              r.sr_no, 
              r.person_name, 
              r.business_name, 
              r.business_type,
              CASE 
                WHEN LENGTH(r.profile_picture) > 10 THEN r.profile_picture 
                ELSE NULL 
              END as profile_picture
            FROM registration_and_other_details r
            WHERE r.vendor_status = $1 
            AND r.verification_status = ANY($2)
            ORDER BY r.sr_no LIMIT 3
          `, ['active', ['verified', 'approved']]);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch initial vendor profiles:', error);
          return [];
        }
      })()
    );

    // Execute critical queries in parallel
    const [serviceIcons, initialVendors] = await Promise.all(criticalDataPromises);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ [CRITICAL] Critical data loaded in ${executionTime}ms for instant UI display`);

    res.json({
      success: true,
      data: {
        serviceIcons: serviceIcons,
        initialVendors: initialVendors
      },
      metadata: {
        execution_time_ms: executionTime,
        type: 'critical',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [CRITICAL] Failed to fetch critical data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch critical data'
    });
  }
});

/**
 * ⚡ BACKGROUND: Secondary Booking Home Data (loads silently in background)
 * GET /api/combined/booking-home/background
 */
router.get('/booking-home/background', async (req, res) => {
  try {
    console.log('📦 [BACKGROUND] Fetching secondary booking-home data...');
    const startTime = Date.now();

    // Fetch all non-critical data in parallel
    const backgroundDataPromises = [];

    // 1. Remaining vendor profiles (7 more)
    backgroundDataPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              r.sr_no, 
              r.business_email, 
              r.person_name, 
              r.business_type, 
              r.business_name, 
              r.phone_number, 
              CASE 
                WHEN LENGTH(r.profile_picture) > 10 THEN r.profile_picture 
                ELSE NULL 
              END as profile_picture,
              r.business_address, 
              r.business_description, 
              r.provider_type_single_or_multi, 
              COALESCE(rs.selected_categories::text, r.selected_category) as selected_category,
              r.vendor_status, 
              r.verification_status
            FROM registration_and_other_details r
            LEFT JOIN ready_services_vendors_data rs ON r.sr_no = rs.vendor_id
            WHERE r.vendor_status = $1 
            AND r.verification_status = ANY($2)
            ORDER BY r.sr_no OFFSET 3 LIMIT 7
          `, ['active', ['verified', 'approved']]);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch additional vendors:', error);
          return [];
        }
      })()
    );

    // 2. Popular Salon Owners
    backgroundDataPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              sr_no, person_name, business_name, business_type, 
              phone_number, profile_picture
            FROM registration_and_other_details 
            WHERE business_type = 'salon' 
            AND verification_status = 'verified' 
            AND vendor_status = 'active'
            ORDER BY sr_no 
            LIMIT 5
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch salon owners:', error);
          return [];
        }
      })()
    );

    // 3. PRP Specialists
    backgroundDataPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              sr_no, person_name, business_name, business_type, 
              phone_number, profile_picture
            FROM registration_and_other_details 
            WHERE business_type = 'prp' 
            AND verification_status = 'verified' 
            AND vendor_status = 'active'
            ORDER BY sr_no 
            LIMIT 5
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch PRP specialists:', error);
          return [];
        }
      })()
    );

    // Execute background queries in parallel
    const [additionalVendors, salonOwners, prpSpecialists] = await Promise.all(backgroundDataPromises);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ [BACKGROUND] Secondary data loaded in ${executionTime}ms`);

    res.json({
      success: true,
      data: {
        additionalVendors: additionalVendors,
        salonOwners: salonOwners,
        prpSpecialists: prpSpecialists
      },
      metadata: {
        execution_time_ms: executionTime,
        type: 'background',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [BACKGROUND] Failed to fetch background data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch background data'
    });
  }
});

/**
 * ⚡ LAZY: Gallery Images (loads only when needed/requested)
 * GET /api/combined/booking-home/gallery
 */
router.get('/booking-home/gallery', async (req, res) => {
  try {
    console.log('🖼️ [LAZY] Fetching gallery images on demand...');
    const startTime = Date.now();
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const result = await query(`
      SELECT vendor_id, image_url, image_description
      FROM vendor_gallery_images 
      WHERE image_url IS NOT NULL
      ORDER BY id 
      LIMIT $1
    `, [limit]);

    const endTime = Date.now();
    
    console.log(`✅ [LAZY] Gallery images loaded in ${endTime - startTime}ms`);

    res.json({
      success: true,
      data: {
        galleryImages: result.rows || []
      },
      metadata: {
        execution_time_ms: endTime - startTime,
        type: 'lazy',
        count: result.rows?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [LAZY] Failed to fetch gallery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery images'
    });
  }
});

/**
 * ⚡ OPTIMIZED: Combined Booking Home Data Endpoint
 * Fetches ALL data needed for booking-home screen in ONE request
 * GET /api/combined/booking-home
 */
router.get('/booking-home', async (req, res) => {
  try {
    console.log('🚀 [BOOKING-HOME] Fetching combined booking home data...');
    const startTime = Date.now();

    // Parallel data fetching for ALL booking-home requirements
    const dataFetchPromises = [];

    // 1. Essential Vendor Profiles (10 only)
    dataFetchPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              r.sr_no, 
              r.business_email, 
              r.person_name, 
              r.business_type, 
              r.business_name, 
              r.phone_number, 
              CASE 
                WHEN LENGTH(r.profile_picture) > 10 THEN r.profile_picture 
                ELSE NULL 
              END as profile_picture,
              r.business_address, 
              r.business_description, 
              r.provider_type_single_or_multi, 
              COALESCE(rs.selected_categories::text, r.selected_category) as selected_category,
              r.vendor_status, 
              r.verification_status
            FROM registration_and_other_details r
            LEFT JOIN ready_services_vendors_data rs ON r.sr_no = rs.vendor_id
            WHERE r.vendor_status = $1 
            AND r.verification_status = ANY($2)
            ORDER BY r.sr_no LIMIT 10
          `, ['active', ['verified', 'approved']]);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch vendor profiles:', error);
          return [];
        }
      })()
    );

    // 2. Service Icons (10 only)
    dataFetchPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT id, icon_title, icon, icon_description
            FROM our_services_icons
            LIMIT 10
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch service icons:', error);
          return [];
        }
      })()
    );

    // 3. Popular Salon Owners (5 only)
    dataFetchPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              sr_no, business_email, person_name, business_type, 
              business_name, phone_number, profile_picture
            FROM registration_and_other_details 
            WHERE business_type = 'salon' 
            AND verification_status = 'verified' 
            AND vendor_status = 'active'
            ORDER BY sr_no 
            LIMIT 5
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch salon owners:', error);
          return [];
        }
      })()
    );

    // 4. PRP Specialists (5 only)
    dataFetchPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT 
              sr_no, business_email, person_name, business_type, 
              business_name, phone_number, profile_picture
            FROM registration_and_other_details 
            WHERE business_type = 'prp' 
            AND verification_status = 'verified' 
            AND vendor_status = 'active'
            ORDER BY sr_no 
            LIMIT 5
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch PRP specialists:', error);
          return [];
        }
      })()
    );

    // 5. Essential Gallery Images (10 only, not 87!)
    dataFetchPromises.push(
      (async () => {
        try {
          const result = await query(`
            SELECT vendor_id, image_url, image_description
            FROM vendor_gallery_images 
            WHERE image_url IS NOT NULL
            ORDER BY id 
            LIMIT 10
          `);
          return result.rows || [];
        } catch (error) {
          console.warn('Failed to fetch gallery images:', error);
          return [];
        }
      })()
    );

    // Execute all queries in parallel
    const [
      vendorProfiles,
      serviceIcons, 
      salonOwners,
      prpSpecialists,
      galleryImages
    ] = await Promise.all(dataFetchPromises);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ [BOOKING-HOME] Combined data fetch completed in ${executionTime}ms`);
    console.log(`📊 [BOOKING-HOME] Data summary: ${vendorProfiles.length} vendors, ${serviceIcons.length} icons, ${salonOwners.length} salons, ${prpSpecialists.length} PRP, ${galleryImages.length} images`);

    // Return ALL booking-home data in one response
    res.json({
      success: true,
      data: {
        vendorProfiles: vendorProfiles,
        serviceIcons: serviceIcons,
        salonOwners: salonOwners,
        prpSpecialists: prpSpecialists,
        galleryImages: galleryImages
      },
      metadata: {
        execution_time_ms: executionTime,
        data_counts: {
          vendors: vendorProfiles.length,
          icons: serviceIcons.length,
          salons: salonOwners.length,
          prp: prpSpecialists.length,
          images: galleryImages.length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [BOOKING-HOME] Failed to fetch combined data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking home data',
      message: error.message
    });
  }
});

module.exports = router;