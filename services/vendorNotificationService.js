/**
 * Vendor Notification Service
 * Handles push notifications to vendors when new bookings are created
 */

const { query } = require('../db');
const axios = require('axios');

// Expo Push Notification API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// Use Expo Push Notifications instead of Firebase Admin SDK for better compatibility
let firebaseInitialized = false;

console.log('🚀 Initializing Vendor Notification Service with Expo Push Notifications');

/**
 * Get vendor's push token and details
 */
const getVendorPushToken = async (vendorId) => {
  try {
    const vendorQuery = `
      SELECT 
        sr_no,
        person_name,
        business_name,
        business_email,
        push_token,
        phone_number,
        vendor_status,
        verification_status
      FROM registration_and_other_details 
      WHERE sr_no = $1 
        AND vendor_status = 'active' 
        AND (verification_status = 'verified' OR verification_status = 'approved')
    `;
    
    const result = await query(vendorQuery, [vendorId]);
    
    if (result.rows.length === 0) {
      console.log(`No vendor found with ID: ${vendorId}`);
      return null;
    }
    
    const vendor = result.rows[0];
    console.log(`Found vendor: ${vendor.person_name} (${vendor.business_email})`);
    
    return vendor;
  } catch (error) {
    console.error('Error getting vendor push token:', error);
    return null;
  }
};

/**
 * Calculate vendor earnings from booking
 */
const calculateVendorEarnings = (totalAmount) => {
  // Assuming vendor gets 85% of the total amount (15% platform fee)
  const platformFeePercentage = 0.15;
  const vendorEarnings = totalAmount * (1 - platformFeePercentage);
  return Math.round(vendorEarnings * 100) / 100; // Round to 2 decimal places
};

/**
 * Send push notification using Expo Push API
 */
