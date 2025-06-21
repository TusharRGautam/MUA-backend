/**
 * Vendor Booking Routes
 * Handles syncing booking data from booking_all_details_of_user_to_vendor to vendor dashboard
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { 
  sendBookingStatusNotification, 
  getVendorNotifications, 
  markNotificationAsRead 
} = require('../services/vendorNotificationService');

/**
 * @route GET /api/vendor/bookings/sync
 * @desc Sync bookings from booking_all_details_of_user_to_vendor to vendor_bookings
 * @access Public (for now)
 */
router.get('/sync', async (req, res) => {
  try {
    console.log('🔄 Starting booking sync process...');
    
    // Get all bookings from booking_all_details_of_user_to_vendor
    const getAllBookingsQuery = `
      SELECT 
        id,
        booking_id,
        vendor_id,
        user_name,
        user_email,
        user_phone,
        user_address,
        vendor_name,
        services_booked,
        total_amount,
        final_amount,
        booking_date,
        booking_time,
        payment_method,
        service_category,
        booking_status as status,
        created_at,
        updated_at
      FROM booking_all_details_of_user_to_vendor
      WHERE vendor_id IS NOT NULL
      ORDER BY created_at DESC
    `;
    
    const allBookings = await query(getAllBookingsQuery);
    
    console.log(`📊 Found ${allBookings.rows.length} bookings to process`);
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    // Process each booking
    for (const booking of allBookings.rows) {
      try {
        // Check if booking already exists in vendor_bookings
        const existingBookingQuery = `
          SELECT id FROM vendor_bookings 
          WHERE vendor_id = $1 AND (
            booking_reference = $2 OR 
            (customer_name = $3 AND date_time::date = $4)
          )
        `;
        
        const bookingDate = booking.booking_date || booking.created_at;
        const bookingTime = booking.booking_time || '10:00';
        
        // Combine date and time for datetime field
        let dateTime;
        if (booking.booking_date && booking.booking_time) {
          dateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        } else {
          dateTime = new Date(booking.created_at);
        }
        
        const existingBooking = await query(existingBookingQuery, [
          booking.vendor_id,
          booking.booking_id,
          booking.user_name,
          bookingDate
        ]);
        
        if (existingBooking.rows.length === 0) {
          // Create new booking in vendor_bookings
          const insertQuery = `
            INSERT INTO vendor_bookings (
              vendor_id,
              customer_name,
              service_name,
              service_type,
              date_time,
              booking_status,
              payment_status,
              contact_number,
              address,
              notes,
              booking_reference,
              service_amount,
              total_amount,
              payment_method,
              is_new,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `;
          
          // Extract service info from services_booked JSON
          let serviceName = 'Service';
          let serviceType = 'beauty';
          
          if (booking.services_booked) {
            try {
              const services = JSON.parse(booking.services_booked);
              if (services && services.length > 0) {
                serviceName = services[0].name || 'Service';
                serviceType = services[0].category || 'beauty';
              }
            } catch (parseError) {
              console.log('Failed to parse services_booked JSON:', parseError);
            }
          }
          
          const paymentStatus = booking.payment_method ? 'paid' : 'pending';
          const bookingStatus = booking.status || 'pending';
          
          await query(insertQuery, [
            booking.vendor_id,
            booking.user_name || 'Customer',
            serviceName,
            serviceType,
            dateTime,
            bookingStatus,
            paymentStatus,
            booking.user_phone || '',
            booking.user_address || '',
            `Booking from ${booking.user_name || 'customer'} - Amount: ₹${booking.total_amount || 0}`,
            booking.booking_id,
            booking.total_amount || 0,
            booking.final_amount || booking.total_amount || 0,
            booking.payment_method || 'cash',
            true, // is_new
            booking.created_at,
            booking.updated_at
          ]);
          
          syncedCount++;
          console.log(`✅ Synced booking ${booking.booking_id} for vendor ${booking.vendor_id}`);
          
        } else {
          // Update existing booking if needed
          const updateQuery = `
            UPDATE vendor_bookings 
            SET 
              booking_status = $1,
              total_amount = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
          
          const existingId = existingBooking.rows[0].id;
          await query(updateQuery, [
            booking.status || 'pending',
            booking.total_amount || 0,
            existingId
          ]);
          
          updatedCount++;
          console.log(`🔄 Updated booking ${booking.booking_id}`);
        }
        
      } catch (bookingError) {
        console.error(`❌ Error processing booking ${booking.booking_id}:`, bookingError);
      }
    }
    
    console.log(`✅ Sync completed: ${syncedCount} new, ${updatedCount} updated`);
    
    res.json({
      success: true,
      message: 'Booking sync completed successfully',
      stats: {
        totalProcessed: allBookings.rows.length,
        newBookings: syncedCount,
        updatedBookings: updatedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error in booking sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync bookings',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/bookings/:vendorId
 * @desc Get all bookings for a specific vendor
 * @access Public
 */
router.get('/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    console.log(`📊 Fetching bookings for vendor ${vendorId}`);
    
    let bookingsQuery = `
      SELECT 
        booking_id as id,
        user_name as customer_name,
        services_booked as service_name,
        service_type,
        CONCAT(booking_date, ' ', booking_time) as date_time,
        booking_status,
        payment_status,
        user_phone as contact_number,
        user_address as address,
        booking_notes as notes,
        booking_reference,
        total_amount as service_amount,
        total_amount,
        payment_method,
        CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN true ELSE false END as is_new,
        created_at,
        updated_at
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = $1
    `;
    
    const queryParams = [vendorId];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      paramIndex++;
      bookingsQuery += ` AND booking_status = $${paramIndex}`;
      queryParams.push(status);
    }
    
    bookingsQuery += ` ORDER BY created_at DESC`;
    
    if (limit) {
      paramIndex++;
      bookingsQuery += ` LIMIT $${paramIndex}`;
      queryParams.push(parseInt(limit));
    }
    
    if (offset) {
      paramIndex++;
      bookingsQuery += ` OFFSET $${paramIndex}`;
      queryParams.push(parseInt(offset));
    }
    
    const result = await query(bookingsQuery, queryParams);
    
        // Get booking counts by status
    const countsQuery = `
      SELECT 
        booking_status,
        COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = $1
      GROUP BY booking_status
    `;

    const countsResult = await query(countsQuery, [vendorId]);
    const statusCounts = {};
    countsResult.rows.forEach(row => {
      statusCounts[row.booking_status] = parseInt(row.count);
    });

    // Count new bookings (created in last hour)
    const newBookingsQuery = `
      SELECT COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
    `;

    const newBookingsResult = await query(newBookingsQuery, [vendorId]);
    const newBookingsCount = parseInt(newBookingsResult.rows[0].count);
    
    res.json({
      success: true,
      bookings: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      },
      stats: {
        statusCounts,
        newBookings: newBookingsCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching vendor bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/bookings/:bookingId/status
 * @desc Update booking status and send notification
 * @access Public
 */
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, vendorId } = req.body;
    
    console.log(`🔄 Updating booking ${bookingId} status to ${status}`);
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'denied', 'started', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Valid options: ' + validStatuses.join(', ')
      });
    }
    
    // Update booking status
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        booking_status = $1
      WHERE booking_id = $2
      RETURNING booking_id as id, user_name as customer_name, vendor_id
    `;
    
    const result = await query(updateQuery, [status, bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = result.rows[0];
    
    // Send status notification to vendor
    try {
      const finalVendorId = vendorId || booking.vendor_id;
      await sendBookingStatusNotification(
        finalVendorId, 
        bookingId, 
        status, 
        booking.customer_name
      );
      console.log(`📱 Status notification sent to vendor ${finalVendorId}`);
    } catch (notificationError) {
      console.error('❌ Failed to send status notification:', notificationError);
    }
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: booking
    });
    
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      details: error.message
    });
  }
});

/**
 * @route POST /api/vendor/bookings/accept
 * @desc Accept a booking by updating its status
 * @access Public
 */
router.post('/accept', async (req, res) => {
  try {
    const { bookingId, vendorId } = req.body;
    
    console.log(`✅ Accepting booking ${bookingId} for vendor ${vendorId}`);
    
    if (!bookingId || !vendorId) {
      return res.status(400).json({
        success: false,
        error: 'BookingId and vendorId are required'
      });
    }
    
    // Update booking status to accepted
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        booking_status = 'accepted'
      WHERE booking_id = $1 AND vendor_id = $2
      RETURNING booking_id as id, user_name as customer_name, vendor_id, service_name
    `;
    
    const result = await query(updateQuery, [bookingId, vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or you are not authorized to accept this booking'
      });
    }
    
    const booking = result.rows[0];
    
    console.log(`✅ Booking ${bookingId} accepted successfully for ${booking.customer_name}`);
    
    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking: booking
    });
    
  } catch (error) {
    console.error('❌ Error accepting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept booking',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/notifications/:vendorId
 * @desc Get vendor notifications
 * @access Public
 */
router.get('/notifications/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 20 } = req.query;
    
    console.log(`📱 Fetching notifications for vendor ${vendorId}`);
    
    const notifications = await getVendorNotifications(vendorId, parseInt(limit));
    
    res.json({
      success: true,
      notifications
    });
    
  } catch (error) {
    console.error('❌ Error fetching vendor notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Public
 */
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { vendorId } = req.body;
    
    const success = await markNotificationAsRead(notificationId, vendorId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      details: error.message
    });
  }
});

/**
 * @route POST /api/vendor/bookings/accept
 * @desc Accept a booking
 * @access Public
 */
router.post('/accept', async (req, res) => {
  try {
    const { bookingId, vendorId } = req.body;
    
    if (!bookingId || !vendorId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId and vendorId are required'
      });
    }
    
    console.log(`✅ Vendor ${vendorId} accepting booking ${bookingId}`);
    
    // Update booking status to accepted
    const updateQuery = `
      UPDATE vendor_bookings 
      SET 
        booking_status = 'accepted', 
        is_new = false, 
        updated_at = CURRENT_TIMESTAMP
      WHERE (id = $1 OR booking_reference = $1) AND vendor_id = $2
      RETURNING id, customer_name, service_name, total_amount, date_time
    `;
    
    const result = await query(updateQuery, [bookingId, vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    const booking = result.rows[0];
    
    // Send acceptance notification
    try {
      await sendBookingStatusNotification(
        vendorId, 
        bookingId, 
        'accepted', 
        booking.customer_name
      );
    } catch (notificationError) {
      console.error('❌ Failed to send acceptance notification:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking: {
        id: booking.id,
        customerName: booking.customer_name,
        serviceName: booking.service_name,
        amount: booking.total_amount,
        dateTime: booking.date_time,
        status: 'accepted'
      }
    });
    
  } catch (error) {
    console.error('❌ Error accepting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept booking',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/lookup-by-email
 * @desc Get vendor ID by email
 * @access Public
 */
router.get('/lookup-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    console.log(`🔍 Looking up vendor ID for email: ${email}`);
    
    // Look up vendor in registration_and_other_details table
    const vendorQuery = `
      SELECT sr_no as vendor_id, email, business_name 
      FROM registration_and_other_details 
      WHERE email = $1
    `;
    
    const result = await query(vendorQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with this email'
      });
    }
    
    const vendor = result.rows[0];
    
    console.log(`✅ Found vendor ID ${vendor.vendor_id} for email ${email}`);
    
    res.json({
      success: true,
      vendorId: vendor.vendor_id,
      email: vendor.email,
      businessName: vendor.business_name
    });
    
  } catch (error) {
    console.error('❌ Error looking up vendor by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup vendor',
      details: error.message
    });
  }
});

module.exports = router; 