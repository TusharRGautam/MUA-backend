const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const { 
  apiCache, 
  userCache, 
  cacheQuery, 
  generateCacheKey, 
  invalidateCache 
} = require('../middleware/cache');

// Use the same database connection as the main server
const { pool, query } = require('../db');

/**
 * @route GET /api/bookings-optimized
 * @desc Get paginated user bookings with caching
 * @access Private
 */
router.get('/', authMiddleware, userCache, async (req, res) => {
  try {
    const user = req.user;
    const { 
      page = 1, 
      limit = 10, 
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    const offset = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'booking_date', 'total_amount', 'booking_status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build cache key
    const cacheKey = generateCacheKey(
      'user_bookings', 
      user.id, 
      user.role, 
      pageNum, 
      limitNum, 
      status, 
      sortField, 
      sortDirection
    );

    const fetchBookings = async () => {
      let whereClause = '';
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE clause based on user role
      if (user.role === 'customer') {
        whereClause = `WHERE (user_id = $${paramIndex} OR user_email = $${paramIndex + 1} OR user_phone = $${paramIndex + 2} OR custom_user_id = $${paramIndex + 3})`;
        queryParams = [user.id, user.email, user.phone_number, user.custom_user_id];
        paramIndex += 4;
      } else if (user.role === 'business_owner' || user.role === 'vendor') {
        whereClause = `WHERE (vendor_id = $${paramIndex} OR vendor_email = $${paramIndex + 1} OR vendor_phone_number = $${paramIndex + 2})`;
        queryParams = [user.id, user.email, user.phone_number];
        paramIndex += 3;
      } else {
        return { bookings: [], total: 0, totalPages: 0 };
      }

      // Add status filter
      if (status !== 'all') {
        whereClause += ` AND COALESCE(booking_status, 'pending') = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }

      // First, get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM booking_all_details_of_user_to_vendor 
        ${whereClause}
      `;

      const countResult = await query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limitNum);

      // Then get the actual data
      const selectQuery = `
        SELECT 
          id,
          booking_id,
          user_name,
          user_email,
          user_phone,
          vendor_name,
          vendor_email,
          services_booked,
          total_amount,
          final_amount,
          booking_date,
          booking_time,
          COALESCE(booking_status, 'pending') as booking_status,
          payment_status,
          payment_method,
          created_at,
          updated_at,
          user_address,
          service_category,
          service_gender
        FROM booking_all_details_of_user_to_vendor 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limitNum, offset);
      const bookingsResult = await query(selectQuery, queryParams);

      return {
        bookings: bookingsResult.rows,
        total: totalCount,
        totalPages,
        currentPage: pageNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      };
    };

    // Use cached query with 2-minute TTL for user-specific data
    const result = await cacheQuery(cacheKey, fetchBookings, 120);

    res.json({
      success: true,
      data: result.bookings,
      pagination: {
        page: result.currentPage,
        limit: limitNum,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      },
      meta: {
        sortBy: sortField,
        sortOrder: sortDirection,
        status,
        cached: true
      }
    });

  } catch (error) {
    console.error('Error fetching optimized user bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user bookings',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/bookings-optimized/:bookingId
 * @desc Get specific booking details with caching
 * @access Public
 */
router.get('/:bookingId', apiCache, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const cacheKey = generateCacheKey('booking_details', bookingId);

    const fetchBookingDetails = async () => {
      const selectQuery = `
        SELECT 
          *,
          COALESCE(booking_status, 'pending') as booking_status
        FROM booking_all_details_of_user_to_vendor 
        WHERE booking_id = $1 OR id::text = $1
        LIMIT 1
      `;

      const result = await query(selectQuery, [bookingId]);
      
      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }

      return result.rows[0];
    };

    const booking = await cacheQuery(cacheKey, fetchBookingDetails, 300); // 5-minute cache

    res.json({
      success: true,
      data: booking,
      cached: true
    });

  } catch (error) {
    console.error('Error fetching booking details:', error);
    
    if (error.message === 'Booking not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found',
        bookingId: req.params.bookingId
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch booking details',
      message: error.message 
    });
  }
});

/**
 * @route PUT /api/bookings-optimized/:bookingId/status
 * @desc Update booking status (with cache invalidation)
 * @access Public
 */
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid status is required',
        validStatuses 
      });
    }

    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        booking_status = $1, 
        vendor_notes = COALESCE($2, vendor_notes),
        updated_at = CURRENT_TIMESTAMP 
      WHERE booking_id = $3 OR id::text = $3
      RETURNING id, booking_id, booking_status, user_id, vendor_id
    `;

    const result = await query(updateQuery, [status, notes || null, bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found',
        bookingId 
      });
    }

    const updatedBooking = result.rows[0];

    // Invalidate relevant caches
    invalidateCache.booking(bookingId);
    if (updatedBooking.user_id) {
      invalidateCache.user(updatedBooking.user_id);
    }
    if (updatedBooking.vendor_id) {
      invalidateCache.vendor(updatedBooking.vendor_id);
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        bookingId: updatedBooking.booking_id,
        newStatus: status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update booking status',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/bookings-optimized/analytics/dashboard
 * @desc Get booking analytics for dashboard (cached for performance)
 * @access Private
 */
router.get('/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { period = '30d' } = req.query;

    // Parse period
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365
    };
    const days = periodDays[period] || 30;

    const cacheKey = generateCacheKey('booking_analytics', user.id, user.role, period);

    const fetchAnalytics = async () => {
      let whereClause = '';
      let queryParams = [days];
      
      if (user.role === 'customer') {
        whereClause = 'AND (user_id = $2 OR user_email = $3)';
        queryParams.push(user.id, user.email);
      } else if (user.role === 'business_owner' || user.role === 'vendor') {
        whereClause = 'AND (vendor_id = $2 OR vendor_email = $3)';
        queryParams.push(user.id, user.email);
      }

      // Parallel queries for different analytics
      const [statsResult, trendsResult, statusResult] = await Promise.all([
        // Basic stats
        query(`
          SELECT 
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
            COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending_bookings,
            COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_bookings,
            COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN total_amount END), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN booking_status = 'completed' THEN total_amount END), 0) as avg_booking_value
          FROM booking_all_details_of_user_to_vendor 
          WHERE created_at >= NOW() - INTERVAL '1 day' * $1 ${whereClause}
        `, queryParams),

        // Daily trends
        query(`
          SELECT 
            DATE(created_at) as booking_date,
            COUNT(*) as daily_bookings,
            COALESCE(SUM(total_amount), 0) as daily_revenue
          FROM booking_all_details_of_user_to_vendor 
          WHERE created_at >= NOW() - INTERVAL '1 day' * $1 ${whereClause}
          GROUP BY DATE(created_at)
          ORDER BY booking_date DESC
          LIMIT 30
        `, queryParams),

        // Status distribution
        query(`
          SELECT 
            COALESCE(booking_status, 'pending') as status,
            COUNT(*) as count,
            ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
          FROM booking_all_details_of_user_to_vendor 
          WHERE created_at >= NOW() - INTERVAL '1 day' * $1 ${whereClause}
          GROUP BY booking_status
        `, queryParams)
      ]);

      return {
        summary: statsResult.rows[0],
        trends: trendsResult.rows,
        statusDistribution: statusResult.rows,
        period: `${days} days`,
        generatedAt: new Date().toISOString()
      };
    };

    // Cache analytics for 10 minutes
    const analytics = await cacheQuery(cacheKey, fetchAnalytics, 600);

    res.json({
      success: true,
      data: analytics,
      cached: true
    });

  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch booking analytics',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/bookings-optimized/batch-update
 * @desc Batch update multiple bookings (with cache invalidation)
 * @access Private
 */
router.post('/batch-update', authMiddleware, async (req, res) => {
  try {
    const { bookingIds, updates } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'bookingIds array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'updates object is required'
      });
    }

    // Build dynamic update query
    const allowedFields = ['booking_status', 'vendor_notes', 'payment_status'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid update fields provided',
        allowedFields
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Create placeholder for bookingIds
    const placeholders = bookingIds.map((_, index) => `$${paramIndex + index}`).join(', ');
    const allParams = [...updateValues, ...bookingIds];

    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET ${updateFields.join(', ')}
      WHERE booking_id = ANY(ARRAY[${placeholders}])
      RETURNING booking_id, booking_status, user_id, vendor_id
    `;

    const result = await query(updateQuery, allParams);

    // Invalidate caches for affected bookings
    result.rows.forEach(row => {
      invalidateCache.booking(row.booking_id);
      if (row.user_id) invalidateCache.user(row.user_id);
      if (row.vendor_id) invalidateCache.vendor(row.vendor_id);
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.rows.length} bookings`,
      data: {
        updatedCount: result.rows.length,
        requestedCount: bookingIds.length,
        updatedBookings: result.rows.map(r => r.booking_id)
      }
    });

  } catch (error) {
    console.error('Error in batch update:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update bookings',
      message: error.message 
    });
  }
});

module.exports = router;