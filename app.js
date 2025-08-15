const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const app = express();

// Function to fetch and display dashboard service tables
async function fetchDashboardServiceTables() {
  try {
    console.log('\n🔍 Fetching Dashboard Service Tables...');
    console.log('=' .repeat(50));
    
    // Fetch dashboard_salon_services
    console.log('\n🏪 Dashboard Salon Services:');
    const salonServices = await query('SELECT * FROM dashboard_salon_services ORDER BY service_name');
    console.table(salonServices.rows);
    console.log(`Total Salon Services: ${salonServices.rows.length}`);
    
    // Fetch dashboard_prp_services
    console.log('\n💉 Dashboard PRP Services:');
    const prpServices = await query('SELECT * FROM dashboard_prp_services ORDER BY service_name');
    console.table(prpServices.rows);
    console.log(`Total PRP Services: ${prpServices.rows.length}`);
    
    // Fetch dashboard_diagnostics_services
    console.log('\n🏥 Dashboard Diagnostics Services:');
    const diagnosticsServices = await query('SELECT * FROM dashboard_diagnostics_services ORDER BY service_name');
    console.table(diagnosticsServices.rows);
    console.log(`Total Diagnostics Services: ${diagnosticsServices.rows.length}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Dashboard service tables fetched successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching dashboard service tables:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Root route for API status check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'MUA Backend API is running',
    version: '1.0.0'
  });
});

// Payment test route directly in app.js for verification
app.get('/api/payments-direct-test', (req, res) => {
  res.json({
    success: true,
    message: 'Direct payment test route is working',
    note: 'This route is defined directly in app.js'
  });
});

// Mock payment endpoint directly in app.js
app.post('/api/payments/mock-payment', async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    console.log('🔄 Mock payment request received:', { bookingId, amount });
    
    if (!bookingId) {
      console.log('❌ Mock payment failed: BookingId is required');
      return res.status(400).json({
        success: false,
        error: 'BookingId is required'
      });
    }
    
    console.log(`🔄 Processing mock payment for booking: ${bookingId}`);
    
    // Create mock payment data
    const mockPaymentId = `pay_mock_${Date.now()}`;
    const mockOrderId = `order_mock_${Date.now()}`;
    const mockSignature = 'mock_signature';
    
    // Update booking with mock payment details
    try {
      console.log('🔄 Updating booking in database with mock payment details...');
      const updateQuery = `
        UPDATE booking_all_details_of_user_to_vendor 
        SET 
          payment_status = 'paid',
          payment_method = 'razorpay',
          razorpay_payment_id = $1,
          razorpay_order_id = $2,
          razorpay_signature = $3,
          booking_status = 'confirmed',
          updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $4
        RETURNING id
      `;
      
      const result = await query(updateQuery, [mockPaymentId, mockOrderId, mockSignature, bookingId]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Mock payment successful for booking: ${bookingId}, updated record ID: ${result.rows[0].id}`);
      } else {
        console.log(`⚠️ Booking not found for mock payment: ${bookingId}`);
      }
    } catch (dbError) {
      console.error('❌ Database error in mock payment:', dbError.message);
      // Continue with response even if DB update fails
    }
    
    const responseData = {
      success: true,
      message: 'Mock payment processed successfully',
      data: {
        paymentId: mockPaymentId,
        orderId: mockOrderId,
        signature: mockSignature,
        bookingId: bookingId,
        amount: amount,
        status: 'paid'
      }
    };
    
    console.log('✅ Mock payment response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error processing mock payment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process mock payment',
      message: error.message
    });
  }
});

