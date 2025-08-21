const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { razorpay, RAZORPAY_CONFIG } = require('../config/razorpay');
const crypto = require('crypto');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Payment test endpoint called');
  res.json({
    success: true,
    message: 'Payment API is working',
    timestamp: new Date().toISOString()
  });
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    
    const { amount, currency = 'INR', bookingId, customerName, customerEmail, customerPhone } = req.body;

    console.log('🔄 Creating Razorpay order with data:', {
      amount,
      currency,
      bookingId,
      customerName,
      customerEmail,
      customerPhone
    });

    console.log('🔍 Validation check:', {
      amount: amount,
      amountType: typeof amount,
      amountValid: amount !== undefined && amount !== null && amount > 0,
      bookingId: bookingId,
      bookingIdType: typeof bookingId,
      bookingIdValid: bookingId !== undefined && bookingId !== null && bookingId !== ''
    });

    if (amount === undefined || amount === null || amount <= 0) {
      console.log('❌ Validation failed: Invalid amount');
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required',
        received: { amount, type: typeof amount }
      });
    }

    if (!bookingId || bookingId.trim() === '') {
      console.log('❌ Validation failed: Invalid bookingId');
      return res.status(400).json({
        success: false,
        error: 'BookingId is required',
        received: { bookingId, type: typeof bookingId }
      });
    }

    // Frontend already sends amount in paise, no need to convert again
    const amountInPaise = Math.round(amount);
    console.log('💰 Amount processing:', {
      receivedAmount: amount,
      amountInPaise: amountInPaise,
      note: 'Frontend already converts to paise'
    });

    // Create order options
    const orderOptions = {
      amount: amountInPaise,
      currency: currency,
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        customerName: customerName || 'Guest User',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || ''
      }
    };

    console.log('🔄 Creating Razorpay order with options:', orderOptions);

    // Create order using Razorpay API
    const order = await razorpay.orders.create(orderOptions);

    console.log('✅ Razorpay order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

    // Update booking with order ID
    try {
      const updateQuery = `
        UPDATE booking_all_details_of_user_to_vendor 
        SET 
          razorpay_order_id = $1,
          payment_status = 'order_created',
          updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $2
        RETURNING id
      `;
      
      const result = await query(updateQuery, [order.id, bookingId]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Order ID saved to booking: ${bookingId}`);
      } else {
        console.log(`⚠️ Booking not found for order update: ${bookingId}`);
      }
    } catch (dbError) {
      console.error('❌ Database error updating order ID:', dbError.message);
      // Continue with response even if DB update fails
    }

    const responseData = {
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        keyId: RAZORPAY_CONFIG.key_id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        bookingId: bookingId
      }
    };

    console.log('✅ Create order response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// Verify payment signature
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      bookingId,
      amount 
    } = req.body;

    console.log('🔄 Verifying payment signature:', {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      bookingId,
      amount
    });

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, Payment ID, and Signature are required'
      });
    }

    // Create the signature verification string
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const signature = crypto
      .createHmac('sha256', RAZORPAY_CONFIG.key_secret)
      .update(text)
      .digest('hex');

    console.log('🔍 Signature verification:', {
      expected: signature,
      received: razorpaySignature,
      match: signature === razorpaySignature
    });

    // Verify signature
    if (signature === razorpaySignature) {
      console.log('✅ Payment signature verified successfully');

      // Update booking with payment details
      try {
        const updateQuery = `
          UPDATE booking_all_details_of_user_to_vendor 
          SET 
            payment_status = 'paid',
            payment_method = 'razorpay',
            razorpay_payment_id = $1,
            razorpay_order_id = $2,
            razorpay_signature = $3,
            payment_gateway = 'razorpay',
            payment_amount = $4,
            payment_currency = 'INR',
            payment_date_time = CURRENT_TIMESTAMP,
            booking_status = 'confirmed',
            updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = $5
          RETURNING id
        `;

        const result = await query(updateQuery, [
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          amount || 0,
          bookingId
        ]);

        if (result.rows.length > 0) {
          console.log(`✅ Payment verified and booking updated: ${bookingId}`);
        } else {
          console.log(`⚠️ Booking not found for payment verification: ${bookingId}`);
        }
      } catch (dbError) {
        console.error('❌ Database error in payment verification:', dbError.message);
        // Continue with response even if DB update fails
      }

      const responseData = {
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          signature: razorpaySignature,
          bookingId: bookingId,
          amount: amount,
          status: 'paid'
        }
      };

      console.log('✅ Payment verification response:', responseData);
      res.json(responseData);

    } else {
      console.error('❌ Payment signature verification failed');
      res.status(400).json({
        success: false,
        error: 'Payment signature verification failed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

// Get payment configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      keyId: RAZORPAY_CONFIG.key_id,
      currency: RAZORPAY_CONFIG.currency,
      companyName: RAZORPAY_CONFIG.company_name,
      description: RAZORPAY_CONFIG.description,
      theme: RAZORPAY_CONFIG.theme
    }
  });
});

// Mock payment endpoint
router.post('/mock-payment', async (req, res) => {
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

// Update booking payment status
router.post('/update-booking-payment', async (req, res) => {
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

// Get payment status for a booking
router.get('/status/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'BookingId is required'
      });
    }
    
    const statusQuery = `
      SELECT 
        booking_id,
        payment_status,
        payment_method,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        payment_gateway,
        payment_amount,
        payment_currency,
        payment_date_time,
        booking_status
      FROM booking_all_details_of_user_to_vendor
      WHERE booking_id = $1
    `;
    
    const result = await query(statusQuery, [bookingId]);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
      message: error.message
    });
  }
});

module.exports = router;
