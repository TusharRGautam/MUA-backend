const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Try to import vendor notification service, but don't fail if it's not available
let sendVendorNotification = null;
let sendRescheduleNotification = null;
try {
  const vendorNotificationService = require('../services/vendorNotificationService');
  sendVendorNotification = vendorNotificationService.sendVendorNotification;
  sendRescheduleNotification = vendorNotificationService.sendRescheduleNotification;
} catch (error) {
  console.warn('⚠️ Vendor notification service not available:', error.message);
  console.warn('Reschedule notifications will be disabled');
}

/**
 * @route PUT /api/bookings/:bookingId/reschedule
 * @desc Reschedule a booking with new date and time
 * @access Public
 */
router.put('/:bookingId/reschedule', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, newTime, reason, userId } = req.body;
    
    console.log(`📅 Rescheduling booking ${bookingId} to ${newDate} at ${newTime}`);
    
    // Validate required fields
    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        error: 'New date and time are required for rescheduling'
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date must be in YYYY-MM-DD format'
      });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(newTime)) {
      return res.status(400).json({
        success: false,
        error: 'Time must be in HH:MM format'
      });
    }
    
    // Check if booking exists and get current details
    const checkBookingQuery = `
      SELECT 
        booking_id,
        user_name as customer_name,
        vendor_id,
        vendor_name,
        vendor_email,
        vendor_phone_number,
        booking_date,
        booking_time,
        booking_status,
        service_type as service_name,
        total_amount,
        reschedule_count
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1
    `;
    
    const bookingResult = await query(checkBookingQuery, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = bookingResult.rows[0];
    
    // Check if booking can be rescheduled (not completed or cancelled)
    if (['completed', 'cancelled', 'denied'].includes(booking.booking_status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot reschedule ${booking.booking_status} booking`
      });
    }
    
    // Update booking with reschedule information and change status to 'rescheduled'
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        vendor_reschedule_date = $1,
        vendor_reschedule_time = $2,
        reschedule_reason = $3,
        reschedule_count = COALESCE(reschedule_count, 0) + 1,
        booking_status = 'rescheduled',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $4
      RETURNING 
        booking_id,
        user_name as customer_name,
        vendor_id,
        vendor_name,
        service_type as service_name,
        booking_date as original_date,
        booking_time as original_time,
        vendor_reschedule_date as new_date,
        vendor_reschedule_time as new_time,
        reschedule_count,
        reschedule_reason,
        booking_status
    `;
    
    const updateResult = await query(updateQuery, [newDate, newTime, reason || 'Customer requested reschedule', bookingId]);
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking'
      });
    }
    
    const updatedBooking = updateResult.rows[0];
    
    console.log('✅ Booking rescheduled successfully:', {
      bookingId: updatedBooking.booking_id,
      customer: updatedBooking.customer_name,
      originalDate: booking.booking_date,
      originalTime: booking.booking_time,
      newDate: updatedBooking.new_date,
      newTime: updatedBooking.new_time,
      rescheduleCount: updatedBooking.reschedule_count
    });
    
    // Send push notification to vendor using the new reschedule notification service
    try {
      if (booking.vendor_id && sendRescheduleNotification) {
        const rescheduleData = {
          bookingId: updatedBooking.booking_id,
          customer: updatedBooking.customer_name,
          originalDate: booking.booking_date,
          originalTime: booking.booking_time,
          newDate: updatedBooking.new_date,
          newTime: updatedBooking.new_time,
          rescheduleCount: updatedBooking.reschedule_count,
          rescheduleReason: updatedBooking.reschedule_reason
        };
        
        const notificationSent = await sendRescheduleNotification(booking.vendor_id, rescheduleData);
        
        if (notificationSent) {
          console.log('✅ Reschedule notification sent to vendor successfully');
        } else {
          console.log('⚠️ Failed to send reschedule notification to vendor');
        }
      } else {
        console.log('⚠️ Vendor notification service not available');
      }
    } catch (notificationError) {
      console.error('❌ Failed to send reschedule notification:', notificationError);
      // Don't fail the entire request if notification fails
    }
    
    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: {
        bookingId: updatedBooking.booking_id,
        customerName: updatedBooking.customer_name,
        vendorName: updatedBooking.vendor_name,
        serviceName: updatedBooking.service_name,
        originalDate: booking.booking_date,
        originalTime: booking.booking_time,
        newDate: updatedBooking.new_date,
        newTime: updatedBooking.new_time,
        reason: updatedBooking.reschedule_reason,
        rescheduleCount: updatedBooking.reschedule_count
      }
    });
    
  } catch (error) {
    console.error('❌ Error rescheduling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule booking',
      details: error.message
    });
  }
});

/**
 * @route GET /api/bookings/:bookingId/reschedule-history
 * @desc Get reschedule history for a booking
 * @access Public
 */
router.get('/:bookingId/reschedule-history', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const historyQuery = `
      SELECT 
        booking_id,
        booking_date as original_date,
        booking_time as original_time,
        vendor_reschedule_date as current_rescheduled_date,
        vendor_reschedule_time as current_rescheduled_time,
        reschedule_count,
        reschedule_reason,
        updated_at as last_reschedule_date
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1
    `;
    
    const result = await query(historyQuery, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      rescheduleHistory: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching reschedule history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reschedule history',
      details: error.message
    });
  }
});

module.exports = router; 