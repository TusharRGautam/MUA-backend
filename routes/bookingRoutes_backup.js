const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

console.log('🚀 Booking routes module loaded successfully');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

// Helper function to execute queries
const executeQuery = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Helper function to lookup user by custom_user_id
 */
async function getUserByCustomId(customUserId) {
  try {
    const result = await executeQuery(`
      SELECT custom_user_id, user_type, name, email, phone_number, internal_id
      FROM user_lookup 
      WHERE custom_user_id = $1
    `, [customUserId]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error looking up user by custom ID:', error);
    return null;
  }
}

/**
 * @route POST /api/bookings
 * @desc Create a new booking with support for custom user IDs
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const { 
      bookingId,
      items,
      selectedDate,
      selectedTime,
      paymentMethod,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      address,
      userId,
      customUserId, // Support for new custom user ID
      deviceId 
    } = req.body;

    console.log('📝 Creating booking with data:', {
      bookingId,
      itemsCount: items?.length || 0,
      selectedDate,
      selectedTime,
      paymentMethod,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      userId,
      customUserId,
      hasAddress: !!address
    });

    // Validate required fields
    if (!bookingId || !items || !selectedDate || !selectedTime) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, items, selectedDate, selectedTime'
      });
    }

    let userInfo = null;
    let finalUserId = userId;
    let finalCustomUserId = customUserId;

    // If custom_user_id is provided, lookup user information
    if (customUserId) {
      userInfo = await getUserByCustomId(customUserId);
      if (userInfo) {
        console.log('📋 Found user info for custom ID:', userInfo);
        finalUserId = userInfo.internal_id;
      } else {
        console.log('⚠️ Custom user ID not found, treating as guest booking');
      }
    }

    // Auto-fix database structure if needed
    try {
      console.log('🔧 Auto-fixing database structure...');
      
      // Make user_id nullable for guest bookings
      await executeQuery(`
        ALTER TABLE booking_all_details_of_user_to_vendor 
        ALTER COLUMN user_id DROP NOT NULL
      `);
      
      // Add missing columns if they don't exist
      const columnsToAdd = [
        { name: 'user_city', type: 'VARCHAR(100)' },
        { name: 'user_device_id', type: 'VARCHAR(255)' },
        { name: 'user_postal_code', type: 'VARCHAR(20)' },
        { name: 'custom_user_id', type: 'VARCHAR(10)' }
      ];
      
      for (const column of columnsToAdd) {
        await executeQuery(`
          ALTER TABLE booking_all_details_of_user_to_vendor 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
      }
      
      console.log('✅ Database structure auto-fix completed');
      
    } catch (autoFixError) {
      console.log('ℹ️ Auto-fix not needed or already applied:', autoFixError.message);
    }

    // Process each booking item
    const bookingPromises = items.map(async (item, index) => {
      // Determine user information priority: userInfo > provided data > defaults
      const bookingUserName = userInfo?.name || customerName || 'Guest User';
      const bookingUserEmail = userInfo?.email || customerEmail || '';
      const bookingUserPhone = userInfo?.phone_number || customerPhone || '';
      
      const insertData = {
        booking_id: bookingId,
        user_id: finalUserId || null, // Allow null for guest bookings
        custom_user_id: finalCustomUserId || null,
        vendor_id: item.artistId || item.salonId || null,
        service_name: item.name,
        service_type: item.category || item.serviceType || 'beauty',
        
        // User information with fallbacks
        user_name: bookingUserName,
        user_email: bookingUserEmail,
        user_phone: bookingUserPhone,
        user_address: address || '',
        user_city: '', // Extract from address if needed
        user_postal_code: '', // Extract from address if needed
        user_device_id: deviceId || null,
        
        // Vendor information
        vendor_name: item.artistName || item.salonName || '',
        
        // Service details
        services_booked: JSON.stringify([{
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          duration: item.duration,
          category: item.category
        }]),
        
        // Booking details
        booking_date: selectedDate,
        booking_time: selectedTime,
        payment_method: paymentMethod,
        total_amount: item.price * item.quantity,
        final_amount: totalAmount,
        
        status: 'confirmed'
      };

      // Try standardized column names first, fall back to legacy if needed
      const insertQuery = `
        INSERT INTO booking_all_details_of_user_to_vendor (
          booking_id, user_id, custom_user_id, vendor_id, service_name, service_type,
          user_name, user_email, user_phone, user_address, user_city, user_postal_code, user_device_id,
          vendor_name, services_booked, booking_date, booking_time, payment_method,
          total_amount, final_amount, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `;

      const insertValues = [
        insertData.booking_id,
        insertData.user_id,
        insertData.custom_user_id,
        insertData.vendor_id,
        insertData.service_name,
        insertData.service_type,
        insertData.user_name,
        insertData.user_email,
        insertData.user_phone,
        insertData.user_address,
        insertData.user_city,
        insertData.user_postal_code,
        insertData.user_device_id,
        insertData.vendor_name,
        insertData.services_booked,
        insertData.booking_date,
        insertData.booking_time,
        insertData.payment_method,
        insertData.total_amount,
        insertData.final_amount,
        insertData.status
      ];

      console.log(`📊 Inserting booking item ${index + 1}:`, {
        service: insertData.service_name,
        user: insertData.user_name,
        vendor: insertData.vendor_name,
        amount: insertData.total_amount,
        customUserId: insertData.custom_user_id
      });

      return executeQuery(insertQuery, insertValues);
    });

    // Execute all booking insertions
    const results = await Promise.all(bookingPromises);
    
    console.log(`✅ Successfully created ${results.length} booking records for booking ID: ${bookingId}`);
    
    res.status(201).json({
      message: 'Booking created successfully',
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
      }
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message,
      hint: 'Check if all required fields are provided and database is accessible'
    });
  }
});

/**
 * @route GET /api/bookings/:bookingId
 * @desc Get booking details by booking ID
 * @access Public
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const selectQuery = `
      SELECT * FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(selectQuery, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      bookingId: bookingId,
      services: result.rows
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      error: 'Failed to fetch booking',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/bookings/user/:userId
 * @desc Get all bookings for a specific user
 * @access Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let selectQuery = `
      SELECT * FROM booking_all_details_of_user_to_vendor 
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];

    if (status && status !== 'all') {
      selectQuery += ' AND status = $2';
      queryParams.push(status);
    }

    selectQuery += ' ORDER BY created_at DESC';

    const result = await executeQuery(selectQuery, queryParams);

    res.json({
      userId: userId,
      bookings: result.rows
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user bookings',
      details: error.message 
    });
  }
});

/**
 * @route PUT /api/bookings/:bookingId/status
 * @desc Update booking status
 * @access Public
 */
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required',
        validStatuses: validStatuses 
      });
    }

    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
      RETURNING *
    `;

    const result = await executeQuery(updateQuery, [status, bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated successfully',
      updatedRecords: result.rows.length,
      bookings: result.rows
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      error: 'Failed to update booking status',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/bookings
 * @desc Get all bookings with optional filters
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { status, vendorId, limit = 50, offset = 0 } = req.query;

    let selectQuery = 'SELECT * FROM booking_all_details_of_user_to_vendor WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      selectQuery += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    if (vendorId) {
      paramCount++;
      selectQuery += ` AND vendor_id = $${paramCount}`;
      queryParams.push(vendorId);
    }

    selectQuery += ' ORDER BY created_at DESC';

    if (limit) {
      paramCount++;
      selectQuery += ` LIMIT $${paramCount}`;
      queryParams.push(limit);
    }

    if (offset) {
      paramCount++;
      selectQuery += ` OFFSET $${paramCount}`;
      queryParams.push(offset);
    }

    const result = await executeQuery(selectQuery, queryParams);

    res.json({
      bookings: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message 
    });
  }
});

// Helper function to add one hour to time string
function addOneHour(timeString) {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setHours(date.getHours() + 1);
    
    return date.toTimeString().slice(0, 5); // Returns HH:MM format
  } catch (error) {
    console.error('Error adding hour to time:', error);
    return timeString; // Return original if parsing fails
  }
}

module.exports = router; 