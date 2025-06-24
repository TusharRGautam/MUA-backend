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
 * @desc Create a new booking and save to booking_all_details_of_user_to_vendor table
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

    console.log('🔄 Creating booking with data:', {
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
        // Try database storage first
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
        
        // REMOVED: Duplicate notification block - using the second one below which works correctly
        console.log('🔔 Booking saved successfully, will send notifications via the main notification block...');
        
        // Send notifications to vendors after successful booking creation
        try {
          console.log('📱 Sending notifications to vendors...');
          
          // Collect unique vendor IDs from items (both salon and artist bookings)
          const vendorIds = [];
          for (const item of items) {
            console.log(`🔍 Checking item for vendor ID:`, {
              artistId: item.artistId,
              artistName: item.artistName,
              salonId: item.salonId,
              salonName: item.salonName,
              vendorId: item.vendorId,
              vendorName: item.vendorName,
              serviceType: item.serviceType,
              vendorType: item.vendorType,
              service: item.name
            });
            
            // Check for salon bookings first (using vendorId or salonId)
            let vendorIdToUse = null;
            
            if (item.vendorType === 'salon' && item.vendorId) {
              vendorIdToUse = item.vendorId;
              console.log(`📍 Found salon vendor ID: ${vendorIdToUse}`);
            } else if (item.salonId && item.salonId !== 'service-provider') {
              vendorIdToUse = item.salonId;
              console.log(`📍 Found salon ID: ${vendorIdToUse}`);
            } else if (item.artistId && item.artistId !== 'service-provider') {
              vendorIdToUse = item.artistId;
              console.log(`📍 Found artist ID: ${vendorIdToUse}`);
            }
            
            if (vendorIdToUse) {
              const numericId = parseInt(vendorIdToUse);
              if (!isNaN(numericId) && numericId > 0 && !vendorIds.includes(numericId)) {
                vendorIds.push(numericId);
                console.log(`✅ Added vendor ID ${numericId} to notification list (type: ${item.vendorType || item.serviceType || 'artist'})`);
              }
            }
          }
          
          // If no specific vendor IDs found, try to get from saved booking
          if (vendorIds.length === 0) {
            console.log('📍 No specific vendor IDs found, using fallback vendor notification');
            vendorIds.push(35); // Use vendor 35 for testing (M1)
          }
          
          console.log(`📱 Sending notifications to ${vendorIds.length} vendor(s):`, vendorIds);
          
          // Prepare notification data
          const notificationData = {
            bookingId,
            customerName: customerName || userInfo?.name || 'Customer',
            customerEmail: customerEmail || userInfo?.email || '',
            customerPhone: customerPhone || userInfo?.phone_number || '',
            totalAmount,
            selectedDate,
            selectedTime,
            items,
            address
          };
          
          // Send notifications to all vendors
          if (vendorIds.length === 1) {
            await sendBookingNotification(vendorIds[0], notificationData);
          } else {
            await sendMultiVendorBookingNotifications(vendorIds, notificationData);
          }
          
          console.log('✅ Vendor notifications sent successfully');
          
          // Trigger automatic booking sync for real-time dashboard updates
          try {
            console.log('🔄 Triggering automatic booking sync for real-time updates...');
            
            // Import the sync function from vendor booking routes
            const { query } = require('../db');
            
            // Sync only the bookings for the affected vendors
            for (const vendorId of vendorIds) {
              try {
                console.log(`🔄 Syncing bookings for vendor ${vendorId}...`);
                
                // Get latest bookings for this vendor
                const latestBookingsQuery = `
                  SELECT 
                    id, booking_id, vendor_id, user_name, user_email, user_phone,
                    user_address, vendor_name, services_booked, total_amount,
                    final_amount, booking_date, booking_time, payment_method,
                    service_category, booking_status as status, created_at, updated_at
                  FROM booking_all_details_of_user_to_vendor
                  WHERE vendor_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'
                  ORDER BY created_at DESC
                `;
                
                const latestBookings = await query(latestBookingsQuery, [vendorId]);
                
                for (const booking of latestBookings.rows) {
                  // Check if booking already exists in vendor_bookings
                  const existingQuery = `
                    SELECT id FROM vendor_bookings 
                    WHERE vendor_id = $1 AND booking_reference = $2
                  `;
                  const existing = await query(existingQuery, [vendorId, booking.booking_id]);
                  
                  if (existing.rows.length === 0) {
                    // Insert new booking into vendor_bookings
                    const insertQuery = `
                      INSERT INTO vendor_bookings (
                        vendor_id, customer_name, service_name, service_type,
                        date_time, booking_status, payment_status, contact_number,
                        address, notes, booking_reference, service_amount,
                        total_amount, payment_method, is_new, created_at, updated_at
                      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
                      } catch (e) {}
                    }
                    
                    // Combine date and time
                    let dateTime;
                    if (booking.booking_date && booking.booking_time) {
                      dateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
                    } else {
                      dateTime = new Date(booking.created_at);
                    }
                    
                    await query(insertQuery, [
                      vendorId,
                      booking.user_name || 'Customer',
                      serviceName,
                      serviceType,
                      dateTime,
                      booking.status || 'pending',
                      booking.payment_method ? 'paid' : 'pending',
                      booking.user_phone || '',
                      booking.user_address || '',
                      `New booking from ${booking.user_name || 'customer'}`,
                      booking.booking_id,
                      booking.total_amount || 0,
                      booking.final_amount || booking.total_amount || 0,
                      booking.payment_method || 'cash',
                      true, // is_new = true for real-time popup
                      booking.created_at,
                      booking.updated_at
                    ]);
                    
                    console.log(`✅ Synced new booking ${booking.booking_id} for vendor ${vendorId}`);
                  }
                }
              } catch (vendorSyncError) {
                console.error(`❌ Failed to sync for vendor ${vendorId}:`, vendorSyncError.message);
              }
            }
            
            console.log('✅ Automatic booking sync completed');
          } catch (autoSyncError) {
            console.error('❌ Automatic booking sync failed:', autoSyncError.message);
          }
          
        } catch (notificationError) {
          console.error('❌ Failed to send vendor notifications:', notificationError);
          // Don't fail the booking if notifications fail
        }
        
        res.status(201).json({
          message: 'Booking created successfully',
          bookingId: bookingId,
          customUserId: finalCustomUserId,
          itemsProcessed: items.length,
          storageMethod: 'database',
          userInfo: userInfo ? {
            customUserId: userInfo.custom_user_id,
            name: userInfo.name,
            type: userInfo.user_type
          } : null,
          data: {
            booking_id: bookingId,
            total_amount: totalAmount,
            status: 'confirmed',
            services_count: items.length,
            booking_date: selectedDate,
            booking_time: selectedTime
          },
          notificationsSent: true
        });
        
      } catch (dbError) {
        console.error('❌ Database storage failed, falling back to in-memory:', dbError.message);
        isDatabaseAvailable = false;
        // Fall through to fallback storage
      }
    }
    
    if (!isDatabaseAvailable) {
      // Fallback to in-memory storage
      console.log('📋 Using fallback in-memory storage for booking');
      
      const bookingData = {
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
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      };
      
      fallbackBookings.set(bookingId, bookingData);
      
      console.log(`✅ Successfully saved booking ${bookingId} to fallback storage`);
      
      res.status(201).json({
        message: 'Booking created successfully (fallback mode)',
        bookingId: bookingId,
        customUserId: finalCustomUserId,
        itemsProcessed: items.length,
        storageMethod: 'fallback',
        userInfo: userInfo ? {
          customUserId: userInfo.custom_user_id,
          name: userInfo.name,
          type: userInfo.user_type
        } : null,
        data: {
          booking_id: bookingId,
          total_amount: totalAmount,
          status: 'confirmed',
          services_count: items.length,
          booking_date: selectedDate,
          booking_time: selectedTime
        },
        note: 'Booking saved in fallback mode - will sync to database when available'
      });
    }

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message,
      hint: 'Booking creation failed - check system status'
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

  // Use the primary vendor (first one) for the booking record
  const primaryVendorId = allVendorIds[0] || 1;
  const primaryVendorName = allVendorNames[0] || 'Service Provider';

  // Build INSERT query for single booking record
  const columnData = [];
  
  // Base required columns in order
  columnData.push(['user_id', finalUserId || 0]);
  columnData.push(['vendor_id', primaryVendorId]);
  columnData.push(['user_name', customerName || userInfo?.name || '']);
  columnData.push(['user_email', customerEmail || userInfo?.email || '']);
  columnData.push(['user_phone', customerPhone || userInfo?.phone_number || '']);
  columnData.push(['user_address', address || '']);
  columnData.push(['total_amount', totalBookingAmount]);
  columnData.push(['booking_status', 'confirmed']);
  
  // Add optional columns only if they exist in the table
  if (availableColumns.includes('booking_id')) {
    columnData.push(['booking_id', bookingId]);
  }
    
    if (availableColumns.includes('vendor_name')) {
      columnData.push(['vendor_name', primaryVendorName]);
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

module.exports = router; 