/**
 * User Push Token Routes
 * Handles user push notification token registration and management
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @route POST /api/user/push-token/register
 * @desc Register or update user's push notification token
 * @access Public (user authenticated)
 */
router.post('/register', async (req, res) => {
  try {
    const { userId, customUserId, pushToken, deviceInfo } = req.body;

    if ((!userId && !customUserId) || !pushToken) {
      return res.status(400).json({
        success: false,
        error: 'User ID (or custom user ID) and push token are required'
      });
    }

    console.log(`🔔 Registering push token for user ${customUserId || userId}:`, pushToken);

    // Also store in global userTokens for backward compatibility
    if (!global.userTokens) {
      global.userTokens = new Map();
    }
    
    // Store in multiple formats for easy lookup
    const tokenData = {
      token: pushToken,
      platform: deviceInfo?.platform || 'unknown',
      registeredAt: new Date().toISOString(),
    };
    
    if (userId) global.userTokens.set(userId, tokenData);
    if (customUserId) global.userTokens.set(customUserId, tokenData);

    // Update user's push token in the database
    let updateTokenQuery;
    let queryParams;
    
    if (customUserId) {
      // Try to update by custom_user_id first
      updateTokenQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = $1,
          device_info = $2,
          push_token_updated_at = NOW()
        WHERE custom_user_id = $3
        RETURNING id, custom_user_id, full_name, push_token
      `;
      queryParams = [
        pushToken,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        customUserId
      ];
    } else {
      // Update by regular user ID
      updateTokenQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = $1,
          device_info = $2,
          push_token_updated_at = NOW()
        WHERE id = $3
        RETURNING id, custom_user_id, full_name, push_token
      `;
      queryParams = [
        pushToken,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        parseInt(userId)
      ];
    }

    const result = await query(updateTokenQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    console.log(`✅ Push token registered successfully for user: ${user.full_name} (${user.custom_user_id})`);

    res.status(200).json({
      success: true,
      message: 'Push token registered successfully',
      data: {
        userId: user.id,
        customUserId: user.custom_user_id,
        fullName: user.full_name,
        tokenRegistered: true
      }
    });

  } catch (error) {
    console.error('❌ Error registering user push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push token',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/user/push-token/update
 * @desc Update user's push notification token
 * @access Public (user authenticated)
 */
router.put('/update', async (req, res) => {
  try {
    const { userId, customUserId, pushToken, oldToken } = req.body;

    if ((!userId && !customUserId) || !pushToken) {
      return res.status(400).json({
        success: false,
        error: 'User ID (or custom user ID) and push token are required'
      });
    }

    console.log(`🔄 Updating push token for user ${customUserId || userId}`);

    // Update the push token
    let updateQuery;
    let queryParams;
    
    if (customUserId) {
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = $1,
          push_token_updated_at = NOW()
        WHERE custom_user_id = $2
        RETURNING id, custom_user_id, full_name
      `;
      queryParams = [pushToken, customUserId];
    } else {
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = $1,
          push_token_updated_at = NOW()
        WHERE id = $2
        RETURNING id, custom_user_id, full_name
      `;
      queryParams = [pushToken, parseInt(userId)];
    }

    const result = await query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Also update global storage
    if (!global.userTokens) {
      global.userTokens = new Map();
    }
    
    const tokenData = {
      token: pushToken,
      platform: 'unknown',
      registeredAt: new Date().toISOString(),
    };
    
    global.userTokens.set(user.id.toString(), tokenData);
    if (user.custom_user_id) {
      global.userTokens.set(user.custom_user_id, tokenData);
    }

    console.log(`✅ Push token updated for user: ${user.full_name} (${user.custom_user_id})`);

    res.status(200).json({
      success: true,
      message: 'Push token updated successfully',
      data: {
        userId: user.id,
        customUserId: user.custom_user_id,
        fullName: user.full_name,
        tokenUpdated: true
      }
    });

  } catch (error) {
    console.error('❌ Error updating user push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update push token',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/user/push-token/unregister
 * @desc Remove user's push notification token
 * @access Public (user authenticated)
 */
router.delete('/unregister', async (req, res) => {
  try {
    const { userId, customUserId } = req.body;

    if (!userId && !customUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or custom user ID is required'
      });
    }

    console.log(`🔕 Unregistering push token for user ${customUserId || userId}`);

    // Remove the push token
    let updateQuery;
    let queryParams;
    
    if (customUserId) {
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = NULL,
          device_info = NULL,
          push_token_updated_at = NOW()
        WHERE custom_user_id = $1
        RETURNING id, custom_user_id, full_name
      `;
      queryParams = [customUserId];
    } else {
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          push_token = NULL,
          device_info = NULL,
          push_token_updated_at = NOW()
        WHERE id = $1
        RETURNING id, custom_user_id, full_name
      `;
      queryParams = [parseInt(userId)];
    }

    const result = await query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Also remove from global storage
    if (global.userTokens) {
      global.userTokens.delete(user.id.toString());
      if (user.custom_user_id) {
        global.userTokens.delete(user.custom_user_id);
      }
    }

    console.log(`✅ Push token unregistered for user: ${user.full_name} (${user.custom_user_id})`);

    res.status(200).json({
      success: true,
      message: 'Push token unregistered successfully',
      data: {
        userId: user.id,
        customUserId: user.custom_user_id,
        fullName: user.full_name,
        tokenUnregistered: true
      }
    });

  } catch (error) {
    console.error('❌ Error unregistering user push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister push token',
      details: error.message
    });
  }
});

/**
 * @route GET /api/user/push-token/status/:identifier
 * @desc Get user's push notification token status
 * @access Public (user authenticated)
 */
router.get('/status/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    console.log(`📋 Getting push token status for user ${identifier}`);

    // Determine if identifier is custom_user_id or regular user ID
    let statusQuery;
    let queryParams;
    
    if (identifier.startsWith('CLUB')) {
      statusQuery = `
        SELECT 
          id,
          custom_user_id,
          full_name,
          push_token,
          device_info,
          push_token_updated_at
        FROM Customer_Table_Details 
        WHERE custom_user_id = $1
      `;
      queryParams = [identifier];
    } else {
      statusQuery = `
        SELECT 
          id,
          custom_user_id,
          full_name,
          push_token,
          device_info,
          push_token_updated_at
        FROM Customer_Table_Details 
        WHERE id = $1
      `;
      queryParams = [parseInt(identifier)];
    }

    const result = await query(statusQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        customUserId: user.custom_user_id,
        fullName: user.full_name,
        hasToken: !!user.push_token,
        tokenLastUpdated: user.push_token_updated_at,
        deviceInfo: user.device_info ? 
          (typeof user.device_info === 'string' ? JSON.parse(user.device_info) : user.device_info) 
          : null
      }
    });

  } catch (error) {
    console.error('❌ Error getting user push token status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push token status',
      details: error.message
    });
  }
});

/**
 * @route POST /api/user/push-token/test
 * @desc Send a test notification to user
 * @access Public (for testing)
 */
router.post('/test', async (req, res) => {
  try {
    const { userId, customUserId, title, body } = req.body;

    if (!userId && !customUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or custom user ID is required'
      });
    }

    const { sendUserNotification, getUserPushToken } = require('../services/userNotificationService');
    
    const user = await getUserPushToken(customUserId || userId);
    
    if (!user || !user.push_token) {
      return res.status(404).json({
        success: false,
        error: 'User push token not found'
      });
    }

    const notificationData = {
      title: title || '🧪 Test Notification',
      body: body || 'This is a test notification from MUA app!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };

    const success = await sendUserNotification(user.push_token, notificationData);

    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
      data: {
        userId: user.user_id,
        customUserId: user.custom_user_id
      }
    });

  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});

module.exports = router; 