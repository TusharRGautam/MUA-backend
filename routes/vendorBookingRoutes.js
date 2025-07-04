/**
 * Vendor Booking Routes
 * Handles syncing booking data from booking_all_details_of_user_to_vendor to vendor dashboard
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { 
  sendBookingStatusNotification, 
  getVendorNotifications, 
  markNotificationAsRead 
} = require('../services/vendorNotificationService');

/**
 * @route GET /api/vendor/bookings/sync
 * @desc Sync bookings from booking_all_details_of_user_to_vendor to vendor_bookings
 * @access Public (for now)
 */
router.get('/sync', async (req, res) => {
  try {
    console.log('🔄 Starting booking sync process...');
    
    // Get all bookings from booking_all_details_of_user_to_vendor
    const getAllBookingsQuery = `
      SELECT 
        id,
        booking_id,
        vendor_id,
        user_name,
        user_email,
        user_phone,
        user_address,
        vendor_name,
        services_booked,
        total_amount,
        final_amount,
        booking_date,
        booking_time,
        payment_method,
        service_category,
        booking_status as status,
        created_at,
        updated_at
      FROM booking_all_details_of_user_to_vendor
      WHERE vendor_id IS NOT NULL
      ORDER BY created_at DESC
    `;
    
    const allBookings = await query(getAllBookingsQuery);
    
    console.log(`📊 Found ${allBookings.rows.length} bookings to process`);
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    // Process each booking
    for (const booking of allBookings.rows) {
      try {
        // Check if booking already exists in vendor_bookings
        const existingBookingQuery = `
          SELECT id FROM vendor_bookings 
          WHERE vendor_id = $1 AND (
            booking_reference = $2 OR 
            (customer_name = $3 AND date_time::date = $4)
          )
        `;
        
        const bookingDate = booking.booking_date || booking.created_at;
        const bookingTime = booking.booking_time || '10:00';
        
        // Combine date and time for datetime field
        let dateTime;
        if (booking.booking_date && booking.booking_time) {
          dateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        } else {
          dateTime = new Date(booking.created_at);
        }
        
        const existingBooking = await query(existingBookingQuery, [
          booking.vendor_id,
          booking.booking_id,
          booking.user_name,
          bookingDate
        ]);
        
        if (existingBooking.rows.length === 0) {
          // Create new booking in vendor_bookings
          const insertQuery = `
            INSERT INTO vendor_bookings (
              vendor_id,
              customer_name,
              service_name,
              service_type,
              date_time,
              booking_status,
              payment_status,
              contact_number,
              address,
              notes,
              booking_reference,
              service_amount,
              total_amount,
              payment_method,
              is_new,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `;
          
          // Extract service info from services_booked JSON
          let serviceName = 'Service';
          let serviceType = 'beauty';
          
          if (booking.services_booked) {
            try {
              const services = JSON.parse(booking.services_booked);
              if (services && services.length > 0) {
                serviceName = services[0].name || 'Service';
                serviceType = services[0].category || 'beauty';
              }
            } catch (parseError) {
              console.log('Failed to parse services_booked JSON:', parseError);
            }
          }
          
          const paymentStatus = booking.payment_method ? 'paid' : 'pending';
          const bookingStatus = booking.status || 'pending';
          
          await query(insertQuery, [
            booking.vendor_id,
            booking.user_name || 'Customer',
            serviceName,
            serviceType,
            dateTime,
            bookingStatus,
            paymentStatus,
            booking.user_phone || '',
            booking.user_address || '',
            `Booking from ${booking.user_name || 'customer'} - Amount: ₹${booking.total_amount || 0}`,
            booking.booking_id,
            booking.total_amount || 0,
            booking.final_amount || booking.total_amount || 0,
            booking.payment_method || 'cash',
            true, // is_new
            booking.created_at,
            booking.updated_at
          ]);
          
          syncedCount++;
          console.log(`✅ Synced booking ${booking.booking_id} for vendor ${booking.vendor_id}`);
          
        } else {
          // Update existing booking if needed
          const updateQuery = `
            UPDATE vendor_bookings 
            SET 
              booking_status = $1,
              total_amount = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
          
          const existingId = existingBooking.rows[0].id;
          await query(updateQuery, [
            booking.status || 'pending',
            booking.total_amount || 0,
            existingId
          ]);
          
          updatedCount++;
          console.log(`🔄 Updated booking ${booking.booking_id}`);
        }
        
      } catch (bookingError) {
        console.error(`❌ Error processing booking ${booking.booking_id}:`, bookingError);
      }
    }
    
    console.log(`✅ Sync completed: ${syncedCount} new, ${updatedCount} updated`);
    
    res.json({
      success: true,
      message: 'Booking sync completed successfully',
      stats: {
        totalProcessed: allBookings.rows.length,
        newBookings: syncedCount,
        updatedBookings: updatedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error in booking sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync bookings',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/bookings/filtered/:vendorId
 * @desc Get vendor bookings filtered by category matching and vendor eligibility
 * @access Public
 */
router.get('/filtered/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { vendorEmail, status, limit = 50, offset = 0, business_type, debug } = req.query;

    console.log(`📋 Fetching category-filtered bookings for vendor ${vendorId} (${vendorEmail})`);

    // STEP 1: Check vendor eligibility (business_type = 'solo' AND service_setup_type = 'ready')
    const vendorEligibilityQuery = `
      SELECT 
        r.sr_no,
        r.business_type,
        r.person_name,
        r.business_email,
        rsv.service_setup_type,
        rsv.selected_categories
      FROM registration_and_other_details r
      LEFT JOIN ready_services_vendors_data rsv ON r.business_email = rsv.vendor_email
      WHERE r.sr_no = $1 OR r.business_email = $2
    `;
    
    const vendorEligibilityResult = await query(vendorEligibilityQuery, [vendorId, vendorEmail]);
    
    if (vendorEligibilityResult.rows.length === 0) {
      console.log(`⚠️ Vendor not found: ${vendorId} (${vendorEmail})`);
      return res.json({
        success: true,
        bookings: [],
        message: 'Vendor not found in the system'
      });
    }

    const vendor = vendorEligibilityResult.rows[0];
    
    // Check business_type eligibility
    if (vendor.business_type !== 'solo') {
      console.log(`⚠️ Vendor ${vendorEmail} has business_type '${vendor.business_type}', not eligible for Our Services bookings`);
      return res.json({
        success: true,
        bookings: [],
        message: 'Only solo business type vendors are eligible for Our Services bookings'
      });
    }

    // Check service_setup_type eligibility
    if (!vendor.service_setup_type || vendor.service_setup_type !== 'ready') {
      console.log(`⚠️ Vendor ${vendorEmail} has service_setup_type '${vendor.service_setup_type || 'none'}', not eligible for Our Services bookings`);
      return res.json({
        success: true,
        bookings: [],
        message: 'Only vendors with ready service setup are eligible for Our Services bookings'
      });
    }

    const vendorCategories = vendor.selected_categories || [];
    console.log(`✅ Vendor ${vendorEmail} is eligible - business_type: solo, service_setup_type: ready`);
    console.log(`🏷️ Vendor categories:`, vendorCategories);

    if (vendorCategories.length === 0) {
      console.log(`⚠️ No categories selected for vendor ${vendorEmail}`);
      return res.json({
        success: true,
        bookings: [],
        message: 'No service categories configured for this vendor'
      });
    }

    // Convert categories to lowercase for matching
    const normalizedVendorCategories = vendorCategories.map(cat => cat.toLowerCase());

    // STEP 2: Build optimized query for booking visibility rules
    let bookingsQuery = `
      SELECT 
        id,
        booking_id,
        booking_reference,
        user_name as customer_name,
        user_email,
        user_phone as contact_number,
        user_address as address,
        vendor_id,
        vendor_name,
        vendor_email,
        vendor_phone_number,
        services_booked,
        service_category,
        total_amount,
        final_amount,
        booking_date,
        booking_time,
        booking_status,
        payment_status,
        payment_method,
        booking_notes as notes,
        created_at,
        updated_at,
        CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN true ELSE false END as is_new
      FROM booking_all_details_of_user_to_vendor
      WHERE (
        -- Show new/pending bookings that haven't been accepted by any vendor
        (booking_status IN ('pending', 'requested') AND vendor_id IS NULL)
        OR
        -- Show bookings specifically accepted by this vendor
        (booking_status = 'accepted' AND vendor_id = $1)
        OR
        -- Show other status bookings (completed, denied, etc.) for this vendor
        (booking_status NOT IN ('pending', 'requested', 'accepted') AND vendor_id = $1)
      )
    `;
    
    const queryParams = [parseInt(vendorId)];
    let paramCount = 1;
    
    // Add status filter if provided
    if (status && status !== 'all') {
      paramCount++;
      bookingsQuery += ` AND booking_status = $${paramCount}`;
      queryParams.push(status);
    }

    bookingsQuery += ` ORDER BY 
      CASE 
        WHEN booking_status = 'pending' THEN 1
        WHEN booking_status = 'accepted' AND vendor_id = $1 THEN 2
        ELSE 3
      END,
      created_at DESC 
      LIMIT ${limit} OFFSET ${offset}`;

    console.log(`🔍 Executing booking query with vendor eligibility filters...`);
    const bookingsResult = await query(bookingsQuery, queryParams);

    // STEP 3: Filter bookings by category matching
    const filteredBookings = bookingsResult.rows.filter(booking => {
      // Parse service_category properly - it might be stored as JSON string or array
      let serviceCategories = booking.service_category || [];
      
      // Handle different formats: string, JSON string, or array
      if (typeof serviceCategories === 'string') {
        try {
          serviceCategories = JSON.parse(serviceCategories);
        } catch (e) {
          // If JSON parsing fails, treat as single category
          serviceCategories = [serviceCategories];
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(serviceCategories)) {
        serviceCategories = [serviceCategories];
      }
      
      const normalizedServiceCategories = serviceCategories.map(cat => 
        typeof cat === 'string' ? cat.toLowerCase() : String(cat).toLowerCase()
      );
      
      // Check if any service category matches vendor's categories
      const hasMatchingCategory = normalizedServiceCategories.some(serviceCat =>
        normalizedVendorCategories.includes(serviceCat)
      );
      
      if (!hasMatchingCategory) {
        if (debug) {
          console.log(`🔍 Booking ${booking.booking_id}: service categories [${normalizedServiceCategories.join(', ')}] vs vendor categories [${normalizedVendorCategories.join(', ')}] = NO MATCH`);
        }
        return false; // Skip if categories don't match
      }
      
      if (debug) {
        console.log(`🔍 Booking ${booking.booking_id}: service categories [${normalizedServiceCategories.join(', ')}] vs vendor categories [${normalizedVendorCategories.join(', ')}] = MATCH`);
      }
      
      return true; // Show if matches categories
    });

    // STEP 4: Format bookings for display
    const formattedBookings = filteredBookings.map(booking => {
      // Parse service_category safely for display
      let serviceType = 'General';
      if (booking.service_category) {
        if (Array.isArray(booking.service_category)) {
          serviceType = booking.service_category.join(', ');
        } else if (typeof booking.service_category === 'string') {
          try {
            const parsed = JSON.parse(booking.service_category);
            serviceType = Array.isArray(parsed) ? parsed.join(', ') : booking.service_category;
          } catch (e) {
            serviceType = booking.service_category;
          }
        } else {
          serviceType = String(booking.service_category);
        }
      }

      return {
        id: booking.id?.toString(),
        booking_reference: booking.booking_reference || `REF-${booking.id}`,
        customer_name: booking.customer_name || 'Unknown Customer',
        service_name: Array.isArray(booking.services_booked) 
          ? booking.services_booked.map(s => s.name || s).join(', ')
          : booking.services_booked || 'Service',
        service_type: serviceType,
        date_time: `${booking.booking_date} ${booking.booking_time}`,
        booking_status: booking.booking_status || 'pending',
        payment_status: booking.payment_status || 'pending',
        contact_number: booking.contact_number || 'No contact',
        address: booking.address || 'No address',
        notes: booking.notes || '',
        total_amount: parseFloat(booking.total_amount || booking.final_amount || 0),
        vendor_id: booking.vendor_id,
        is_new: Boolean(booking.is_new),
        created_at: booking.created_at,
        // Add visibility context for frontend
        visibility_reason: booking.vendor_id === parseInt(vendorId) ? 'accepted_by_me' : 'available_for_acceptance'
      };
    });

    // Calculate stats
    const statusCounts = formattedBookings.reduce((acc, booking) => {
      acc[booking.booking_status] = (acc[booking.booking_status] || 0) + 1;
      return acc;
    }, {});

    const newBookingsCount = formattedBookings.filter(b => b.is_new).length;
    const availableBookingsCount = formattedBookings.filter(b => b.visibility_reason === 'available_for_acceptance').length;
    const myAcceptedBookingsCount = formattedBookings.filter(b => b.visibility_reason === 'accepted_by_me').length;

    console.log(`✅ Vendor eligibility confirmed: business_type=solo, service_setup_type=ready`);
    console.log(`✅ Returned ${formattedBookings.length} category-matched bookings (${availableBookingsCount} available, ${myAcceptedBookingsCount} accepted by me)`);

    res.json({
      success: true,
      bookings: formattedBookings,
      stats: {
        statusCounts,
        newBookings: newBookingsCount,
        availableBookings: availableBookingsCount,
        myAcceptedBookings: myAcceptedBookingsCount
      },
      vendor_info: {
        vendor_id: vendor.sr_no,
        business_type: vendor.business_type,
        service_setup_type: vendor.service_setup_type,
        categories: vendorCategories,
        eligibility_status: 'eligible'
      },
      filter_info: {
        vendor_categories: vendorCategories,
        total_bookings_checked: bookingsResult.rows.length,
        matching_bookings: formattedBookings.length,
        eligibility_check: 'passed'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching filtered vendor bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filtered bookings',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/bookings/:vendorId
 * @desc Get all bookings for a vendor
 * @access Public
 */
router.get('/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, limit = 20, offset = 0, business_type, debug, vendorEmail } = req.query;
    
    const isDebugMode = debug === 'true';
    
    console.log(`📊 [FALLBACK] Fetching bookings for vendor ${vendorId} with business type: ${business_type || 'not specified'}${isDebugMode ? ' (DEBUG MODE)' : ''}`);
    
    // STEP 1: Get vendor details and check eligibility (business_type = 'solo' AND service_setup_type = 'ready')
    let vendorDetails = null;
    let debugInfo = {};
    
    try {
      const vendorDetailsQuery = `
        SELECT 
          r.sr_no, 
          r.business_name, 
          r.business_type, 
          r.email, 
          r.business_email,
          r.person_name, 
          r.phone_number,
          rsv.service_setup_type,
          rsv.selected_categories
        FROM registration_and_other_details r
        LEFT JOIN ready_services_vendors_data rsv ON r.business_email = rsv.vendor_email
        WHERE r.sr_no = $1
      `;
      
      const vendorDetailsResult = await query(vendorDetailsQuery, [vendorId]);
      
      if (vendorDetailsResult.rows.length > 0) {
        vendorDetails = vendorDetailsResult.rows[0];
        console.log(`📊 Found vendor details: ${vendorDetails.business_name || vendorDetails.person_name} (${vendorDetails.business_type})`);
        
        debugInfo.vendorFound = true;
        debugInfo.vendorDetails = {
          id: vendorDetails.sr_no,
          business_name: vendorDetails.business_name,
          business_type: vendorDetails.business_type,
          email: vendorDetails.email || vendorDetails.business_email,
          person_name: vendorDetails.person_name,
          service_setup_type: vendorDetails.service_setup_type,
          categories: vendorDetails.selected_categories
        };
        
        // Check eligibility for Our Services bookings
        if (vendorDetails.business_type !== 'solo') {
          console.log(`⚠️ [FALLBACK] Vendor ${vendorId} has business_type '${vendorDetails.business_type}', not eligible for Our Services bookings`);
          return res.json({
            success: true,
            bookings: [],
            message: 'Only solo business type vendors are eligible for Our Services bookings',
            vendor_info: {
              business_type: vendorDetails.business_type,
              service_setup_type: vendorDetails.service_setup_type,
              eligibility_status: 'not_eligible_business_type'
            }
          });
        }

        if (!vendorDetails.service_setup_type || vendorDetails.service_setup_type !== 'ready') {
          console.log(`⚠️ [FALLBACK] Vendor ${vendorId} has service_setup_type '${vendorDetails.service_setup_type || 'none'}', not eligible for Our Services bookings`);
          return res.json({
            success: true,
            bookings: [],
            message: 'Only vendors with ready service setup are eligible for Our Services bookings',
            vendor_info: {
              business_type: vendorDetails.business_type,
              service_setup_type: vendorDetails.service_setup_type,
              eligibility_status: 'not_eligible_service_setup'
            }
          });
        }

        console.log(`✅ [FALLBACK] Vendor ${vendorId} is eligible - business_type: solo, service_setup_type: ready`);
        
      } else {
        console.warn(`⚠️ [FALLBACK] No vendor found with ID ${vendorId}`);
        debugInfo.vendorFound = false;
        return res.json({
          success: true,
          bookings: [],
          message: 'Vendor not found in the system'
        });
      }
    } catch (vendorLookupError) {
      console.warn(`⚠️ [FALLBACK] Error checking vendor details: ${vendorLookupError.message}`);
      debugInfo.vendorLookupError = vendorLookupError.message;
    }
    
    // STEP 2: Apply booking visibility rules (same as filtered endpoint)
    let bookingsQuery = `
      SELECT 
        booking_id as id,
        user_name as customer_name,
        services_booked as service_name,
        service_type,
        CONCAT(booking_date, ' ', booking_time) as date_time,
        booking_status,
        payment_status,
        user_phone as contact_number,
        user_address as address,
        booking_notes as notes,
        booking_reference,
        total_amount as service_amount,
        total_amount,
        vendor_id,
        payment_method,
        service_category,
        CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN true ELSE false END as is_new,
        created_at,
        updated_at
      FROM booking_all_details_of_user_to_vendor 
      WHERE (
        -- Show new/pending bookings that haven't been accepted by any vendor
        (booking_status IN ('pending', 'requested') AND vendor_id IS NULL)
        OR
        -- Show bookings specifically accepted by this vendor
        (booking_status = 'accepted' AND vendor_id = $1)
        OR
        -- Show other status bookings (completed, denied, etc.) for this vendor
        (booking_status NOT IN ('pending', 'requested', 'accepted') AND vendor_id = $1)
      )
    `;
    
    const queryParams = [parseInt(vendorId)];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      paramIndex++;
      bookingsQuery += ` AND booking_status = $${paramIndex}`;
      queryParams.push(status);
    }
    
    bookingsQuery += ` ORDER BY 
      CASE 
        WHEN booking_status = 'pending' THEN 1
        WHEN booking_status = 'accepted' AND vendor_id = $1 THEN 2
        ELSE 3
      END,
      created_at DESC`;
    
    if (limit) {
      paramIndex++;
      bookingsQuery += ` LIMIT $${paramIndex}`;
      queryParams.push(parseInt(limit));
    }
    
    if (offset) {
      paramIndex++;
      bookingsQuery += ` OFFSET $${paramIndex}`;
      queryParams.push(parseInt(offset));
    }
    
    if (isDebugMode) {
      console.log(`📊 [DEBUG] [FALLBACK] Executing booking query for vendor ${vendorId}:`, {
        query: bookingsQuery,
        params: queryParams
      });
      
      // For debug mode, also check if this vendor ID exists in the bookings table at all
      try {
        const checkExistsQuery = `
          SELECT COUNT(*) as exists_count 
          FROM booking_all_details_of_user_to_vendor 
          WHERE vendor_id = $1
        `;
        
        const existsResult = await query(checkExistsQuery, [vendorId]);
        const existsCount = parseInt(existsResult.rows[0].exists_count);
        
        debugInfo.hasAnyBookings = existsCount > 0;
        debugInfo.totalBookingCount = existsCount;
        
        console.log(`📊 [DEBUG] [FALLBACK] Vendor ${vendorId} has ${existsCount} total bookings in the database`);
      } catch (existsError) {
        console.error('❌ [DEBUG] [FALLBACK] Error checking if vendor exists in bookings table:', existsError);
        debugInfo.existsCheckError = existsError.message;
      }
    }
    
    const result = await query(bookingsQuery, queryParams);
    
    console.log(`📊 [FALLBACK] Found ${result.rows.length} eligible bookings for vendor ${vendorId}`);
    debugInfo.matchingBookingCount = result.rows.length;
    
    // STEP 3: Apply category filtering if vendor has categories configured
    let filteredBookings = result.rows;
    const vendorCategories = vendorDetails.selected_categories || [];
    
    if (vendorCategories.length > 0) {
      const normalizedVendorCategories = vendorCategories.map(cat => cat.toLowerCase());
      
      filteredBookings = result.rows.filter(booking => {
        // Parse service_category properly
        let serviceCategories = booking.service_category || [];
        
        if (typeof serviceCategories === 'string') {
          try {
            serviceCategories = JSON.parse(serviceCategories);
          } catch (e) {
            serviceCategories = [serviceCategories];
          }
        }
        
        if (!Array.isArray(serviceCategories)) {
          serviceCategories = [serviceCategories];
        }
        
        const normalizedServiceCategories = serviceCategories.map(cat => 
          typeof cat === 'string' ? cat.toLowerCase() : String(cat).toLowerCase()
        );
        
        // Check if any service category matches vendor's categories
        const hasMatchingCategory = normalizedServiceCategories.some(serviceCat =>
          normalizedVendorCategories.includes(serviceCat)
        );
        
        if (isDebugMode && !hasMatchingCategory) {
          console.log(`🔍 [FALLBACK] Booking ${booking.booking_id}: service categories [${normalizedServiceCategories.join(', ')}] vs vendor categories [${normalizedVendorCategories.join(', ')}] = NO MATCH`);
        }
        
        return hasMatchingCategory;
      });
      
      console.log(`📊 [FALLBACK] After category filtering: ${filteredBookings.length} bookings (categories: [${vendorCategories.join(', ')}])`);
    }
    
    // Get booking counts by status for this vendor only
    const countsQuery = `
      SELECT 
        booking_status,
        COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor 
      WHERE (
        (booking_status IN ('pending', 'requested') AND vendor_id IS NULL)
        OR vendor_id = $1
      )
      GROUP BY booking_status
    `;

    const countsResult = await query(countsQuery, [vendorId]);
    const statusCounts = {};
    countsResult.rows.forEach(row => {
      statusCounts[row.booking_status] = parseInt(row.count);
    });

    // Count new bookings (created in last hour) that are eligible for this vendor
    const newBookingsQuery = `
      SELECT COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor 
      WHERE created_at > NOW() - INTERVAL '1 hour'
        AND (
          (booking_status IN ('pending', 'requested') AND vendor_id IS NULL)
          OR vendor_id = $1
        )
    `;

    const newBookingsResult = await query(newBookingsQuery, [vendorId]);
    const newBookingsCount = parseInt(newBookingsResult.rows[0].count);
    
    const response = {
      success: true,
      bookings: filteredBookings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: filteredBookings.length
      },
      stats: {
        statusCounts,
        newBookings: newBookingsCount
      },
      vendor_info: {
        vendor_id: vendorDetails.sr_no,
        business_type: vendorDetails.business_type,
        service_setup_type: vendorDetails.service_setup_type,
        categories: vendorCategories,
        eligibility_status: 'eligible'
      },
      filter_info: {
        total_fetched: result.rows.length,
        after_category_filter: filteredBookings.length,
        categories_applied: vendorCategories.length > 0
      }
    };
    
    // Add debug info if requested
    if (isDebugMode) {
      response.debug = debugInfo;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [FALLBACK] Error fetching vendor bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/bookings/:bookingId/status
 * @desc Update booking status and send notification
 * @access Public
 */
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, vendorId } = req.body;
    
    console.log(`🔄 Updating booking ${bookingId} status to ${status}`);
    
    // Convert bookingId to proper types for SQL comparison
    const bookingIdStr = bookingId.toString();
    const bookingIdNum = parseInt(bookingId) || 0;
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'denied', 'started', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Valid options: ' + validStatuses.join(', ')
      });
    }
    
    let updateQuery;
    let queryParams;
    
    // If booking is being accepted, fetch and save vendor details
    if (status === 'accepted') {
      console.log('📋 Booking is being accepted, fetching vendor details...');
      
      // ✅ FIRST-COME-FIRST-SERVED: Check if booking is already accepted by another vendor
      const checkBookingQuery = `
        SELECT vendor_id, booking_status, vendor_name
        FROM booking_all_details_of_user_to_vendor 
        WHERE booking_id = $1 OR id = $2
      `;
      
      const existingBookingResult = await query(checkBookingQuery, [bookingIdStr, bookingIdNum]);
      
      if (existingBookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }
      
      const existingBooking = existingBookingResult.rows[0];
      
      // Check if already accepted by another vendor
      if (existingBooking.booking_status === 'accepted' && existingBooking.vendor_id !== null && existingBooking.vendor_id != parseInt(vendorId)) {
        return res.status(409).json({
          success: false,
          error: 'Booking already accepted by another vendor',
          details: `This booking has been accepted by ${existingBooking.vendor_name || 'another vendor'}`
        });
      }
      
      // ✅ FIXED: For new bookings (vendor_id = NULL), vendorId must be provided in request
      let finalVendorId = vendorId;
      
      if (!finalVendorId) {
        // Try to get vendor_id from existing booking (for backwards compatibility)
        const getVendorQuery = `
          SELECT vendor_id 
          FROM booking_all_details_of_user_to_vendor 
          WHERE booking_id = $1
        `;
        const vendorResult = await query(getVendorQuery, [bookingId]);
        if (vendorResult.rows.length > 0) {
          finalVendorId = vendorResult.rows[0].vendor_id;
        }
      }
      
      // Vendor ID is required for acceptance
      if (!finalVendorId) {
        return res.status(400).json({
          success: false,
          error: 'Vendor ID is required to accept a booking'
        });
      }
      
      if (finalVendorId) {
        // Fetch vendor details from registration_and_other_details table
        const vendorDetailsQuery = `
          SELECT 
            person_name as vendor_name,
            business_email as vendor_email,
            phone_number as vendor_phone_number,
            COALESCE(business_address, '') as vendor_address
          FROM registration_and_other_details 
          WHERE sr_no = $1
        `;
        
        try {
          const vendorDetails = await query(vendorDetailsQuery, [finalVendorId]);
          
          if (vendorDetails.rows.length > 0) {
            const vendor = vendorDetails.rows[0];
            console.log('👤 Vendor details found:', {
              name: vendor.vendor_name,
              email: vendor.vendor_email,
              phone: vendor.vendor_phone_number ? 'Present' : 'Missing'
            });
            
            // Update booking status and save vendor details
            updateQuery = `
              UPDATE booking_all_details_of_user_to_vendor 
              SET 
                booking_status = $1,
                vendor_id = $2,
                vendor_name = $3,
                vendor_email = $4,
                vendor_phone_number = $5,
                vendor_address = $6,
                updated_at = CURRENT_TIMESTAMP
              WHERE booking_id = $7 OR id = $8
              RETURNING booking_id, id, user_name as customer_name, vendor_id, vendor_name, vendor_email, vendor_phone_number
            `;
            
            queryParams = [
              status,
              finalVendorId,  // ✅ ADDED: Now properly assigns vendor_id
              vendor.vendor_name,
              vendor.vendor_email,
              vendor.vendor_phone_number,
              vendor.vendor_address,
              bookingIdStr,
              bookingIdNum
            ];
          } else {
            console.log('⚠️ Vendor details not found for ID:', finalVendorId);
            // Fallback to basic update
            updateQuery = `
              UPDATE booking_all_details_of_user_to_vendor 
              SET 
                booking_status = $1,
                vendor_id = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE booking_id = $3 OR id = $4
              RETURNING booking_id, id, user_name as customer_name, vendor_id
            `;
            queryParams = [status, finalVendorId, bookingIdStr, bookingIdNum];
          }
        } catch (vendorError) {
          console.error('❌ Error fetching vendor details:', vendorError);
          // Fallback to basic update
          updateQuery = `
            UPDATE booking_all_details_of_user_to_vendor 
            SET 
              booking_status = $1,
              vendor_id = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $3 OR id = $4
            RETURNING booking_id, id, user_name as customer_name, vendor_id
          `;
          queryParams = [status, finalVendorId, bookingIdStr, bookingIdNum];
        }
      } else {
        console.log('⚠️ Vendor ID not found');
        // Fallback to basic update with vendor assignment
        updateQuery = `
          UPDATE booking_all_details_of_user_to_vendor 
          SET 
            booking_status = $1,
            vendor_id = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = $3 OR id = $4
          RETURNING booking_id, id, user_name as customer_name, vendor_id
        `;
        queryParams = [status, finalVendorId, bookingIdStr, bookingIdNum];
      }
    } else {
      // For non-acceptance status updates, just update the status
      updateQuery = `
        UPDATE booking_all_details_of_user_to_vendor 
        SET 
          booking_status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $2 OR id = $3
        RETURNING booking_id, id, user_name as customer_name, vendor_id
      `;
      queryParams = [status, bookingIdStr, bookingIdNum];
    }
    
    const result = await query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const booking = result.rows[0];
    
    // Log vendor details if they were saved
    if (status === 'accepted' && booking.vendor_name) {
      console.log('✅ Vendor details saved to booking:', {
        vendor_name: booking.vendor_name,
        vendor_email: booking.vendor_email,
        vendor_phone: booking.vendor_phone_number ? 'Saved' : 'Not available'
      });
    }
    
    // Send status notification to vendor
    try {
      const finalVendorId = vendorId || booking.vendor_id;
      await sendBookingStatusNotification(
        finalVendorId, 
        bookingId, 
        status, 
        booking.customer_name
      );
      console.log(`📱 Status notification sent to vendor ${finalVendorId}`);
    } catch (notificationError) {
      console.error('❌ Failed to send status notification:', notificationError);
    }
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}${status === 'accepted' ? ' with vendor details saved' : ''}`,
      booking: booking
    });
    
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/notifications/:vendorId
 * @desc Get vendor notifications
 * @access Public
 */
router.get('/notifications/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 20 } = req.query;
    
    console.log(`📱 Fetching notifications for vendor ${vendorId}`);
    
    const notifications = await getVendorNotifications(vendorId, parseInt(limit));
    
    res.json({
      success: true,
      notifications
    });
    
  } catch (error) {
    console.error('❌ Error fetching vendor notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Public
 */
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { vendorId } = req.body;
    
    const success = await markNotificationAsRead(notificationId, vendorId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/lookup-by-email
 * @desc Get vendor ID by email
 * @access Public
 */
router.get('/lookup-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    console.log(`🔍 Looking up vendor ID for email: ${email}`);
    
    // Look up vendor in registration_and_other_details table
    const vendorQuery = `
      SELECT sr_no as vendor_id, email, business_name, business_type
      FROM registration_and_other_details 
      WHERE email = $1
    `;
    
    const result = await query(vendorQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with this email'
      });
    }
    
    const vendor = result.rows[0];
    
    console.log(`✅ Found vendor ID ${vendor.vendor_id} for email ${email} with business type ${vendor.business_type}`);
    
    res.json({
      success: true,
      vendorId: vendor.vendor_id,
      email: vendor.email,
      businessName: vendor.business_name,
      businessType: vendor.business_type
    });
    
  } catch (error) {
    console.error('❌ Error looking up vendor by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup vendor',
      details: error.message
    });
  }
});

module.exports = router; 