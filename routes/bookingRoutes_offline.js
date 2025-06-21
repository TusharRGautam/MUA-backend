const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Directory to store booking files
const BOOKINGS_DIR = path.join(__dirname, '..', 'data', 'bookings');

// Ensure bookings directory exists
async function ensureBookingsDir() {
  try {
    await fs.mkdir(BOOKINGS_DIR, { recursive: true });
  } catch (error) {
    console.log('Bookings directory already exists or created');
  }
}

// Initialize bookings directory
ensureBookingsDir();

/**
 * @route POST /api/bookings
 * @desc Create a new booking (offline version - saves to local file)
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

    console.log('🔄 Creating offline booking with data:', {
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
    const timestamp = new Date().toISOString();
    
    // Create comprehensive booking data
    const bookingData = {
      bookingId,
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      
      // Customer information
      customer: {
        userId: userId || 0,
        customUserId: customUserId || '',
        name: customerName || '',
        email: customerEmail || '',
        phone: customerPhone || '',
        address: address || '',
        deviceId: deviceId || null
      },
      
      // Booking details
      booking: {
        selectedDate: selectedDate || '',
        selectedTime: selectedTime || '',
        paymentMethod: paymentMethod || '',
        totalAmount: totalAmount || 0,
        status: 'confirmed'
      },
      
      // Services/items
      services: items.map((item, index) => ({
        id: item.id || index,
        name: item.name || 'Unknown Service',
        price: item.price || 0,
        quantity: item.quantity || 1,
        duration: item.duration || 30,
        category: item.category || 'General',
        description: item.description || 'No description',
        serviceType: item.serviceType || 'service',
        
        // Vendor information
        artistId: item.artistId || 'unknown',
        artistName: item.artistName || 'Service Provider',
        salonId: item.salonId || null,
        salonName: item.salonName || null,
        
        // Additional details
        image: item.image || '',
        subtotal: (item.price || 0) * (item.quantity || 1)
      })),
      
      // Summary
      summary: {
        totalServices: items.length,
        totalAmount: totalAmount || 0,
        totalDuration: items.reduce((sum, item) => sum + ((item.duration || 30) * (item.quantity || 1)), 0)
      }
    };

    // Save to individual booking file
    const bookingFileName = `booking_${bookingId}.json`;
    const bookingFilePath = path.join(BOOKINGS_DIR, bookingFileName);
    
    await fs.writeFile(bookingFilePath, JSON.stringify(bookingData, null, 2), 'utf8');
    
    // Also append to master bookings list
    const masterFilePath = path.join(BOOKINGS_DIR, 'all_bookings.json');
    let allBookings = [];
    
    try {
      const existingData = await fs.readFile(masterFilePath, 'utf8');
      allBookings = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      allBookings = [];
    }
    
    // Add new booking to list
    allBookings.push({
      bookingId,
      timestamp,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      totalAmount: totalAmount || 0,
      status: 'confirmed',
      servicesCount: items.length,
      filePath: bookingFileName
    });
    
    // Keep only last 1000 bookings to prevent file from getting too large
    if (allBookings.length > 1000) {
      allBookings = allBookings.slice(-1000);
    }
    
    await fs.writeFile(masterFilePath, JSON.stringify(allBookings, null, 2), 'utf8');
    
    console.log(`✅ Successfully saved offline booking ${bookingId} with ${items.length} services`);
    
    // Log each service for verification
    items.forEach((item, index) => {
      console.log(`📊 Service ${index + 1}:`, {
        name: item.name,
        vendor: item.artistName,
        amount: item.price,
        quantity: item.quantity
      });
    });
    
    res.status(201).json({
      message: 'Booking created successfully (offline mode)',
      bookingId: bookingId,
      customUserId: customUserId || '',
      itemsProcessed: items.length,
      data: {
        booking_id: bookingId,
        total_amount: totalAmount,
        status: 'confirmed',
        services_count: items.length,
        saved_to: bookingFileName
      },
      offline: true,
      note: 'Booking saved to local file - will sync to database when available'
    });

  } catch (error) {
    console.error('❌ Error creating offline booking:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message,
      hint: 'Offline booking system error - check file permissions'
    });
  }
});

/**
 * @route GET /api/bookings/:bookingId
 * @desc Get booking details by booking ID (offline version)
 * @access Public
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const bookingFilePath = path.join(BOOKINGS_DIR, `booking_${bookingId}.json`);
    
    try {
      const bookingData = await fs.readFile(bookingFilePath, 'utf8');
      const booking = JSON.parse(bookingData);
      
      res.json({
        bookingId: bookingId,
        booking: booking,
        offline: true
      });
    } catch (fileError) {
      return res.status(404).json({ 
        error: 'Booking not found',
        bookingId: bookingId,
        offline: true
      });
    }

  } catch (error) {
    console.error('Error fetching offline booking:', error);
    res.status(500).json({ 
      error: 'Failed to fetch booking',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/bookings
 * @desc Get all bookings (offline version)
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const masterFilePath = path.join(BOOKINGS_DIR, 'all_bookings.json');
    
    try {
      const bookingsData = await fs.readFile(masterFilePath, 'utf8');
      const allBookings = JSON.parse(bookingsData);
      
      res.json({
        bookings: allBookings,
        total: allBookings.length,
        offline: true,
        note: 'Showing offline bookings from local files'
      });
    } catch (fileError) {
      res.json({
        bookings: [],
        total: 0,
        offline: true,
        note: 'No offline bookings found'
      });
    }

  } catch (error) {
    console.error('Error fetching offline bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message 
    });
  }
});

/**
 * @route PUT /api/bookings/:bookingId/status
 * @desc Update booking status (offline version)
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

    const bookingFilePath = path.join(BOOKINGS_DIR, `booking_${bookingId}.json`);
    
    try {
      const bookingData = await fs.readFile(bookingFilePath, 'utf8');
      const booking = JSON.parse(bookingData);
      
      // Update status and timestamp
      booking.booking.status = status;
      booking.updatedAt = new Date().toISOString();
      
      await fs.writeFile(bookingFilePath, JSON.stringify(booking, null, 2), 'utf8');
      
      res.json({
        message: 'Booking status updated successfully (offline)',
        bookingId: bookingId,
        newStatus: status,
        offline: true
      });
    } catch (fileError) {
      return res.status(404).json({ 
        error: 'Booking not found',
        bookingId: bookingId 
      });
    }

  } catch (error) {
    console.error('Error updating offline booking status:', error);
    res.status(500).json({ 
      error: 'Failed to update booking status',
      details: error.message 
    });
  }
});

module.exports = router; 