const sendExpoPushNotification = async (pushToken, notificationData) => {
  try {
    if (!pushToken) {
      console.log('⚠️ No push token provided, skipping notification');
      return false;
    }

    // Validate Expo push token format
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      console.log('⚠️ Invalid Expo push token format:', pushToken.substring(0, 20) + '...');
      return false;
    }

    const message = {
      to: pushToken,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      sound: 'default',
      priority: 'high',
      channelId: 'booking_updates',
    };

    console.log('📱 Sending Expo push notification:', {
      token: pushToken.substring(0, 30) + '...',
      title: notificationData.title,
      type: notificationData.data?.type
    });

    const response = await axios.post(EXPO_PUSH_API_URL, message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log('📱 Expo API Response:', JSON.stringify(response.data, null, 2));

    // Check if the response indicates success
    // The response structure is: { data: { status: 'ok', id: '...' } }
    if (response.data && response.data.data && response.data.data.status === 'ok') {
      console.log('✅ Expo push notification sent successfully! ID:', response.data.data.id);
      return true;
    } 
    // Check for batch responses (array format)
    else if (response.data && response.data.data && Array.isArray(response.data.data) &&
             response.data.data[0] && response.data.data[0].status === 'ok') {
      console.log('✅ Expo push notification sent successfully (batch)! ID:', response.data.data[0].id);
      return true;
    }
    // Check for direct response format (sometimes Expo returns direct format)
    else if (response.data && (response.data.status === 'ok' || response.data.id)) {
      console.log('✅ Expo push notification sent successfully (direct)! ID:', response.data.id);
      return true;
    } 
    // Handle error responses gracefully
    else if (response.data && response.data.data && response.data.data.status === 'error') {
      const errorDetails = response.data.data.details || {};
      if (errorDetails.error === 'DeviceNotRegistered') {
        console.log('⚠️ Device not registered for push notifications, but continuing...');
        return true; // Don't fail the booking process
      }
      console.error('❌ Expo push notification failed:', response.data);
      return false;
    } else {
      console.error('❌ Expo push notification failed:', response.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to send Expo push notification:', error.message);
    
    // Log specific error types
    if (error.response) {
      console.error('Response error:', error.response.data);
    }
    
    return false;
  }
};

/**
 * Send push notification to vendor
 */
const sendVendorNotification = async (pushToken, notificationData) => {
  try {
    if (!pushToken) {
      console.log('⚠️ No push token provided, skipping notification');
      return false;
    }

    // Use Expo Push Notifications
    return await sendExpoPushNotification(pushToken, notificationData);
    
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    return false;
  }
};

/**
 * Send booking notification to vendor
 */
const sendBookingNotification = async (vendorId, bookingData) => {
  try {
    console.log(`📱 Sending booking notification to vendor ${vendorId}`);
    
    // Get vendor details and push token
    const vendor = await getVendorPushToken(vendorId);
    if (!vendor || !vendor.push_token) {
      console.log(`No push token found for vendor ${vendorId}`);
      return {
        success: true, // Don't fail the booking process
        error: 'No push token registered for this vendor',
        skipped: true
      };
    }

    // Skip invalid test tokens to prevent API errors
    if (vendor.push_token.includes('test_token') || vendor.push_token.includes('TEST_TOKEN')) {
      console.log(`⚠️ Skipping test token for vendor ${vendorId}`);
      return {
        success: true, // Don't fail the booking process
        error: 'Test token detected, notification skipped',
        skipped: true
      };
    }

    // Calculate earnings
    const earnings = calculateVendorEarnings(bookingData.totalAmount || 0);
    
    // Create notification content
    const notificationData = {
      title: '🎉 New Booking Request!',
      body: `You have a new booking from ${bookingData.customerName}. Earnings: ₹${earnings}`,
      data: {
        type: 'new_booking',
        bookingId: bookingData.bookingId,
        vendorId: vendorId,
        customerName: bookingData.customerName,
        serviceName: bookingData.items?.[0]?.name || 'Service',
        totalAmount: bookingData.totalAmount,
        earnings: earnings,
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        timestamp: new Date().toISOString()
      }
    };

    // Send the notification
    const success = await sendVendorNotification(vendor.push_token, notificationData);
    
    if (success) {
      // Store notification in database for tracking
      await storeNotificationRecord(vendorId, bookingData.bookingId, notificationData);
      console.log(`✅ Booking notification sent to ${vendor.person_name}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error in sendBookingNotification:', error);
    return false;
  }
};

/**
 * Store notification record in database
 */
const storeNotificationRecord = async (vendorId, bookingId, notificationData, type = 'new_booking') => {
  try {
            const insertQuery = `
          INSERT INTO vendor_notifications (
            vendor_id,
            booking_id,
            notification_type,
            title,
            message,
            data,
            sent_at,
            delivery_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        
        await query(insertQuery, [
          vendorId,
          bookingId,
          type,
          notificationData.title,
          notificationData.body,
          JSON.stringify(notificationData.data),
          new Date(),
          'sent'
        ]);
    
    console.log('📝 Notification record stored');
  } catch (error) {
    // Create table if it doesn't exist
    await createNotificationTable();
    // Retry insertion
    try {
          const insertQuery = `
      INSERT INTO vendor_notifications (
        vendor_id,
        booking_id,
        notification_type,
        title,
        message,
        data,
        sent_at,
        delivery_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await query(insertQuery, [
      vendorId,
      bookingId,
      type,
      notificationData.title,
      notificationData.body,
      JSON.stringify(notificationData.data),
      new Date(),
      'sent'
    ]);
    } catch (retryError) {
      console.error('Error storing notification record:', retryError);
    }
  }
};

/**
 * Create vendor notifications table if it doesn't exist
 */
const createNotificationTable = async () => {
  try {
      const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vendor_notifications (
      id SERIAL PRIMARY KEY,
      vendor_id INTEGER NOT NULL,
      booking_id VARCHAR(255),
      notification_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivery_status VARCHAR(20) DEFAULT 'sent',
      read_at TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id 
    ON vendor_notifications(vendor_id);
    
    CREATE INDEX IF NOT EXISTS idx_vendor_notifications_booking_id 
    ON vendor_notifications(booking_id);
  `;
    
    await query(createTableQuery);
    console.log('✅ Vendor notifications table created/verified');
  } catch (error) {
    console.error('Error creating vendor notifications table:', error);
  }
};

/**
 * Send notification to multiple vendors (for package bookings)
 */
const sendMultiVendorBookingNotifications = async (vendorIds, bookingData) => {
  try {
    console.log(`📱 Sending notifications to ${vendorIds.length} vendors`);
    
    const notificationPromises = vendorIds.map(vendorId => 
      sendBookingNotification(vendorId, bookingData)
    );
    
    const results = await Promise.allSettled(notificationPromises);
    
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    console.log(`✅ Successfully sent ${successCount}/${vendorIds.length} notifications`);
    
    return successCount;
  } catch (error) {
    console.error('Error in sendMultiVendorBookingNotifications:', error);
    return 0;
  }
};

/**
 * Send booking status update notification to vendor
 */
const sendBookingStatusNotification = async (vendorId, bookingId, status, customerName) => {
  try {
    const vendor = await getVendorPushToken(vendorId);
    if (!vendor || !vendor.push_token) {
      return false;
    }

    let title = '';
    let body = '';

    switch (status) {
      case 'accepted':
        title = '✅ Booking Accepted';
        body = `Great! You accepted the booking from ${customerName}`;
        break;
      case 'completed':
        title = '🎉 Booking Completed';
        body = `Booking with ${customerName} has been completed successfully`;
        break;
      case 'cancelled':
        title = '❌ Booking Cancelled';
        body = `Booking with ${customerName} has been cancelled`;
        break;
      default:
        return false;
    }

    const notificationData = {
      title,
      body,
      data: {
        type: 'booking_status_update',
        bookingId,
        vendorId,
        status,
        customerName,
        timestamp: new Date().toISOString()
      }
    };

    return await sendVendorNotification(vendor.push_token, notificationData);
  } catch (error) {
    console.error('Error sending booking status notification:', error);
    return false;
  }
};

/**
 * Get vendor's unread notifications
 */
const getVendorNotifications = async (vendorId, limit = 20) => {
  try {
    // Ensure table exists before querying
    await createNotificationTable();
    
    const notificationsQuery = `
      SELECT * FROM vendor_notifications 
      WHERE vendor_id = $1 
      ORDER BY sent_at DESC 
      LIMIT $2
    `;
    
    const result = await query(notificationsQuery, [vendorId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting vendor notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId, vendorId) => {
  try {
    const updateQuery = `
      UPDATE vendor_notifications 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND vendor_id = $2
    `;
    
    await query(updateQuery, [notificationId, vendorId]);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Send booking reschedule notification to vendor
 */
const sendRescheduleNotification = async (vendorId, rescheduleData) => {
  try {
    console.log(`📅 Sending reschedule notification to vendor ${vendorId}`);
    
    // Get vendor details and push token
    const vendor = await getVendorPushToken(vendorId);
    if (!vendor || !vendor.push_token) {
      console.log(`No push token found for vendor ${vendorId}`);
      return false;
    }

    // Format dates for display
    const originalDate = new Date(rescheduleData.originalDate).toLocaleDateString();
    const newDate = new Date(rescheduleData.newDate).toLocaleDateString();
    
    // Create notification content
    const notificationData = {
      title: '📅 Booking Rescheduled',
      body: `${rescheduleData.customer} rescheduled from ${originalDate} to ${newDate}`,
      data: {
        type: 'booking_reschedule',
        bookingId: rescheduleData.bookingId,
        vendorId: vendorId,
        customerName: rescheduleData.customer,
        originalDate: rescheduleData.originalDate,
        originalTime: rescheduleData.originalTime,
        newDate: rescheduleData.newDate,
        newTime: rescheduleData.newTime,
        rescheduleCount: rescheduleData.rescheduleCount,
        rescheduleReason: rescheduleData.rescheduleReason || '',
        timestamp: new Date().toISOString()
      }
    };

    // Send the notification
    const success = await sendVendorNotification(vendor.push_token, notificationData);
    
    if (success) {
      // Store notification in database for tracking
      await storeNotificationRecord(vendorId, rescheduleData.bookingId, notificationData, 'reschedule');
      console.log(`✅ Reschedule notification sent to ${vendor.person_name}`);
    } else {
      console.log(`❌ Failed to send reschedule notification to ${vendor.person_name}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error in sendRescheduleNotification:', error);
    return false;
  }
};

module.exports = {
  sendBookingNotification,
  sendMultiVendorBookingNotifications,
  sendBookingStatusNotification,
  sendRescheduleNotification,
  getVendorNotifications,
  markNotificationAsRead,
  calculateVendorEarnings,
  createNotificationTable,
  sendVendorNotification,
  getVendorPushToken,
  storeNotificationRecord
}; 