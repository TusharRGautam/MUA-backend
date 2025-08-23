const express = require('express');
const router = express.Router();
const {
  processPayoutSplit,
  getVendorEarnings,
  getPayoutTransactions,
  retryFailedPayout,
  updatePayoutStatusFromWebhook
} = require('../services/payoutService');
const { 
  verifyWebhookSignature,
  logPayoutActivity,
  RAZORPAY_CONFIG 
} = require('../config/razorpayPayout');

/**
 * Process Razorpay payout split (75% vendor, 25% company)
 * POST /api/vendor/razorpay-payout
 */
router.post('/razorpay-payout', async (req, res) => {
  try {
    console.log('📡 Received payout split request:', {
      bookingId: req.body.bookingId,
      vendorId: req.body.vendorId,
      totalAmount: req.body.totalAmount
    });

    // Validate required fields
    const { bookingId, vendorId, totalAmount } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid total amount is required'
      });
    }

    // Prepare payout data
    const payoutData = {
      bookingId,
      vendorId,
      totalAmount: parseFloat(totalAmount),
      vendorAmount: req.body.vendorAmount,
      companyAmount: req.body.companyAmount,
      razorpayPaymentId: req.body.razorpayPaymentId,
      vendorAccountId: req.body.vendorAccountId,
      companyAccountId: req.body.companyAccountId
    };

    logPayoutActivity('payout_request_received', payoutData);

    // Process payout split
    const result = await processPayoutSplit(payoutData);

    if (result.success) {
      console.log('✅ Payout split processed successfully');
      res.status(200).json(result);
    } else {
      console.error('❌ Payout split failed:', result.error);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Payout API error:', error);
    logPayoutActivity('payout_api_error', {
      error: error.message,
      body: req.body
    }, 'error');

    res.status(500).json({
      success: false,
      error: 'Internal server error during payout processing',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get vendor earnings summary
 * GET /api/vendor/earnings/:vendorId
 */
router.get('/earnings/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    console.log('📊 Fetching earnings for vendor:', vendorId);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    const result = await getVendorEarnings(vendorId);

    if (result.success) {
      console.log('✅ Vendor earnings fetched successfully');
      res.status(200).json(result);
    } else {
      console.error('❌ Failed to fetch vendor earnings:', result.error);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Earnings API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching earnings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get payout transaction history for a vendor
 * GET /api/vendor/payout-transactions/:vendorId
 */
router.get('/payout-transactions/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log('📋 Fetching payout transactions for vendor:', vendorId, { limit, offset });

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be non-negative'
      });
    }

    const result = await getPayoutTransactions(vendorId, limit, offset);

    if (result.success) {
      console.log('✅ Payout transactions fetched successfully');
      res.status(200).json(result);
    } else {
      console.error('❌ Failed to fetch payout transactions:', result.error);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Payout transactions API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Retry failed payout
 * POST /api/vendor/retry-payout
 */
router.post('/retry-payout', async (req, res) => {
  try {
    const { bookingId, vendorId } = req.body;
    
    console.log('🔄 Retrying payout for booking:', bookingId, 'vendor:', vendorId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    logPayoutActivity('payout_retry_requested', { bookingId, vendorId });

    const result = await retryFailedPayout(bookingId, vendorId);

    if (result.success) {
      console.log('✅ Payout retry initiated successfully');
      res.status(200).json(result);
    } else {
      console.error('❌ Payout retry failed:', result.error);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Payout retry API error:', error);
    logPayoutActivity('payout_retry_api_error', {
      error: error.message,
      body: req.body
    }, 'error');
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during payout retry',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Handle Razorpay payout webhooks
 * POST /api/vendor/razorpay-webhook
 */
router.post('/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('🔔 Received Razorpay webhook');

    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, RAZORPAY_CONFIG.webhook_secret)) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(payload);
    console.log('📧 Webhook event:', event.event, 'entity:', event.payload?.payout?.entity?.id);

    logPayoutActivity('webhook_received', {
      event: event.event,
      entity: event.payload?.payout?.entity?.id
    });

    // Handle payout status updates
    if (event.event === 'payout.processed' || 
        event.event === 'payout.failed' || 
        event.event === 'payout.rejected') {
      
      const payout = event.payload?.payout?.entity;
      
      if (payout && payout.id) {
        const result = await updatePayoutStatusFromWebhook(
          payout.id,
          payout.status,
          {
            event: event.event,
            oldStatus: payout.status,
            failureReason: payout.failure_reason,
            utr: payout.utr
          }
        );

        if (result.success) {
          console.log('✅ Payout status updated from webhook');
          logPayoutActivity('webhook_processed', {
            payoutId: payout.id,
            status: payout.status,
            bookingId: result.booking?.booking_id
          });
        } else {
          console.error('❌ Failed to update payout status from webhook:', result.error);
          logPayoutActivity('webhook_update_failed', {
            payoutId: payout.id,
            error: result.error
          }, 'error');
        }
      }
    }

    // Acknowledge webhook
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    logPayoutActivity('webhook_error', {
      error: error.message,
      headers: req.headers
    }, 'error');
    
    res.status(500).json({
      success: false,
      error: 'Internal server error processing webhook'
    });
  }
});

/**
 * Get payout configuration and limits
 * GET /api/vendor/payout-config
 */
router.get('/payout-config', async (req, res) => {
  try {
    console.log('⚙️ Fetching payout configuration');

    res.status(200).json({
      success: true,
      data: {
        vendorPercentage: 75,
        companyPercentage: 25,
        minAmount: 100,
        maxAmount: 1000000,
        currency: 'INR',
        settlementTime: '24-48 hours',
        supportedModes: ['IMPS', 'NEFT', 'RTGS'],
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 30 // minutes
        }
      }
    });

  } catch (error) {
    console.error('❌ Payout config API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching configuration'
    });
  }
});

/**
 * Test payout API connectivity
 * GET /api/vendor/payout-test
 */
router.get('/payout-test', async (req, res) => {
  try {
    console.log('🧪 Testing payout API connectivity');

    // Test database connection
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'muadatabase',
      password: process.env.DB_PASSWORD || 'tushar123',
      port: process.env.DB_PORT || 5432,
    });

    const dbTest = await pool.query('SELECT NOW() as current_time');
    
    res.status(200).json({
      success: true,
      message: 'Payout API is working correctly',
      data: {
        timestamp: new Date().toISOString(),
        database: 'Connected',
        dbTime: dbTest.rows[0].current_time,
        razorpayConfig: 'Loaded',
        environment: process.env.NODE_ENV || 'development'
      }
    });

  } catch (error) {
    console.error('❌ Payout test API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Payout API test failed',
      details: error.message
    });
  }
});

module.exports = router;