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

module.exports = router;