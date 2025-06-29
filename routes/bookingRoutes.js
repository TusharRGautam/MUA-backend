const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { 
  sendBookingNotification, 
  sendMultiVendorBookingNotifications 
} = require('../services/vendorNotificationService');

// Use consistent database connection matching other files
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
});

// Track database availability
let isDatabaseAvailable = false;

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Database connection successful for booking routes');
    isDatabaseAvailable = true;
    client.release();
  })
  .catch(err => {
    console.log('⚠️  Database connection failed for booking routes:', err.message);
    console.log('📋 Booking routes will use fallback mode (in-memory storage)');
    isDatabaseAvailable = false;
  });

// In-memory fallback storage for when database is unavailable
const fallbackBookings = new Map();

const executeQuery = async (text, params) => {
  try {
    if (!isDatabaseAvailable) {
      throw new Error('Database not available');
    }
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Vendor Matching Algorithm
 * Finds vendors who provide services based on category matching
 */
const findMatchingVendors = async (serviceCategories) => {
  try {
    console.log('🔍 Finding vendors for service categories:', serviceCategories);
    
    if (!serviceCategories || !Array.isArray(serviceCategories) || serviceCategories.length === 0) {
      console.log('❌ No service categories provided for vendor matching');
      return [];
    }

    // Clean and normalize categories
    const cleanCategories = serviceCategories
      .filter(cat => cat && typeof cat === 'string')
      .map(cat => cat.toLowerCase().trim())
      .filter(cat => cat.length > 0);
      
    if (cleanCategories.length === 0) {
      console.log('❌ No valid service categories after cleaning');
      return [];
    }

    console.log('🧹 Cleaned categories:', cleanCategories);

    // Query to find vendors with matching categories
    const vendorMatchQuery = `
      WITH vendor_categories AS (
        SELECT 
          rsv.vendor_id,
          rsv.vendor_email,
          rsv.selected_categories,
          reg.person_name,
          reg.business_name,
          reg.phone_number,
          reg.business_email,
          reg.push_token,
          reg.verification_status
        FROM ready_services_vendors_data rsv
        JOIN registration_and_other_details reg ON rsv.vendor_id = reg.sr_no
        WHERE reg.verification_status = 'verified'
          AND reg.business_email IS NOT NULL
      )
      SELECT *
      FROM vendor_categories
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(
          CASE 
            WHEN selected_categories::text = 'null' THEN '[]'::jsonb
            WHEN selected_categories IS NULL THEN '[]'::jsonb
            ELSE selected_categories::jsonb
          END
        ) AS category
        WHERE LOWER(TRIM(category)) = ANY($1)
      )
      ORDER BY vendor_id
    `;

    const result = await executeQuery(vendorMatchQuery, [cleanCategories]);
    const matchingVendors = result.rows;

    console.log(`✅ Found ${matchingVendors.length} matching vendors`);
    
    // Log vendor details for debugging
    matchingVendors.forEach(vendor => {
      let categories = [];
      try {
        const categoriesData = vendor.selected_categories;
        if (typeof categoriesData === 'string') {
          categories = JSON.parse(categoriesData);
        } else if (Array.isArray(categoriesData)) {
          categories = categoriesData;
        }
      } catch (e) {
        console.warn(`Failed to parse categories for vendor ${vendor.vendor_id}:`, e.message);
      }
      
      console.log(`📋 Vendor ${vendor.vendor_id} (${vendor.person_name}): categories = ${categories.join(', ')}`);
    });

    return matchingVendors;
  } catch (error) {
    console.error('❌ Error in vendor matching algorithm:', error);
    return [];
  }
};

/**
 * Create booking with vendor matching
 */
const createBookingWithVendorMatching = async (bookingData) => {
  try {
    const { items, bookingId } = bookingData;
    
    // Extract service categories from booking items
    const serviceCategories = [];
    items.forEach(item => {
      if (item.category) {
        serviceCategories.push(item.category);
      }
    });

    console.log('🎯 Extracted service categories from booking:', serviceCategories);

    // Find matching vendors
    const matchingVendors = await findMatchingVendors(serviceCategories);
    
    if (matchingVendors.length === 0) {
      console.log('⚠️ No matching vendors found - creating booking without vendor assignment');
      return { success: true, vendorsNotified: 0, bookingId };
    }

    console.log(`✅ Found ${matchingVendors.length} matching vendors`);
    
    // ✅ NEW APPROACH: Don't assign to specific vendor initially
    // Instead, leave vendor_id as NULL and let all matching vendors see it via category filtering
    // Only assign vendor when someone accepts the booking
    
    // Update booking status to make it available for all matching vendors
    const updateBookingQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        booking_status = 'pending_vendor_acceptance',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $1
      RETURNING id
    `;

    const updateResult = await executeQuery(updateBookingQuery, [bookingId]);

    if (updateResult.rows.length === 0) {
      console.log('⚠️ Failed to update booking status');
      return { success: false, error: 'Failed to update booking status' };
    }

    // Send notifications to ALL matching vendors
    let vendorsNotified = 0;
    console.log('📱 Sending booking notifications to all matching vendors...');
    
    for (const vendor of matchingVendors) {
      try {
        await sendBookingNotification(vendor.vendor_id, {
          ...bookingData,
          vendorName: vendor.person_name || vendor.business_name
        });
        vendorsNotified++;
        console.log(`✅ Notified vendor: ${vendor.person_name} (ID: ${vendor.vendor_id})`);
      } catch (notificationError) {
        console.error(`❌ Failed to notify vendor ${vendor.vendor_id}:`, notificationError.message);
        // Continue with other vendors
      }
    }

    return {
      success: true,
      vendorsNotified,
      matchingVendors: matchingVendors.map(v => ({
        id: v.vendor_id,
        name: v.person_name || v.business_name,
        email: v.business_email,
        phone: v.phone_number
      })),
      bookingId
    };

  } catch (error) {
    console.error('❌ Error in createBookingWithVendorMatching:', error);
    return { success: false, error: error.message };
  }
};

// Function to get user by custom ID
async function getUserByCustomId(customUserId) {
  try {
    if (!isDatabaseAvailable) {
      // Return fallback user info
      return {
        user_id: 1,
        custom_user_id: customUserId,
        name: 'Guest User',
        email: '',
        phone_number: '',
        user_type: 'customer'
      };
    }
    
    const query = `
      SELECT sr_no as user_id, custom_user_id, person_name as name, business_email as email, phone_number, 'customer' as user_type 
      FROM registration_and_other_details 
      WHERE custom_user_id = $1
    `;
    const result = await executeQuery(query, [customUserId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by custom ID:', error);
    // Return fallback user info
    return {
      user_id: 1,
      custom_user_id: customUserId,
      name: 'Guest User',
      email: '',
      phone_number: '',
      user_type: 'customer'
    };
  }
}

/**
 * @route POST /api/bookings
 * @desc Create a new booking with automatic vendor matching
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
      deviceId,
      bookingId: providedBookingId
    } = req.body;

    console.log('🔄 Creating booking with automatic vendor matching:', {
      itemsCount: items.length,
      selectedDate,
      selectedTime,
      paymentMethod,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      userId,
      customUserId,
      databaseAvailable: isDatabaseAvailable
    });

    // Generate booking ID if not provided
    const bookingId = providedBookingId || `BK${Date.now()}`;
    
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

    if (isDatabaseAvailable) {
      try {
        // Save booking to database first
        await saveToDatabaseWithRetry({
          items,
          selectedDate,
          selectedTime,
          paymentMethod,
          totalAmount,
          customerName,
          customerEmail,
          customerPhone,
          address,
          finalUserId,
          finalCustomUserId,
          userInfo,
          bookingId
        });
        
        console.log(`✅ Successfully saved booking ${bookingId} to database`);
        
        // Now perform vendor matching and update booking
        console.log('🎯 Starting vendor matching process...');
        const vendorMatchingResult = await createBookingWithVendorMatching({
          items,
          selectedDate,
          selectedTime,
          paymentMethod,
          totalAmount,
          customerName,
          customerEmail,
          customerPhone,
          address,
          bookingId
        });

        if (vendorMatchingResult.success) {
          console.log(`✅ Vendor matching completed successfully`);
          console.log(`📱 ${vendorMatchingResult.vendorsNotified} vendor(s) notified`);
          
          return res.status(201).json({
            success: true,
            message: 'Booking created successfully with vendor matching',
            data: {
              bookingId: bookingId,
              customUserId: finalCustomUserId,
              userInfo: userInfo,
              vendorMatchingResult,
              storageMethod: 'database'
            }
          });
        } else {
          console.log('⚠️ Vendor matching failed, but booking was created');
          return res.status(201).json({
            success: true,
            message: 'Booking created successfully (vendor matching failed)',
            data: {
              bookingId: bookingId,
              customUserId: finalCustomUserId,
              userInfo: userInfo,
              vendorMatchingResult,
              storageMethod: 'database'
            }
          });
        }
        
      } catch (databaseError) {
        console.error('Database storage failed:', databaseError.message);
        isDatabaseAvailable = false;
        // Fall through to fallback storage
      }
    }

    // Fallback storage when database is not available
    console.log('📋 Using fallback storage for booking');
    const fallbackBookingData = {
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
      userId: finalUserId,
      customUserId: finalCustomUserId,
      userInfo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageMethod: 'fallback'
    };
    
    fallbackBookings.set(bookingId, fallbackBookingData);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully (fallback mode)',
      data: {
        bookingId: bookingId,
        customUserId: finalCustomUserId,
        userInfo: userInfo,
        storageMethod: 'fallback'
      }
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// Function to save to database with retry logic
async function saveToDatabaseWithRetry(bookingData) {
  const { items, selectedDate, selectedTime, paymentMethod, totalAmount, 
          customerName, customerEmail, customerPhone, address, 
          finalUserId, finalCustomUserId, userInfo, bookingId } = bookingData;

  // Check what columns exist in the table
  const columnCheckQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'booking_all_details_of_user_to_vendor'
  `;
  
  const columnResult = await executeQuery(columnCheckQuery, []);
  const availableColumns = columnResult.rows.map(row => row.column_name);
  
  console.log('📋 Available columns in booking table:', availableColumns);

  // Helper function to get or create vendor
  async function getOrCreateVendor(artistId, artistName) {
    try {
      // For service-provider or missing artistId, return fallback vendor ID
      if (artistId === 'service-provider' || !artistId) {
        console.log('🔧 Using fallback vendor ID for service-provider');
        return 1; // Simple fallback to vendor ID 1
      }
      
      // Try to parse as integer first
      const numericId = parseInt(artistId);
      if (!isNaN(numericId) && numericId > 0) {
        console.log(`🔧 Using numeric vendor ID: ${numericId}`);
        return numericId;
      }
      
      // For any other case, use fallback vendor ID
      console.log('🔧 Using fallback vendor ID for unknown artistId:', artistId);
      return 1; // Safe fallback
      
    } catch (error) {
      console.error('Error in getOrCreateVendor:', error.message);
      // Ultimate fallback
      return 1;
    }
  }

  // Create a single booking entry with all items combined
  const allVendorIds = [];
  const allVendorNames = [];
  const allServices = [];
  let totalBookingAmount = 0;

  // Process all items to collect vendor and service information
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const vendorId = await getOrCreateVendor(item.artistId, item.artistName);
    const vendorName = item.artistName || 'Service Provider';
    
    console.log(`📊 Processing booking item ${i + 1}:`, {
      service: item.name,
      vendor: vendorName,
      vendorId: vendorId,
      amount: item.price * item.quantity,
      customUserId: finalCustomUserId
    });

    // Collect unique vendors
    if (!allVendorIds.includes(vendorId)) {
      allVendorIds.push(vendorId);
      allVendorNames.push(vendorName);
    }
    
    // Add service details
    allServices.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      duration: item.duration,
      category: item.category,
      description: item.description,
      vendorId: vendorId,
      vendorName: vendorName
    });
    
    totalBookingAmount += (item.price * item.quantity) || 0;
  }

  // ✅ FIXED: Don't assign vendor initially - leave as NULL for all matching vendors to see
  // const primaryVendorId = allVendorIds[0] || 1;  // OLD: Assigned to specific vendor
  // const primaryVendorName = allVendorNames[0] || 'Service Provider';

  // Build INSERT query for single booking record
  const columnData = [];
  
  // Base required columns in order
  columnData.push(['user_id', finalUserId || 0]);
  columnData.push(['vendor_id', null]);  // ✅ FIXED: NULL instead of specific vendor
  columnData.push(['user_name', customerName || userInfo?.name || '']);
  columnData.push(['user_email', customerEmail || userInfo?.email || '']);
  columnData.push(['user_phone', customerPhone || userInfo?.phone_number || '']);
  columnData.push(['user_address', address || '']);
  columnData.push(['total_amount', totalBookingAmount]);
  columnData.push(['booking_status', 'pending_vendor_acceptance']);  // ✅ FIXED: Better status
  
  // Add optional columns only if they exist in the table
  if (availableColumns.includes('booking_id')) {
    columnData.push(['booking_id', bookingId]);
  }
    
    if (availableColumns.includes('vendor_name')) {
      columnData.push(['vendor_name', null]);  // ✅ FIXED: NULL until vendor accepts
    }
    
    if (availableColumns.includes('services_booked')) {
      columnData.push(['services_booked', JSON.stringify(allServices)]);
    }
    
    if (availableColumns.includes('final_amount')) {
      columnData.push(['final_amount', totalBookingAmount]);
    }
    
    if (availableColumns.includes('booking_date')) {
      columnData.push(['booking_date', selectedDate || null]);
    }
    
    if (availableColumns.includes('booking_time')) {
      columnData.push(['booking_time', selectedTime || null]);
    }
    
    if (availableColumns.includes('payment_method')) {
      columnData.push(['payment_method', paymentMethod || 'unknown']);
    }
    
    if (availableColumns.includes('service_category')) {
      // Use the category from the first service or 'General'
      const firstCategory = allServices.length > 0 ? allServices[0].category : 'General';
      columnData.push(['service_category', firstCategory || 'General']);
    }
    
    if (availableColumns.includes('custom_user_id')) {
      columnData.push(['custom_user_id', finalCustomUserId || null]);
    }
    
    if (availableColumns.includes('original_price')) {
      columnData.push(['original_price', totalBookingAmount]);
    }
    
    if (availableColumns.includes('vendor_email')) {
      columnData.push(['vendor_email', '']);
    }
    
    if (availableColumns.includes('booking_source')) {
      columnData.push(['booking_source', 'mobile_app']);
    }

    // Extract columns and values in consistent order
    const insertColumns = columnData.map(item => item[0]);
    const insertValues = columnData.map(item => item[1]);
    
    // Add timestamp columns
    insertColumns.push('created_at', 'updated_at');
    
    // Create placeholders for parameters (excluding timestamps)
    const parameterPlaceholders = insertValues.map((_, i) => `$${i + 1}`);
    const timestampPlaceholders = ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP'];
    const allPlaceholders = [...parameterPlaceholders, ...timestampPlaceholders];

    const insertQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        ${insertColumns.join(', ')}
      ) VALUES (
        ${allPlaceholders.join(', ')}
      ) RETURNING id
    `;

    // Use insertValues directly (no CURRENT_TIMESTAMP in parameters)
    const finalValues = insertValues;

    console.log(`📤 Executing single booking INSERT with ${finalValues.length} parameters for ${allServices.length} services`);

    // Execute single booking insertion
    const result = await executeQuery(insertQuery, finalValues);
    return [result];
}

/**
 * @route GET /api/bookings/:bookingId
 * @desc Get booking details by booking ID from database or fallback storage
 * @access Public
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (isDatabaseAvailable) {
      try {
        const selectQuery = `
          SELECT *, 
                 COALESCE(booking_status, 'pending') as booking_status,
                 service_type as service_name
          FROM booking_all_details_of_user_to_vendor 
          WHERE booking_id = $1 OR id = $2
          ORDER BY created_at DESC
        `;

        const result = await executeQuery(selectQuery, [bookingId, bookingId]);

        if (result.rows.length > 0) {
          return res.json({
            bookingId: bookingId,
            services: result.rows,
            storageMethod: 'database',
            note: 'Retrieved from booking_all_details_of_user_to_vendor table'
          });
        }
      } catch (dbError) {
        console.error('Database query failed, checking fallback storage:', dbError.message);
        isDatabaseAvailable = false;
      }
    }

    // Check fallback storage
    if (fallbackBookings.has(bookingId)) {
      const booking = fallbackBookings.get(bookingId);
      return res.json({
        bookingId: bookingId,
        services: [booking],
        storageMethod: 'fallback',
        note: 'Retrieved from fallback storage'
      });
    }

    res.status(404).json({ 
      error: 'Booking not found',
      bookingId: bookingId,
      searchedIn: isDatabaseAvailable ? 'database and fallback' : 'fallback only'
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
 * @route GET /api/bookings
 * @desc Get all bookings from database or fallback storage
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    let bookings = [];
    let storageMethod = 'unknown';

    if (isDatabaseAvailable) {
      try {
        const selectQuery = `
          SELECT *, 
                 COALESCE(booking_status, 'pending') as booking_status,
                 service_type as service_name
          FROM booking_all_details_of_user_to_vendor 
          ORDER BY created_at DESC 
          LIMIT 100
        `;

        const result = await executeQuery(selectQuery, []);
        bookings = result.rows;
        storageMethod = 'database';
      } catch (dbError) {
        console.error('Database query failed, using fallback storage:', dbError.message);
        isDatabaseAvailable = false;
      }
    }

    if (!isDatabaseAvailable) {
      // Get from fallback storage
      bookings = Array.from(fallbackBookings.values());
      storageMethod = 'fallback';
    }

    res.json({
      bookings: bookings,
      total: bookings.length,
      storageMethod: storageMethod,
      note: storageMethod === 'database' 
        ? 'Retrieved from booking_all_details_of_user_to_vendor table'
        : 'Retrieved from fallback storage'
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message 
    });
  }
});

/**
 * @route PUT /api/bookings/:bookingId/status
 * @desc Update booking status in database or fallback storage
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

    if (isDatabaseAvailable) {
      try {
        const updateQuery = `
          UPDATE booking_all_details_of_user_to_vendor 
          SET booking_status = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE booking_id = $2 OR id = $3
          RETURNING id
        `;

        const result = await executeQuery(updateQuery, [status, bookingId, bookingId]);

        if (result.rows.length > 0) {
          return res.json({
            message: 'Booking status updated successfully',
            bookingId: bookingId,
            newStatus: status,
            updatedRecords: result.rows.length,
            storageMethod: 'database'
          });
        }
      } catch (dbError) {
        console.error('Database update failed, trying fallback storage:', dbError.message);
        isDatabaseAvailable = false;
      }
    }

    // Check and update fallback storage
    if (fallbackBookings.has(bookingId)) {
      const booking = fallbackBookings.get(bookingId);
      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      fallbackBookings.set(bookingId, booking);

      return res.json({
        message: 'Booking status updated successfully (fallback mode)',
        bookingId: bookingId,
        newStatus: status,
        updatedRecords: 1,
        storageMethod: 'fallback'
      });
    }

    res.status(404).json({ 
      error: 'Booking not found',
      bookingId: bookingId 
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
 * @route PUT /api/bookings/:bookingId/vendor-response
 * @desc Handle vendor acceptance/rejection of booking requests
 * @access Public
 */
router.put('/:bookingId/vendor-response', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { vendorId, action, vendorNotes } = req.body;

    console.log(`🎯 Vendor ${vendorId} responding to booking ${bookingId} with action: ${action}`);

    if (!vendorId || !action) {
      return res.status(400).json({
        success: false,
        error: 'vendorId and action (accept/reject) are required'
      });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'action must be either "accept" or "reject"'
      });
    }

    if (isDatabaseAvailable) {
      try {
        // First, get the booking details
        const getBookingQuery = `
          SELECT * FROM booking_all_details_of_user_to_vendor 
          WHERE booking_id = $1 AND vendor_id = $2
        `;
        const bookingResult = await executeQuery(getBookingQuery, [bookingId, vendorId]);
        
        if (bookingResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Booking not found or not assigned to this vendor'
          });
        }

        const booking = bookingResult.rows[0];

        // Update booking status based on vendor response
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        const updateQuery = `
          UPDATE booking_all_details_of_user_to_vendor 
          SET 
            status = $1,
            vendor_notes = $2,
            vendor_response_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = $3 AND vendor_id = $4
          RETURNING *
        `;

        const updateResult = await executeQuery(updateQuery, [
          newStatus,
          vendorNotes || '',
          bookingId,
          vendorId
        ]);

        if (updateResult.rows.length === 0) {
          return res.status(500).json({
            success: false,
            error: 'Failed to update booking status'
          });
        }

        const updatedBooking = updateResult.rows[0];

        // If booking is rejected, we could implement logic to:
        // 1. Find alternative vendors
        // 2. Notify customer about rejection
        // 3. Put booking back into matching queue
        
        if (action === 'reject') {
          console.log(`❌ Booking ${bookingId} rejected by vendor ${vendorId}`);
          // TODO: Implement alternative vendor matching logic here
          // For now, just mark as rejected
        } else {
          console.log(`✅ Booking ${bookingId} accepted by vendor ${vendorId}`);
          
          // Sync accepted booking to vendor_bookings table for dashboard display
          try {
            const syncQuery = `
              INSERT INTO vendor_bookings (
                vendor_id, customer_name, service_name, service_type,
                date_time, booking_status, payment_status, contact_number,
                address, notes, booking_reference, service_amount,
                total_amount, payment_method, is_new, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              ON CONFLICT (booking_reference, vendor_id) DO UPDATE SET
                booking_status = EXCLUDED.booking_status,
                updated_at = CURRENT_TIMESTAMP
            `;

            // Extract service info
            let serviceName = 'Service';
            let serviceType = 'beauty';
            if (booking.services_booked) {
              try {
                const services = JSON.parse(booking.services_booked);
                if (services && services.length > 0) {
                  serviceName = services[0].name || 'Service';
                  serviceType = services[0].category || 'beauty';
                }
              } catch (e) {
                console.warn('Failed to parse services_booked:', e.message);
              }
            }

            // Combine date and time
            let dateTime;
            if (booking.booking_date && booking.booking_time) {
              dateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
            } else {
              dateTime = new Date(booking.created_at);
            }

            await executeQuery(syncQuery, [
              vendorId,
              booking.customer_name || booking.user_name || 'Customer',
              serviceName,
              serviceType,
              dateTime,
              'accepted',
              booking.payment_method ? 'paid' : 'pending',
              booking.customer_phone || booking.user_phone || '',
              booking.address || booking.user_address || '',
              vendorNotes || `Booking accepted at ${new Date().toISOString()}`,
              bookingId,
              booking.total_amount || 0,
              booking.final_amount || booking.total_amount || 0,
              booking.payment_method || 'cash',
              false, // is_new = false since vendor has already seen it
              booking.created_at,
              new Date()
            ]);

            console.log(`✅ Synced accepted booking to vendor_bookings table`);
          } catch (syncError) {
            console.error('❌ Failed to sync to vendor_bookings:', syncError.message);
            // Don't fail the acceptance if sync fails
          }
        }

        // TODO: Send notification to customer about vendor response
        // This could be implemented here using a customer notification service

        return res.json({
          success: true,
          message: `Booking ${action}ed successfully`,
          data: {
            bookingId,
            vendorId,
            action,
            newStatus,
            booking: updatedBooking
          }
        });

      } catch (dbError) {
        console.error('Database error in vendor response:', dbError.message);
        return res.status(500).json({
          success: false,
          error: 'Database error while processing vendor response'
        });
      }
    }

    // Fallback storage handling
    if (fallbackBookings.has(bookingId)) {
      const booking = fallbackBookings.get(bookingId);
      booking.status = action === 'accept' ? 'accepted' : 'rejected';
      booking.vendorNotes = vendorNotes || '';
      booking.vendorResponseTime = new Date().toISOString();
      booking.updatedAt = new Date().toISOString();
      
      fallbackBookings.set(bookingId, booking);
      
      return res.json({
        success: true,
        message: `Booking ${action}ed successfully (fallback mode)`,
        data: {
          bookingId,
          vendorId,
          action,
          newStatus: booking.status,
          booking
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });

  } catch (error) {
    console.error('❌ Error in vendor response handler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process vendor response',
      message: error.message
    });
  }
});

/**
 * @route GET /api/bookings/vendor/:vendorId/pending
 * @desc Get pending booking requests for a vendor
 * @access Public
 */
router.get('/vendor/:vendorId/pending', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`📋 Fetching pending bookings for vendor ${vendorId}`);

    if (isDatabaseAvailable) {
      try {
        const query = `
          SELECT 
            booking_id,
            customer_name,
            customer_email, 
            customer_phone,
            services_booked,
            total_amount,
            booking_date,
            booking_time,
            address,
            created_at,
            status
          FROM booking_all_details_of_user_to_vendor 
          WHERE vendor_id = $1 
            AND status = 'pending_vendor_acceptance'
          ORDER BY created_at DESC
          LIMIT $2
        `;

        const result = await executeQuery(query, [vendorId, limit]);
        
        return res.json({
          success: true,
          pendingBookings: result.rows,
          count: result.rows.length
        });

      } catch (dbError) {
        console.error('Database error fetching pending bookings:', dbError.message);
        // Fall through to fallback
      }
    }

    // Fallback storage handling
    const pendingBookings = Array.from(fallbackBookings.values())
      .filter(booking => 
        booking.vendorId == vendorId && 
        booking.status === 'pending_vendor_acceptance'
      )
      .slice(0, limit);

    res.json({
      success: true,
      pendingBookings,
      count: pendingBookings.length,
      storageMethod: 'fallback'
    });

  } catch (error) {
    console.error('❌ Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending bookings',
      message: error.message
    });
  }
});

module.exports = router; 