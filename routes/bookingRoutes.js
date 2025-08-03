const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/bookings/all-details - Fetch all booking details from booking_all_details_of_user_to_vendor table
router.get('/all-details', async (req, res) => {
  try {
    console.log('Fetching all booking details from booking_all_details_of_user_to_vendor table...');
    
    const result = await query(`
      SELECT 
        id,
        vendor_id,
        vendor_name,
        user_id,
        user_name,
        services_booked,
        total_amount,
        discount_amount,
        final_amount,
        booking_date,
        booking_time,
        booking_status,
        payment_status,
        payment_method,
        booking_notes,
        booking_reference,
        created_at,
        updated_at,
        vendor_business_type,
        vendor_email,
        user_email,
        user_phone,
        user_address,
        service_type,
        service_category,
        service_gender,
        original_price,
        booking_source,
        booking_id,
        user_city,
        user_device_id,
        vendor_phone_number,
        vendor_address,
        vendor_type,
        session_count,
        sessions_completed,
        payment_gateway,
        payment_currency,
        status
      FROM booking_all_details_of_user_to_vendor 
      ORDER BY created_at DESC
    `);
    
    console.log(`Successfully fetched ${result.rows.length} booking records`);
    
    // Transform the data to match frontend expectations
    const transformedData = result.rows.map(booking => ({
      id: booking.id,
      user_id: booking.user_id,
      vendor_id: booking.vendor_id,
      booking_id: booking.booking_id,
      service_id: booking.vendor_id, // Using vendor_id as service_id for compatibility
      booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : null,
      booking_time: booking.booking_time,
      status: booking.booking_status || booking.status || 'pending',
      payment_status: booking.payment_status || 'pending',
      service_name: Array.isArray(booking.services_booked) && booking.services_booked.length > 0 
        ? booking.services_booked[0].name 
        : 'Service not specified',
      service_type: booking.service_type || (
        Array.isArray(booking.services_booked) && booking.services_booked.length > 0 
          ? booking.services_booked[0].category 
          : 'General'
      ),
      service_category: booking.service_category || 'General Services',
      price: `₹${booking.final_amount || booking.total_amount || '0'}`,
      duration: Array.isArray(booking.services_booked) && booking.services_booked.length > 0 
        ? booking.services_booked[0].duration || 60
        : 60,
      user_name: booking.user_name || 'Unknown User',
      user_contact: booking.user_phone || booking.user_email || 'Not provided',
      vendor_name: booking.vendor_name || 'Unknown Vendor',
      vendor_contact: booking.vendor_phone_number || booking.vendor_email || 'Not provided',
      address: booking.user_address || booking.vendor_address || 'Address not provided',
      special_requests: booking.booking_notes || null,
      notes: Array.isArray(booking.services_booked) && booking.services_booked.length > 0 
        ? booking.services_booked[0].description 
        : null,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      // Additional fields
      booking_reference: booking.booking_reference,
      payment_method: booking.payment_method,
      booking_source: booking.booking_source,
      vendor_business_type: booking.vendor_business_type,
      service_gender: booking.service_gender,
      original_price: booking.original_price,
      discount_amount: booking.discount_amount,
      session_count: booking.session_count,
      sessions_completed: booking.sessions_completed,
      payment_gateway: booking.payment_gateway,
      payment_currency: booking.payment_currency
    }));
    
    res.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      message: `Successfully fetched ${transformedData.length} booking records`
    });
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      message: error.message
    });
  }
});

// GET /api/bookings/booking_all_details_of_user_to_vendor - Alternative endpoint
router.get('/booking_all_details_of_user_to_vendor', async (req, res) => {
  try {
    console.log('Fetching data from booking_all_details_of_user_to_vendor table (alternative endpoint)...');
    
    const result = await query(`
      SELECT * FROM booking_all_details_of_user_to_vendor 
      ORDER BY created_at DESC
    `);
    
    console.log(`Successfully fetched ${result.rows.length} booking records`);
    
    res.json({
      success: true,
      bookings: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      message: error.message
    });
  }
});

// GET /api/bookings/:id - Get specific booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching booking details for ID: ${id}`);
    
    const result = await query(`
      SELECT * FROM booking_all_details_of_user_to_vendor 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: `No booking found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details',
      message: error.message
    });
  }
});