// Update booking payment status directly in app.js
app.post('/api/payments/update-booking-payment', async (req, res) => {
  try {
    const { 
      bookingId, 
      razorpayPaymentId, 
      razorpayOrderId, 
      razorpaySignature, 
      amount, 
      paymentMethod = 'razorpay' 
    } = req.body;

    console.log('🔄 Update booking payment status request received:', {
      bookingId,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      method: paymentMethod,
      amount
    });

    if (!bookingId || !razorpayPaymentId) {
      console.log('❌ Update payment status failed: BookingId and payment ID are required');
      return res.status(400).json({
        success: false,
        error: 'BookingId and payment ID are required'
      });
    }

    // Update booking with payment details
    console.log('🔄 Updating booking with payment details in database...');
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        payment_status = 'paid',
        payment_method = $1,
        razorpay_payment_id = $2,
        razorpay_order_id = $3,
        razorpay_signature = $4,
        payment_gateway = 'razorpay',
        payment_amount = $5,
        payment_currency = 'INR',
        payment_date_time = CURRENT_TIMESTAMP,
        booking_status = 'confirmed',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $6
      RETURNING id
    `;

    const result = await query(updateQuery, [
      paymentMethod,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount || 0,
      bookingId
    ]);

    if (result.rows.length > 0) {
      console.log(`✅ Payment status updated for booking: ${bookingId}, updated record ID: ${result.rows[0].id}`);
      console.log(`💳 Payment details: ${razorpayPaymentId} (${paymentMethod})`);
      
      const responseData = {
        success: true,
        message: 'Booking payment status updated successfully',
        data: {
          bookingId,
          paymentId: razorpayPaymentId,
          status: 'paid'
        }
      };
      
      console.log('✅ Update payment status response:', responseData);
      res.json(responseData);
    } else {
      console.log(`⚠️ Booking not found for payment update: ${bookingId}`);
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
  } catch (error) {
    console.error('❌ Error updating booking payment status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking payment status',
      message: error.message
    });
  }
});

// Payment test endpoint directly in app.js
app.get('/api/payments/test', (req, res) => {
  console.log('✅ Payment test endpoint called');
  res.json({
    success: true,
    message: 'Payment API is working',
    timestamp: new Date().toISOString()
  });
});

// Import routes
console.log('🔄 Loading routes...');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
console.log('🔄 Loading payment routes...');
const paymentRoutes = require('./routes/paymentRoutes');
console.log('✅ Payment routes loaded successfully');
const businessRoutes = require('./routes/businessRoutes');
const transformationRoutes = require('./routes/transformationRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRescheduleRoutes = require('./routes/bookingRescheduleRoutes');
const vendorPreferencesRoutes = require('./routes/vendorPreferencesRoutes');
const readyServicesRoutes = require('./routes/readyServicesRoutes');
const prpRoutes = require('./routes/prpRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const userPushTokenRoutes = require('./routes/userPushTokenRoutes');
const combinedDataRoutes = require('./routes/combinedDataRoutes');
const componentDataRoutes = require('./routes/componentDataRoutes');
// Optimized routes
const optimizedBookingRoutes = require('./routes/optimizedBookingRoutes');
const optimizedVendorRoutes = require('./routes/optimizedVendorRoutes');
const { errorHandler, notFoundHandler, getErrorMetrics, healthCheck } = require('./middleware/enhancedErrorHandler');


// Register routes
console.log('🔄 Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes); // Fixed: changed from /vendors to /vendor
app.use('/api/vendors', vendorRoutes); // Also support plural form for backward compatibility
app.use('/api/customers', customerRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/transformation', transformationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes); // Also support plural form
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', bookingRescheduleRoutes);
app.use('/api/vendor-preferences', vendorPreferencesRoutes); 
app.use('/api/ready-services', readyServicesRoutes);
app.use('/api/prp', prpRoutes);
app.use('/api/services', serviceRoutes); // Added service routes for icons
app.use('/api/gallery', galleryRoutes); // Added gallery routes
app.use('/api/combined', combinedDataRoutes); // Added combined data routes for optimized loading
app.use('/api/component-data', componentDataRoutes); // Added component data routes for prefetching
console.log('🔄 Registering payment routes...');
app.use('/api/payments', paymentRoutes);
console.log('✅ Payment routes registered successfully');

// Add user push token routes
app.use('/api/user/push-token', userPushTokenRoutes);

// Log registered routes
console.log('\n📋 API Routes registered successfully');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} and accessible on all interfaces`);
  
  // Fetch and display dashboard service tables on startup
  await fetchDashboardServiceTables();
});
// Use optimized routes
app.use('/api/bookings-optimized', optimizedBookingRoutes);
app.use('/api/vendors-optimized', optimizedVendorRoutes);

// Monitoring endpoints
app.get('/api/health', healthCheck);
app.get('/api/metrics/errors', getErrorMetrics);
