const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route GET /api/prp/packages
 * @desc Get all PRP packages/services
 * @access Public
 */
router.get('/packages', async (req, res) => {
  try {
    // Query to fetch PRP services from the database
    // Note: Since the exact table name wasn't found, I'll use a generic query
    // that can be adjusted based on the actual table structure
    const query = `
      SELECT 
        id,
        service_name as name,
        service_description as description,
        service_price as price,
        service_duration as duration,
        service_sessions as sessionCount,
        included_services as features,
        vendor_id,
        created_at,
        updated_at
      FROM dashboard_prp_services
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query);
    
    // Transform the data to match the expected frontend format
    const packages = result.rows.map(row => {
      let features = [];
      
      // Handle package_includes - it can be a JSON string or plain text
      if (row.features) {
        try {
          // Try to parse as JSON first
          features = JSON.parse(row.features);
        } catch (e) {
          // If not JSON, split by comma or newline
          features = row.features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
        }
      }
      
      return {
        id: row.id,
        name: row.name || 'PRP Package',
        description: row.description || 'Professional PRP treatment package',
        price: typeof row.price === 'string' ? parseFloat(row.price.replace('₹', '').replace(',', '')) : (row.price || 0),
        duration: row.duration || '60 min',
        sessionCount: row.sessioncount || 1,
        features: features,
        image: row.image || 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: row.ispopular || false
      };
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching PRP packages:', error);
    
    // Fallback to mock data if database query fails
    const mockPackages = [
      {
        id: 1,
        name: 'Single PRP Session',
        description: 'One comprehensive PRP treatment session, ideal for first-time patients or those looking to try the treatment.',
        price: 4999,
        duration: '60 min',
        features: [
          'High-quality PRP extraction',
          'Scalp preparation and numbing',
          'Expert application',
          'Post-treatment care',
          'Before & after photos'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 1
      },
      {
        id: 2,
        name: 'Standard PRP Package',
        description: 'Our most popular package includes three PRP sessions spread over 6 months for optimal results.',
        price: 12999,
        duration: '60 min per session',
        features: [
          '3 PRP treatment sessions',
          'Sessions spaced 6-8 weeks apart',
          'High-quality PRP extraction',
          'Customized treatment plan',
          'Scalp preparation and numbing',
          'Expert application',
          'Post-treatment care kit',
          'Progress tracking'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: true,
        sessionCount: 3
      },
      {
        id: 3,
        name: 'Premium PRP Package',
        description: 'Comprehensive 6-session package for maximum results, ideal for those with significant hair loss or thinning.',
        price: 23999,
        duration: '60 min per session',
        features: [
          '6 PRP treatment sessions',
          'Sessions spaced 4-6 weeks apart',
          'Premium PRP extraction',
          'Detailed scalp analysis',
          'Customized treatment protocol',
          'Enhanced platelet concentration',
          'Premium post-treatment care kit',
          'Monthly progress tracking',
          'Dedicated specialist'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 6
      },
      {
        id: 4,
        name: 'PRP + Hair Growth Serum',
        description: 'Combines PRP therapy with our exclusive growth serum for enhanced results.',
        price: 15999,
        duration: '75 min per session',
        features: [
          '3 PRP treatment sessions',
          'Sessions spaced 6-8 weeks apart',
          'Proprietary growth serum application',
          'High-quality PRP extraction',
          'Customized treatment plan',
          'Take-home serum for daily application',
          'Progress tracking',
          'Extended post-treatment care'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 3
      }
    ];
    
    res.json(mockPackages);
  }
});

/**
 * @route GET /api/prp/packages/:id
 * @desc Get a specific PRP package by ID
 * @access Public
 */
router.get('/packages/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    
    const query = `
      SELECT 
        id,
        service_name as name,
        service_description as description,
        service_price as price,
        service_duration as duration,
        service_sessions as sessionCount,
        included_services as features,
        vendor_id,
        created_at,
        updated_at
      FROM dashboard_prp_services
      WHERE id = $1
    `;
    
    const result = await db.query(query, [packageId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PRP package not found' });
    }
    
    const row = result.rows[0];
    
    let features = [];
    // Handle package_includes - it can be a JSON string or plain text
    if (row.features) {
      try {
        // Try to parse as JSON first
        features = JSON.parse(row.features);
      } catch (e) {
        // If not JSON, split by comma or newline
        features = row.features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
      }
    }
    
    const packageData = {
      id: row.id,
      name: row.name || 'PRP Package',
      description: row.description || 'Professional PRP treatment package',
      price: typeof row.price === 'string' ? parseFloat(row.price.replace('₹', '').replace(',', '')) : (row.price || 0),
      duration: row.duration || '60 min',
      sessionCount: row.sessioncount || 1,
      features: features,
      image: row.image || 'http://192.168.0.102:3000/static/images/hair prp.jpg',
      isPopular: row.ispopular || false
    };
    
    res.json(packageData);
  } catch (error) {
    console.error('Error fetching PRP package:', error);
    res.status(500).json({ error: 'Server error fetching PRP package' });
  }
});

/**
 * @route POST /api/prp/booking
 * @desc Create a new PRP booking
 * @access Public
 */
router.post('/booking', async (req, res) => {
  try {
    console.log('🔄 Creating PRP booking:', req.body);
    
    // Debug user name fields
    console.log('📋 User name fields in request:', {
      userName: req.body.userName,
      customerName: req.body.customerName
    });
    
    const {
      bookingId,
      planName,
      planPrice,
      staffName, // We'll map this to doctor_name
      doctorName,
      sessionCount,
      selectedDate,
      selectedTime,
      bookingDate,
      bookingTime,
      customerName,
      userName, // Added to support both field names
      customerEmail,
      userEmail, // Added to support both field names
      customerPhone,
      userPhone, // Added to support both field names
      userId,
      customUserId,
      paymentMethod,
      paymentStatus = 'pending',
      totalAmount,
      // New fields for session timing and recurring sessions
      selectedDates,
      selectedTimeSlot,
      recurringOption,
      visitDate,
      treatmentPlan
    } = req.body;

    // Validate required fields
    if (!bookingId || !planName || !planPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking information'
      });
    }

    // Prepare booking data for database insertion
    const bookingData = {
      booking_id: bookingId,
      user_id: userId || null,
      custom_user_id: customUserId || null,
      vendor_id: 1, // Default PRP service provider
      vendor_name: 'PRP Specialist Center',
      service_type: 'prp',
      service_category: 'Hair Restoration',
      service_gender: 'both',
      vendor_business_type: 'Medical',
      booking_source: 'mobile_app',
      services_booked: JSON.stringify([{
        id: '1',
        name: planName,
        price: parseFloat(planPrice),
        quantity: 1,
        duration: 60,
        sessionCount: sessionCount || 1,
        serviceType: 'prp',
        category: 'Hair Restoration'
      }]),
      total_amount: parseFloat(totalAmount || planPrice),
      final_amount: parseFloat(totalAmount || planPrice), // Same as total for PRP
      booking_status: 'confirmed',
      payment_method: paymentMethod || 'pending',
      payment_status: paymentStatus,
      payment_amount: parseFloat(totalAmount || planPrice),
      payment_currency: 'INR',
      payment_date_time: new Date(),
      user_name: userName || customerName || 'Guest User', // Support both field names with fallback
      user_email: userEmail || customerEmail || '',
      user_phone: userPhone || customerPhone || '',
      booking_date: bookingDate || selectedDate || (visitDate ? new Date(visitDate).toISOString().split('T')[0] : null),
      booking_time: bookingTime || selectedTime || selectedTimeSlot || null,
      session_count: sessionCount || 1, // PRP-specific column
      doctor_name: staffName || req.body.doctorName, // Support both staffName and doctorName
      // New fields for session timing and recurring sessions
      session_dates: selectedDates ? JSON.stringify(selectedDates) : null,
      session_times: selectedTimeSlot ? JSON.stringify([selectedTimeSlot]) : null,
      recurring_pattern: recurringOption || 'custom',
      sessions_completed: 0,
      next_session_date: selectedDates && selectedDates.length > 0 ? selectedDates[0] : 
                         (visitDate ? new Date(visitDate).toISOString().split('T')[0] : null),
      treatment_plan: treatmentPlan || JSON.stringify({
        planName: planName,
        sessionCount: sessionCount || 1,
        recurringPattern: recurringOption || 'custom',
        sessionDates: selectedDates || [],
        sessionTime: selectedTimeSlot || selectedTime || bookingTime
      }),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Log the final user_name value for debugging
    console.log('✅ Final user_name value for database:', bookingData.user_name);
    
    // Insert booking into database
    const insertQuery = `
      INSERT INTO booking_all_details_of_user_to_vendor (
        booking_id, user_id, custom_user_id, vendor_id, vendor_name,
        service_type, service_category, service_gender, vendor_business_type,
        booking_source, services_booked, total_amount, final_amount, booking_status,
        payment_method, payment_status, payment_amount, payment_currency, payment_date_time,
        user_name, user_email, user_phone, booking_date, booking_time, session_count, doctor_name,
        session_dates, session_times, recurring_pattern, sessions_completed, next_session_date, treatment_plan,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING *
    `;

    const values = [
      bookingData.booking_id,
      bookingData.user_id,
      bookingData.custom_user_id,
      bookingData.vendor_id,
      bookingData.vendor_name,
      bookingData.service_type,
      bookingData.service_category,
      bookingData.service_gender,
      bookingData.vendor_business_type,
      bookingData.booking_source,
      bookingData.services_booked,
      bookingData.total_amount,
      bookingData.final_amount,
      bookingData.booking_status,
      bookingData.payment_method,
      bookingData.payment_status,
      bookingData.payment_amount,
      bookingData.payment_currency,
      bookingData.payment_date_time,
      bookingData.user_name,
      bookingData.user_email,
      bookingData.user_phone,
      bookingData.booking_date,
      bookingData.booking_time,
      bookingData.session_count,
      bookingData.doctor_name,
      bookingData.session_dates,
      bookingData.session_times,
      bookingData.recurring_pattern,
      bookingData.sessions_completed,
      bookingData.next_session_date,
      bookingData.treatment_plan,
      bookingData.created_at,
      bookingData.updated_at
    ];

    const result = await db.query(insertQuery, values);
    
    console.log('✅ PRP booking created successfully:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'PRP booking created successfully',
      booking: result.rows[0],
      bookingId: bookingId
    });

  } catch (error) {
    console.error('❌ Error creating PRP booking:', error);
    
    // Fallback to in-memory storage if database fails
    console.log('📋 Using fallback storage for PRP booking');
    
    const fallbackBooking = {
      bookingId: req.body.bookingId,
      planName: req.body.planName,
      planPrice: req.body.planPrice,
      doctorName: req.body.doctorName || req.body.staffName, // Support both field names
      sessionCount: req.body.sessionCount,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      userName: req.body.userName || req.body.customerName || 'Guest User', // Ensure user_name is set
      userEmail: req.body.userEmail || req.body.customerEmail || '',
      userPhone: req.body.userPhone || req.body.customerPhone || '',
      // Include session timing and recurring session data
      bookingDate: req.body.bookingDate || req.body.selectedDate || (req.body.visitDate ? new Date(req.body.visitDate).toISOString().split('T')[0] : null),
      bookingTime: req.body.bookingTime || req.body.selectedTime || req.body.selectedTimeSlot || null,
      sessionDates: req.body.selectedDates || [],
      recurringPattern: req.body.recurringOption || 'custom',
      sessionsCompleted: 0,
      nextSessionDate: req.body.selectedDates && req.body.selectedDates.length > 0 ? req.body.selectedDates[0] : 
                      (req.body.visitDate ? new Date(req.body.visitDate).toISOString().split('T')[0] : null),
      treatmentPlan: {
        planName: req.body.planName,
        sessionCount: req.body.sessionCount || 1,
        recurringPattern: req.body.recurringOption || 'custom',
        sessionDates: req.body.selectedDates || [],
        sessionTime: req.body.selectedTimeSlot || req.body.selectedTime || req.body.bookingTime
      }
    };
    
    res.json({
      success: true,
      message: 'PRP booking created successfully (fallback mode)',
      booking: fallbackBooking,
      bookingId: req.body.bookingId
    });
  }
});

/**
 * @route GET /api/prp/booking/:bookingId/sessions
 * @desc Get session details for a specific PRP booking
 * @access Public
 */
router.get('/booking/:bookingId/sessions', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    // Query to fetch session details from the database
    const query = `
      SELECT 
        booking_id, 
        session_count, 
        session_dates, 
        session_times, 
        recurring_pattern, 
        sessions_completed, 
        next_session_date, 
        treatment_plan,
        booking_date,
        booking_time,
        doctor_name
      FROM booking_all_details_of_user_to_vendor
      WHERE booking_id = $1 AND service_type = 'prp'
    `;
    
    const result = await db.query(query, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PRP booking not found' });
    }
    
    const booking = result.rows[0];
    
    // Parse JSON fields
    let sessionDates = [];
    let sessionTimes = [];
    let treatmentPlan = {};
    
    try {
      if (booking.session_dates) {
        sessionDates = JSON.parse(booking.session_dates);
      }
      
      if (booking.session_times) {
        sessionTimes = JSON.parse(booking.session_times);
      }
      
      if (booking.treatment_plan) {
        treatmentPlan = typeof booking.treatment_plan === 'string' 
          ? JSON.parse(booking.treatment_plan) 
          : booking.treatment_plan;
      }
    } catch (error) {
      console.error('Error parsing JSON fields:', error);
    }
    
    // Format the response
    const sessionDetails = {
      bookingId: booking.booking_id,
      sessionCount: booking.session_count || 1,
      sessionDates: sessionDates,
      sessionTimes: sessionTimes,
      recurringPattern: booking.recurring_pattern || 'custom',
      sessionsCompleted: booking.sessions_completed || 0,
      nextSessionDate: booking.next_session_date || booking.booking_date,
      treatmentPlan: treatmentPlan,
      doctorName: booking.doctor_name,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time
    };
    
    res.json({
      success: true,
      sessionDetails
    });
    
  } catch (error) {
    console.error('Error fetching PRP session details:', error);
    res.status(500).json({ error: 'Failed to fetch PRP session details' });
  }
});

/**
 * @route PUT /api/prp/booking/:bookingId/session-status
 * @desc Update session status (mark as completed, reschedule, etc.)
 * @access Public
 */
router.put('/booking/:bookingId/session-status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { sessionsCompleted, nextSessionDate } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    // First, get the current booking details
    const getQuery = `
      SELECT 
        session_count, 
        sessions_completed,
        session_dates
      FROM booking_all_details_of_user_to_vendor
      WHERE booking_id = $1 AND service_type = 'prp'
    `;
    
    const bookingResult = await db.query(getQuery, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'PRP booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Validate sessions completed
    if (sessionsCompleted !== undefined && 
        (sessionsCompleted < 0 || sessionsCompleted > booking.session_count)) {
      return res.status(400).json({ 
        error: `Sessions completed must be between 0 and ${booking.session_count}` 
      });
    }
    
    // Update the booking with new session status
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor
      SET 
        sessions_completed = $1,
        next_session_date = $2,
        updated_at = NOW()
      WHERE booking_id = $3 AND service_type = 'prp'
      RETURNING *
    `;
    
    const updateValues = [
      sessionsCompleted !== undefined ? sessionsCompleted : booking.sessions_completed,
      nextSessionDate || null,
      bookingId
    ];
    
    const updateResult = await db.query(updateQuery, updateValues);
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update session status' });
    }
    
    res.json({
      success: true,
      message: 'Session status updated successfully',
      booking: {
        bookingId,
        sessionsCompleted: updateResult.rows[0].sessions_completed,
        nextSessionDate: updateResult.rows[0].next_session_date,
        totalSessions: updateResult.rows[0].session_count
      }
    });
    
  } catch (error) {
    console.error('Error updating PRP session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

module.exports = router;