// GET /api/bookings/stats/summary - Get booking statistics
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('Fetching booking statistics...');
    
    const totalBookingsResult = await query(`
      SELECT COUNT(*) as total_bookings FROM booking_all_details_of_user_to_vendor
    `);
    
    const statusStatsResult = await query(`
      SELECT 
        COALESCE(booking_status, status, 'unknown') as status,
        COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor
      GROUP BY COALESCE(booking_status, status, 'unknown')
      ORDER BY count DESC
    `);
    
    const paymentStatsResult = await query(`
      SELECT 
        payment_status,
        COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor
      GROUP BY payment_status
      ORDER BY count DESC
    `);
    
    const recentBookingsResult = await query(`
      SELECT COUNT(*) as recent_bookings
      FROM booking_all_details_of_user_to_vendor
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    res.json({
      success: true,
      stats: {
        total_bookings: parseInt(totalBookingsResult.rows[0].total_bookings),
        recent_bookings: parseInt(recentBookingsResult.rows[0].recent_bookings),
        status_breakdown: statusStatsResult.rows,
        payment_breakdown: paymentStatsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking statistics',
      message: error.message
    });
  }
});

// POST /api/bookings/:id/refund - Process refund for a specific booking
router.post('/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_id, refund_reason, refund_amount } = req.body;
    
    console.log(`Processing refund for booking ID: ${id}`);
    
    // First, check if the booking exists and can be refunded
    const bookingResult = await query(`
      SELECT 
        id, booking_id, user_name, vendor_name, service_name, 
        final_amount, payment_status, booking_status, status,
        created_at, updated_at
      FROM booking_all_details_of_user_to_vendor 
      WHERE id = $1
    `, [id]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: `No booking found with ID: ${id}`
      });
    }
    
    const booking = bookingResult.rows[0];
    
    // Check if refund is allowed
    const currentPaymentStatus = booking.payment_status?.toLowerCase() || '';
    const currentBookingStatus = (booking.booking_status || booking.status || '').toLowerCase();
    
    if (currentPaymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Refund not allowed',
        message: `Cannot refund booking with payment status: ${currentPaymentStatus}. Only paid bookings can be refunded.`
      });
    }
    
    if (['cancelled', 'refunded', 'denied'].includes(currentBookingStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Refund not allowed',
        message: `Cannot refund booking with status: ${currentBookingStatus}`
      });
    }
    
    if (['refunded', 'refund_pending'].includes(currentPaymentStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Already refunded',
        message: 'This booking has already been refunded or is pending refund'
      });
    }
    
    // Process the refund - Update booking status
    const updateResult = await query(`
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        payment_status = 'refunded',
        booking_status = 'cancelled',
        status = 'cancelled',
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [refund_reason, id]);
    
    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update booking status');
    }
    
    const updatedBooking = updateResult.rows[0];
    
    // Log the refund transaction (you might want to create a separate refunds table)
    console.log(`Refund processed successfully for booking ${booking_id}:`, {
      booking_id: booking_id,
      user_name: booking.user_name,
      vendor_name: booking.vendor_name,
      service_name: booking.service_name,
      refund_amount: refund_amount,
      refund_reason: refund_reason,
      processed_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        booking_id: booking_id,
        refund_amount: refund_amount,
        refund_reason: refund_reason,
        previous_status: {
          payment_status: booking.payment_status,
          booking_status: booking.booking_status || booking.status
        },
        updated_status: {
          payment_status: 'refunded',
          booking_status: 'cancelled'
        },
        processed_at: new Date().toISOString(),
        updated_booking: updatedBooking
      }
    });
    
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

// GET /api/bookings/:id/refund-status - Check if booking can be refunded
router.get('/:id/refund-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id, booking_id, payment_status, booking_status, status, final_amount
      FROM booking_all_details_of_user_to_vendor 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = result.rows[0];
    const paymentStatus = booking.payment_status?.toLowerCase() || '';
    const bookingStatus = (booking.booking_status || booking.status || '').toLowerCase();
    
    const canRefund = paymentStatus === 'paid' && 
                     !['cancelled', 'refunded', 'denied'].includes(bookingStatus) &&
                     !['refunded', 'refund_pending'].includes(paymentStatus);
    
    res.json({
      success: true,
      can_refund: canRefund,
      booking_id: booking.booking_id,
      current_payment_status: booking.payment_status,
      current_booking_status: booking.booking_status || booking.status,
      refund_amount: booking.final_amount,
      reason: canRefund ? 'Booking is eligible for refund' : 
              `Cannot refund: Payment status is '${paymentStatus}' and booking status is '${bookingStatus}'`
    });
    
  } catch (error) {
    console.error('Error checking refund status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check refund status',
      message: error.message
    });
  }
});

module.exports = router;