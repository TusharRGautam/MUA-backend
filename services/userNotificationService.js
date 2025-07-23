/**
 * User Notification Service
 * Handles push notifications to users when booking status changes
 */

const { query } = require('../db');
const axios = require('axios');

// Expo Push Notification API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

console.log('🚀 Initializing User Notification Service with Expo Push Notifications');

/**
 * Get user push token from database
 */
const getUserPushToken = async (userId) => {
  try {
    console.log(`🔍 Looking up push token for user: ${userId}`);
    
    // First try to get from the in-memory userTokens map (for immediate fallback)
    const userTokens = global.userTokens || new Map();
    
    if (userTokens.has(userId)) {
      const tokenData = userTokens.get(userId);
      console.log(`📱 Found user ${userId} push token in memory`);
      return {
        push_token: tokenData.token,
        user_id: userId,
        platform: tokenData.platform
      };
    }

    // Try to find user in Customer_Table_Details by different identifiers
    let userQuery;
    let queryParams;
    
    // Check if userId looks like a custom user ID (CLUB01XX format)
    if (userId && typeof userId === 'string' && userId.startsWith('CLUB')) {
      userQuery = `
        SELECT id, custom_user_id, push_token, device_info, full_name 
        FROM Customer_Table_Details 
        WHERE custom_user_id = $1 AND push_token IS NOT NULL
      `;
      queryParams = [userId];
    } 
    // Check if userId is numeric (regular user ID)
    else if (userId && !isNaN(userId)) {
      userQuery = `
        SELECT id, custom_user_id, push_token, device_info, full_name 
        FROM Customer_Table_Details 
        WHERE id = $1 AND push_token IS NOT NULL
      `;
      queryParams = [parseInt(userId)];
    }
    // Check if userId looks like an email
    else if (userId && userId.includes('@')) {
      userQuery = `
        SELECT id, custom_user_id, push_token, device_info, full_name 
        FROM Customer_Table_Details 
        WHERE email = $1 AND push_token IS NOT NULL
      `;
      queryParams = [userId];
    }
    // Check if userId looks like a phone number
    else if (userId && userId.startsWith('+')) {
      userQuery = `
        SELECT id, custom_user_id, push_token, device_info, full_name 
        FROM Customer_Table_Details 
        WHERE phone_number = $1 AND push_token IS NOT NULL
      `;
      queryParams = [userId];
    } else {
      console.log(`⚠️ Invalid user identifier format: ${userId}`);
      return null;
    }

    const result = await query(userQuery, queryParams);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`📱 Found user ${user.full_name} (${user.custom_user_id}) push token in database`);
      return {
        push_token: user.push_token,
        user_id: user.id,
        custom_user_id: user.custom_user_id,
        platform: user.device_info?.platform || 'unknown'
      };
    }
    
    console.log(`⚠️ No push token found for user ${userId} in database`);
    return null;
  } catch (error) {
    console.error('Error getting user push token:', error);
    return null;
  }
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

    console.log('📱 Sending Expo push notification to user:', {
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
    // Check for direct response format
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
 * Send push notification to user
 */
const sendUserNotification = async (pushToken, notificationData) => {
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
 * Store notification record in database for tracking
 */
const storeUserNotificationRecord = async (userId, bookingId, notificationData, notificationType = 'booking_accepted') => {
  try {
    // TODO: Implement user notification storage when user_notifications table is available
    console.log(`📝 Would store notification record for user ${userId}, booking ${bookingId}, type ${notificationType}`);
    
    // For now, just log the notification
    console.log(`📝 Notification record:`, {
      userId,
      bookingId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationType,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error storing user notification record:', error);
    return false;
  }
};

/**
 * Send booking acceptance notification to user
 */
const sendBookingAcceptanceNotification = async (bookingData) => {
  try {
    const { userId, customUserId, userEmail, userPhone, vendorName, bookingId } = bookingData;
    
    console.log(`📱 Sending booking acceptance notification for booking ${bookingId}`);
    console.log(`📱 User identifiers:`, { userId, customUserId, userEmail, userPhone, vendorName });
    
    // Try to get user push token using different identifiers in priority order
    let user = null;
    
    // Try with customUserId first (most reliable for our system)
    if (customUserId) {
      console.log(`🔍 Trying to find user by customUserId: ${customUserId}`);
      user = await getUserPushToken(customUserId);
    }
    
    // Try with userId if customUserId didn't work
    if (!user && userId) {
      console.log(`🔍 Trying to find user by userId: ${userId}`);
      user = await getUserPushToken(userId);
    }
    
    // Try with email as fallback
    if (!user && userEmail) {
      console.log(`🔍 Trying to find user by email: ${userEmail}`);
      user = await getUserPushToken(userEmail);
    }
    
    // Try with phone as fallback
    if (!user && userPhone) {
      console.log(`🔍 Trying to find user by phone: ${userPhone}`);
      user = await getUserPushToken(userPhone);
    }
    
    if (!user || !user.push_token) {
      console.log(`⚠️ No push token found for user (tried: ${userId}, ${customUserId}, ${userEmail}, ${userPhone})`);
      return {
        success: true, // Don't fail the booking process
        error: 'No push token registered for this user',
        skipped: true
      };
    }

    // Skip invalid test tokens to prevent API errors
    if (user.push_token.includes('test_token') || user.push_token.includes('TEST_TOKEN')) {
      console.log(`⚠️ Skipping test token for user`);
      return {
        success: true, // Don't fail the booking process
        error: 'Test token detected, notification skipped',
        skipped: true
      };
    }

    // Create notification content
    const notificationData = {
      title: '🎉 Booking Accepted!',
      body: `Hurray! ${vendorName || 'Your vendor'} has accepted your booking.`,
      data: {
        type: 'booking_accepted',
        bookingId: bookingId,
        vendorName: vendorName,
        userId: user.custom_user_id || userId,
        timestamp: new Date().toISOString()
      }
    };

    // Send the notification
    const success = await sendUserNotification(user.push_token, notificationData);
    
    if (success) {
      // Store notification in database for tracking
      await storeUserNotificationRecord(user.custom_user_id || userId, bookingId, notificationData);
      console.log(`✅ Booking acceptance notification sent to user`);
    } else {
      console.log(`❌ Failed to send booking acceptance notification to user`);
    }
    
    return { success };
  } catch (error) {
    console.error('Error in sendBookingAcceptanceNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking status update notification to user
 */
const sendBookingStatusNotification = async (userId, bookingId, status, vendorName) => {
  try {
    const user = await getUserPushToken(userId);
    if (!user || !user.push_token) {
      return false;
    }

    let title = '';
    let body = '';

    switch (status) {
      case 'accepted':
        title = '🎉 Booking Accepted!';
        body = `Hurray! ${vendorName || 'Your vendor'} has accepted your booking.`;
        break;
      case 'started':
        title = '🚀 Service Started';
        body = `${vendorName || 'Your vendor'} has started your service.`;
        break;
      case 'completed':
        title = '✅ Service Completed';
        body = `Your service with ${vendorName || 'your vendor'} has been completed successfully.`;
        break;
      case 'cancelled':
        title = '❌ Booking Cancelled';
        body = `Your booking with ${vendorName || 'your vendor'} has been cancelled.`;
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
        userId,
        status,
        vendorName,
        timestamp: new Date().toISOString()
      }
    };

    return await sendUserNotification(user.push_token, notificationData);
  } catch (error) {
    console.error('Error sending booking status notification to user:', error);
    return false;
  }
};

module.exports = {
  sendBookingAcceptanceNotification,
  sendBookingStatusNotification,
  sendUserNotification,
  getUserPushToken
}; 