/**
 * Vendor Push Token Routes
 * Handles vendor push notification token registration and management
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @route POST /api/vendor/push-token/register
 * @desc Register or update vendor's push notification token
 * @access Public (vendor authenticated)
 */
router.post('/register', async (req, res) => {
  try {
    const { vendorId, pushToken, deviceInfo } = req.body;

    if (!vendorId || !pushToken) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID and push token are required'
      });
    }

    console.log(`🔔 Registering push token for vendor ${vendorId}:`, pushToken);

    // Update vendor's push token in the database
    const updateTokenQuery = `
      UPDATE registration_and_other_details 
      SET 
        push_token = $1,
        device_info = $2,
        push_token_updated_at = NOW()
      WHERE sr_no = $3
      RETURNING sr_no, business_name, push_token
    `;

    const result = await query(updateTokenQuery, [
      pushToken,
      deviceInfo ? JSON.stringify(deviceInfo) : null,
      vendorId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const vendor = result.rows[0];

    console.log(`✅ Push token registered successfully for vendor: ${vendor.business_name}`);

    res.status(200).json({
      success: true,
      message: 'Push token registered successfully',
      data: {
        vendorId: vendor.sr_no,
        businessName: vendor.business_name,
        tokenRegistered: true
      }
    });

  } catch (error) {
    console.error('❌ Error registering push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push token',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/push-token/update
 * @desc Update vendor's push notification token
 * @access Public (vendor authenticated)
 */
router.put('/update', async (req, res) => {
  try {
    const { vendorId, pushToken, oldToken } = req.body;

    if (!vendorId || !pushToken) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID and push token are required'
      });
    }

    console.log(`🔄 Updating push token for vendor ${vendorId}`);

    // Update the push token
    const updateQuery = `
      UPDATE registration_and_other_details 
      SET 
        push_token = $1,
        push_token_updated_at = NOW()
      WHERE sr_no = $2
      RETURNING sr_no, business_name
    `;

    const result = await query(updateQuery, [pushToken, vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    console.log(`✅ Push token updated for vendor: ${result.rows[0].business_name}`);

    res.status(200).json({
      success: true,
      message: 'Push token updated successfully',
      data: {
        vendorId: result.rows[0].sr_no,
        businessName: result.rows[0].business_name,
        tokenUpdated: true
      }
    });

  } catch (error) {
    console.error('❌ Error updating push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update push token',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/vendor/push-token/unregister
 * @desc Remove vendor's push notification token
 * @access Public (vendor authenticated)
 */
router.delete('/unregister', async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    console.log(`🔕 Unregistering push token for vendor ${vendorId}`);

    // Remove the push token
    const updateQuery = `
      UPDATE registration_and_other_details 
      SET 
        push_token = NULL,
        device_info = NULL,
        push_token_updated_at = NOW()
      WHERE sr_no = $1
      RETURNING sr_no, business_name
    `;

    const result = await query(updateQuery, [vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    console.log(`✅ Push token unregistered for vendor: ${result.rows[0].business_name}`);

    res.status(200).json({
      success: true,
      message: 'Push token unregistered successfully',
      data: {
        vendorId: result.rows[0].sr_no,
        businessName: result.rows[0].business_name,
        tokenUnregistered: true
      }
    });

  } catch (error) {
    console.error('❌ Error unregistering push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister push token',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/push-token/status/:vendorId
 * @desc Get vendor's push notification token status
 * @access Public (vendor authenticated)
 */
router.get('/status/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;

    console.log(`📋 Getting push token status for vendor ${vendorId}`);

    const statusQuery = `
      SELECT 
        sr_no,
        business_name,
        push_token,
        device_info,
        push_token_updated_at
      FROM registration_and_other_details 
      WHERE sr_no = $1
    `;

    const result = await query(statusQuery, [vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const vendor = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        vendorId: vendor.sr_no,
        businessName: vendor.business_name,
        hasToken: !!vendor.push_token,
        tokenLastUpdated: vendor.push_token_updated_at,
        deviceInfo: vendor.device_info ? 
          (typeof vendor.device_info === 'string' ? JSON.parse(vendor.device_info) : vendor.device_info) 
          : null
      }
    });

  } catch (error) {
    console.error('❌ Error getting push token status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push token status',
      details: error.message
    });
  }
});

/**
 * @route POST /api/vendor/push-token/test
 * @desc Send a test notification to vendor
 * @access Public (vendor authenticated)
 */
router.post('/test', async (req, res) => {
  try {
    const { vendorId, message } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Import notification service
    const { sendBookingNotification } = require('../services/vendorNotificationService');

    console.log(`🧪 Sending test notification to vendor ${vendorId}`);

    // Send test notification
    const testData = {
      bookingId: 'TEST_' + Date.now(),
      customerName: 'Test Customer',
      serviceNames: 'Test Service',
      totalAmount: 1000,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '10:00',
      message: message || 'This is a test notification from your app!'
    };

    const notificationResult = await sendBookingNotification(vendorId, testData);

    if (notificationResult.success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: notificationResult
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send test notification',
        details: notificationResult.error
      });
    }

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