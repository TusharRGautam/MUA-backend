const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mua_backend_db',
  user: 'postgres',
  password: 'club0101',
});

const executeQuery = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Simple function to get user by custom ID
async function getUserByCustomId(customUserId) {
  try {
    const query = `
      SELECT internal_id as user_id, custom_user_id, name, email, phone_number, user_type 
      FROM registration_and_other_details 
      WHERE custom_user_id = $1
    `;
    const result = await executeQuery(query, [customUserId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by custom ID:', error);
    return null;
  }
}

/**
 * @route POST /api/bookings
 * @desc Create a new booking (simplified version)
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const {
      items = [],
      selectedDate,
      selectedTime,
      paymentMethod,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      address = '',
      userId,
      customUserId,
      deviceId
    } = req.body;

    console.log('Creating booking with simplified data:', {
      itemsCount: items.length,
      selectedDate,
      selectedTime,
      paymentMethod,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      userId,
      customUserId
    });

    // Generate booking ID
    const bookingId = `BK${Date.now()}`;
    
    // Get user info if customUserId is provided
    let userInfo = null;
    let finalUserId = userId;
    let finalCustomUserId = customUserId;
    
    if (customUserId) {
      userInfo = await getUserByCustomId(customUserId);
      if (userInfo) {
        console.log('📋 Found user info for custom ID:', userInfo);
        finalUserId = userInfo.user_id;
        finalCustomUserId = userInfo.custom_user_id;
      }
    }

    // Create booking entries using only basic columns
    const bookingPromises = items.map((item, index) => {
      const insertData = {
        user_id: finalUserId || 0,
        vendor_id: parseInt(item.artistId) || 0,
        service_name: item.name || 'Unknown Service',
        service_type: item.serviceType || 'service',
        customer_name: customerName || userInfo?.name || '',
        customer_email: customerEmail || userInfo?.email || '',
        customer_phone: customerPhone || userInfo?.phone_number || '',
        address: address || '',
        total_amount: (item.price * item.quantity) || 0,
        status: 'confirmed'
      };

      // Simple INSERT using only basic columns that exist
      const insertQuery = `
        INSERT INTO booking_all_details_of_user_to_vendor (
          user_id, vendor_id, service_name, service_type,
          customer_name, customer_email, customer_phone, 
          address, total_amount, status, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `;

      const insertValues = [
        insertData.user_id,
        insertData.vendor_id,
        insertData.service_name,
        insertData.service_type,
        insertData.customer_name,
        insertData.customer_email,
        insertData.customer_phone,
        insertData.address,
        insertData.total_amount,
        insertData.status
      ];

      console.log(`📊 Inserting booking item ${index + 1} (simplified):`, {
        service: insertData.service_name,
        customer: insertData.customer_name,
        amount: insertData.total_amount,
        customUserId: finalCustomUserId
      });

      return executeQuery(insertQuery, insertValues);
    });

    // Execute all booking insertions
    const results = await Promise.all(bookingPromises);
    
    console.log(`✅ Successfully created ${results.length} booking records (simplified) for booking ID: ${bookingId}`);
    
    res.status(201).json({
      message: 'Booking created successfully (simplified)',
      bookingId: bookingId,
      customUserId: finalCustomUserId,
      itemsProcessed: results.length,
      userInfo: userInfo ? {
        customUserId: userInfo.custom_user_id,
        name: userInfo.name,
        type: userInfo.user_type
      } : null,
      data: {
        booking_id: bookingId,
        total_amount: totalAmount,
        status: 'confirmed',
        services_count: items.length
      },
      note: 'Using simplified table structure - upgrade database to use full features'
    });

  } catch (error) {
    console.error('❌ Error creating simplified booking:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message,
      hint: 'Using simplified booking structure - check basic table columns'
    });
  }
});

/**
 * @route GET /api/bookings/simple/:bookingId
 * @desc Get booking details by booking ID (simplified)
 * @access Public
 */
router.get('/simple/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const selectQuery = `
      SELECT * FROM booking_all_details_of_user_to_vendor 
      WHERE id = $1 OR customer_name LIKE $2
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(selectQuery, [bookingId, `%${bookingId}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      bookingId: bookingId,
      services: result.rows,
      note: 'Using simplified table structure'
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      error: 'Failed to fetch booking',
      details: error.message 
    });
  }
});

module.exports = router; 