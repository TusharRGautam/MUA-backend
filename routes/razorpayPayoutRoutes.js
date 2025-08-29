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
 * Get comprehensive vendor earnings summary with day/week/month breakdowns
 * GET /api/vendor/earnings/:vendorId
 */
router.get('/earnings/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    console.log('📊 Fetching comprehensive earnings for vendor:', vendorId);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Import db query function
    const { query } = require('../db');

    // Get today's date in IST
    const today = new Date();
    const todayIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000));
    const todayDate = todayIST.toISOString().split('T')[0];
    
    // Get this week's start date (Monday)
    const thisWeekStart = new Date(todayIST);
    thisWeekStart.setDate(todayIST.getDate() - todayIST.getDay() + 1);
    const weekStartDate = thisWeekStart.toISOString().split('T')[0];
    
    // Get this month's start date
    const thisMonthStart = new Date(todayIST.getFullYear(), todayIST.getMonth(), 1);
    const monthStartDate = thisMonthStart.toISOString().split('T')[0];

    // Comprehensive earnings query
    const comprehensiveEarningsQuery = `
      WITH vendor_bookings AS (
        SELECT *
        FROM booking_all_details_of_user_to_vendor 
        WHERE (vendor_id = $1 OR assigned_vendor_id = $1)
      ),
      lifetime_stats AS (
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN booking_status = 'cancelled' OR booking_status = 'denied' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as lifetime_revenue,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN 
            CASE 
              WHEN vendor_amount > 0 THEN vendor_amount 
              ELSE (final_amount * 0.7)
            END 
          END), 0) as lifetime_earnings
        FROM vendor_bookings
      ),
      today_stats AS (
        SELECT 
          COUNT(*) as today_bookings,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as today_completed,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as today_revenue,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN 
            CASE 
              WHEN vendor_amount > 0 THEN vendor_amount 
              ELSE (final_amount * 0.7)
            END 
          END), 0) as today_earnings
        FROM vendor_bookings
        WHERE booking_date = $2
      ),
      week_stats AS (
        SELECT 
          COUNT(*) as week_bookings,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as week_completed,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as week_revenue,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN 
            CASE 
              WHEN vendor_amount > 0 THEN vendor_amount 
              ELSE (final_amount * 0.7)
            END 
          END), 0) as week_earnings
        FROM vendor_bookings
        WHERE booking_date >= $3
      ),
      month_stats AS (
        SELECT 
          COUNT(*) as month_bookings,
          COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as month_completed,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as month_revenue,
          COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN 
            CASE 
              WHEN vendor_amount > 0 THEN vendor_amount 
              ELSE (final_amount * 0.7)
            END 
          END), 0) as month_earnings
        FROM vendor_bookings
        WHERE booking_date >= $4
      ),
      payout_stats AS (
        SELECT 
          COUNT(CASE WHEN payout_status = 'processed' THEN 1 END) as settled_payouts,
          COUNT(CASE WHEN payout_status = 'processing' THEN 1 END) as processing_payouts,
          COUNT(CASE WHEN payout_status = 'pending' THEN 1 END) as pending_payouts,
          COALESCE(SUM(CASE WHEN payout_status = 'processed' THEN vendor_amount END), 0) as settled_amount,
          COALESCE(SUM(CASE WHEN payout_status = 'processing' THEN vendor_amount END), 0) as processing_amount,
          COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN vendor_amount END), 0) as pending_amount
        FROM vendor_bookings
        WHERE booking_status = 'completed' AND vendor_amount > 0
      )
      SELECT 
        l.*,
        t.*,
        w.*,
        m.*,
        p.*
      FROM lifetime_stats l
      CROSS JOIN today_stats t
      CROSS JOIN week_stats w
      CROSS JOIN month_stats m
      CROSS JOIN payout_stats p
    `;

    console.log('📊 [DEBUG] Executing comprehensive earnings query with params:', [vendorId, todayDate, weekStartDate, monthStartDate]);
    
    const result = await query(comprehensiveEarningsQuery, [vendorId, todayDate, weekStartDate, monthStartDate]);
    
    if (result.rows && result.rows.length > 0) {
      const stats = result.rows[0];
      
      const responseData = {
        // Lifetime Statistics
        totalBookings: parseInt(stats.total_bookings) || 0,
        completedBookings: parseInt(stats.completed_bookings) || 0,
        cancelledBookings: parseInt(stats.cancelled_bookings) || 0,
        lifetimeRevenue: parseFloat(stats.lifetime_revenue) || 0,
        lifetimeEarnings: parseFloat(stats.lifetime_earnings) || 0,
        
        // Today's Statistics
        todayBookings: parseInt(stats.today_bookings) || 0,
        todayCompleted: parseInt(stats.today_completed) || 0,
        todayRevenue: parseFloat(stats.today_revenue) || 0,
        todayEarnings: parseFloat(stats.today_earnings) || 0,
        
        // This Week's Statistics
        weekBookings: parseInt(stats.week_bookings) || 0,
        weekCompleted: parseInt(stats.week_completed) || 0,
        weekRevenue: parseFloat(stats.week_revenue) || 0,
        weekEarnings: parseFloat(stats.week_earnings) || 0,
        
        // This Month's Statistics
        monthBookings: parseInt(stats.month_bookings) || 0,
        monthCompleted: parseInt(stats.month_completed) || 0,
        monthRevenue: parseFloat(stats.month_revenue) || 0,
        monthEarnings: parseFloat(stats.month_earnings) || 0,
        
        // Payout Statistics
        settledPayouts: parseInt(stats.settled_payouts) || 0,
        processingPayouts: parseInt(stats.processing_payouts) || 0,
        pendingPayouts: parseInt(stats.pending_payouts) || 0,
        settledAmount: parseFloat(stats.settled_amount) || 0,
        processingAmount: parseFloat(stats.processing_amount) || 0,
        pendingAmount: parseFloat(stats.pending_amount) || 0,
        
        // Additional Metrics
        avgOrderValue: stats.completed_bookings > 0 ? (parseFloat(stats.lifetime_revenue) / parseInt(stats.completed_bookings)) : 0,
        completionRate: stats.total_bookings > 0 ? ((parseInt(stats.completed_bookings) / parseInt(stats.total_bookings)) * 100) : 0
      };

      console.log('✅ [DEBUG] Comprehensive earnings processed successfully');
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      // No bookings found
      res.status(200).json({
        success: true,
        data: {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          lifetimeRevenue: 0,
          lifetimeEarnings: 0,
          todayBookings: 0,
          todayCompleted: 0,
          todayRevenue: 0,
          todayEarnings: 0,
          weekBookings: 0,
          weekCompleted: 0,
          weekRevenue: 0,
          weekEarnings: 0,
          monthBookings: 0,
          monthCompleted: 0,
          monthRevenue: 0,
          monthEarnings: 0,
          settledPayouts: 0,
          processingPayouts: 0,
          pendingPayouts: 0,
          settledAmount: 0,
          processingAmount: 0,
          pendingAmount: 0,
          avgOrderValue: 0,
          completionRate: 0
        }
      });
    }

  } catch (error) {
    console.error('❌ Comprehensive earnings API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching earnings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get today's overview for vendor dashboard
 * GET /api/vendor/todays-overview/:vendorId
 */
router.get('/todays-overview/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // Get today's date in IST first
    const today = new Date();
    const todayIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000));
    const todayDate = todayIST.toISOString().split('T')[0];
    
    console.log('📊 [DEBUG] Fetching today\'s overview for vendor:', vendorId, 'Date:', todayDate);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required'
      });
    }

    // Import db query function
    const { query } = require('../db');

    // Query today's bookings for this vendor with comprehensive metrics
    const todayBookingsQuery = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN booking_status = 'cancelled' OR booking_status = 'denied' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN booking_status = 'pending_vendor_acceptance' OR booking_status = 'pending_solo_vendor_acceptance' THEN 1 END) as pending_appointments,
        COUNT(CASE WHEN booking_status = 'confirmed' OR booking_status = 'accepted' THEN 1 END) as confirmed_appointments,
        COUNT(CASE WHEN booking_status = 'completed' AND razorpay_payment_id IS NOT NULL THEN 1 END) as reviewed_appointments,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN 
          CASE 
            WHEN vendor_amount > 0 THEN vendor_amount 
            ELSE (final_amount * 0.7)  -- Default 70% to vendor if vendor_amount is not set
          END 
        END), 0) as total_earnings,
        COALESCE(AVG(CASE WHEN booking_status = 'completed' THEN final_amount END), 0) as avg_order_value
      FROM booking_all_details_of_user_to_vendor 
      WHERE (vendor_id = $1 OR assigned_vendor_id = $1) 
      AND booking_date = $2
    `;

    console.log('📊 [DEBUG] Executing query with params:', [vendorId, todayDate]);
    
    const result = await query(todayBookingsQuery, [vendorId, todayDate]);
    
    console.log('📊 [DEBUG] Query result rows:', result.rows.length, result.rows[0] || 'No rows');
    
    if (result.rows && result.rows.length > 0) {
      const overview = result.rows[0];
      
      const responseData = {
        todayAppointments: parseInt(overview.total_appointments) || 0,
        todayCompleted: parseInt(overview.completed_appointments) || 0,
        todayPending: parseInt(overview.pending_appointments) || 0,
        todayConfirmed: parseInt(overview.confirmed_appointments) || 0,
        todayCancelled: parseInt(overview.cancelled_appointments) || 0,
        todayReviews: parseInt(overview.reviewed_appointments) || 0,
        todayRevenue: parseFloat(overview.total_revenue) || 0,
        todayEarnings: parseFloat(overview.total_earnings) || 0,
        avgOrderValue: parseFloat(overview.avg_order_value) || 0
      };

      console.log('✅ [DEBUG] Today\'s overview processed successfully:', responseData);
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      // No bookings found for today
      res.status(200).json({
        success: true,
        data: {
          todayAppointments: 0,
          todayCompleted: 0,
          todayPending: 0,
          todayConfirmed: 0,
          todayCancelled: 0,
          todayReviews: 0,
          todayRevenue: 0,
          todayEarnings: 0,
          avgOrderValue: 0
        }
      });
    }

  } catch (error) {
    console.error('❌ Today\'s overview API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching today\'s overview',
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