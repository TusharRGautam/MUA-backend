const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Register a new customer
 * POST /api/customers/register
 */
router.post('/register', async (req, res) => {
  const { fullName, email, phoneNumber, password, deviceId } = req.body;
  
  console.log('Customer registration request received:', { 
    fullName, 
    email, 
    phoneNumber,
    deviceId: deviceId ? 'Provided' : 'Not provided'
  });
  
  // Input validation
  if (!fullName || !email || !phoneNumber || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  try {
    // Check if email already exists
    const checkEmailQuery = 'SELECT id FROM Customer_Table_Details WHERE email = $1';
    const emailCheck = await query(checkEmailQuery, [email]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the new record into Customer_Table_Details
    const insertQuery = `
      INSERT INTO Customer_Table_Details (
        full_name,
        email,
        phone_number,
        password,
        device_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    
    const values = [
      fullName,
      email,
      phoneNumber,
      hashedPassword,
      deviceId || null
    ];
    
    console.log('Executing insert query with values:', values.map((v, i) => i === 3 ? '[PASSWORD HIDDEN]' : v));
    const result = await query(insertQuery, values);
    console.log('Customer registration successful, returning data');
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: result.rows[0].id,
        email: email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'mua-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.rows[0].id,
        email: email,
        full_name: fullName,
        phone_number: phoneNumber
      },
      session: {
        access_token: token,
        refresh_token: token // For simplicity, using same token
      }
    });
  } catch (error) {
    console.error('Error during customer registration:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Get all customers for admin dashboard
 * GET /api/customers/all
 */
router.get('/all', async (req, res) => {
  console.log('[CUSTOMERS API] GET /all endpoint called');
  
  try {
    // Authentication check temporarily removed for testing
    
    // Use the correct lowercase table name
    const customersQuery = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone_number, 
        COALESCE(user_status, 'active') as user_status,
        created_at
      FROM customer_table_details
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    console.log('[CUSTOMERS API] Executing query:', customersQuery);
    
    // First test database connection
    try {
      await query('SELECT 1');
      console.log('[CUSTOMERS API] Database connection confirmed before customer query');
    } catch (connError) {
      console.error('[CUSTOMERS API] Database connection test failed:', connError);
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: 'Unable to connect to database'
      });
    }
    
    // Then execute the actual query
    const result = await query(customersQuery);
    
    console.log(`[CUSTOMERS API] Query executed successfully. Fetched ${result.rows.length} customer records`);
    
    if (result.rows.length > 0) {
      console.log('[CUSTOMERS API] Sample customer record:', JSON.stringify(result.rows[0]));
    } else {
      console.log('[CUSTOMERS API] No customer records found');
    }
    
    // Format dates for better client handling
    const formattedResults = result.rows.map(customer => ({
      ...customer,
      created_at: customer.created_at ? new Date(customer.created_at).toISOString() : null
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('[CUSTOMERS API] Error fetching all customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: error.message || 'Unknown database error',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

/**
 * Login customer
 * POST /api/customers/login
 */
router.post('/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  
  console.log('Customer login attempt for email:', email);
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Query to find user with the provided email
    const dbQuery = `
      SELECT id, full_name, email, phone_number, password, device_id
      FROM Customer_Table_Details
      WHERE email = $1
    `;
    const result = await query(dbQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password'
      });
    }
    
    // Update device ID if provided and different
    if (deviceId && deviceId !== user.device_id) {
      console.log(`Updating device ID for user ${user.id}`);
      try {
        await query(
          'UPDATE Customer_Table_Details SET device_id = $1 WHERE id = $2',
          [deviceId, user.id]
        );
      } catch (updateErr) {
        console.error('Error updating device ID:', updateErr);
        // Continue login process even if device ID update fails
      }
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'mua-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for customer:', user.id);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        profile: {
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number
        }
      },
      session: {
        access_token: token,
        refresh_token: token // For simplicity, using the same token
      }
    });
  } catch (error) {
    console.error('Error during customer login:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Get customer profile
 * GET /api/customers/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // --- BEGIN ADDED LOGGING ---
    console.log('[PROFILE ROUTE] Attempting to fetch profile for userId:', userId);
    console.log('[PROFILE ROUTE] Type of userId:', typeof userId);
    const profileQueryLog = 'SELECT id, full_name, email, phone_number FROM Customer_Table_Details WHERE id = $1';
    console.log('[PROFILE ROUTE] Executing Query:', profileQueryLog);
    console.log('[PROFILE ROUTE] Query Parameters:', [userId]);
    // --- END ADDED LOGGING ---

    // Get customer profile data
    const profileQuery = 'SELECT id, full_name, email, phone_number FROM Customer_Table_Details WHERE id = $1';
    const result = await query(profileQuery, [userId]);
    
    // --- BEGIN ADDED LOGGING ---
    console.log('[PROFILE ROUTE] Query execution successful.');
    // --- END ADDED LOGGING ---

    if (result.rows.length === 0) {
      console.log('[PROFILE ROUTE] User profile not found for userId:', userId);
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    console.log('[PROFILE ROUTE] Profile data found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    // Log the error with more context
    console.error('[PROFILE ROUTE] Error fetching customer profile. UserId:', req.user ? req.user.id : 'N/A', 'Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Update customer location
 * PUT /api/customers/location
 */
router.put('/location', async (req, res) => {
  const { email, latitude, longitude, referenceLatitude, referenceLongitude } = req.body;
  
  // Validate required parameters
  if (!email || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Email, latitude, and longitude are required'
    });
  }
  
  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      error: 'Latitude must be between -90 and 90'
    });
  }
  
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: 'Longitude must be between -180 and 180'
    });
  }

  try {
    console.log(`[CUSTOMER LOCATION] Updating location for email: ${email} to ${latitude}, ${longitude}`);
    
    // Check if customer exists
    const checkCustomer = await query(
      'SELECT id FROM Customer_Table_Details WHERE email = $1',
      [email]
    );
    
    if (checkCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found with the provided email'
      });
    }
    
    // Calculate distance if reference coordinates are provided
    let calculatedDistance = null;
    if (referenceLatitude !== undefined && referenceLongitude !== undefined) {
      calculatedDistance = calculateDistance(latitude, longitude, referenceLatitude, referenceLongitude);
      console.log(`[CUSTOMER LOCATION] Calculated distance: ${calculatedDistance} km from reference point (${referenceLatitude}, ${referenceLongitude})`);
    } else {
      // Use default reference point (you can change these coordinates to your business location)
      const defaultRefLat = 28.6139; // Delhi, India (example)
      const defaultRefLon = 77.2090;
      calculatedDistance = calculateDistance(latitude, longitude, defaultRefLat, defaultRefLon);
      console.log(`[CUSTOMER LOCATION] Calculated distance: ${calculatedDistance} km from default reference point (${defaultRefLat}, ${defaultRefLon})`);
    }
    
    // Update location coordinates and distance
    const updateResult = await query(
      'UPDATE Customer_Table_Details SET latitude = $1, longitude = $2, distance = $3, updated_at = CURRENT_TIMESTAMP WHERE email = $4 RETURNING id, email, latitude, longitude, distance',
      [latitude, longitude, calculatedDistance, email]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
    
    console.log(`[CUSTOMER LOCATION] Location and distance updated successfully for ${email}`);
    
    return res.json({
      success: true,
      message: 'Location and distance updated successfully',
      data: {
        email: updateResult.rows[0].email,
        latitude: updateResult.rows[0].latitude,
        longitude: updateResult.rows[0].longitude,
        distance: updateResult.rows[0].distance
      }
    });
  } catch (error) {
    console.error('[CUSTOMER LOCATION] Error updating customer location:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

/**
 * Get all customer data from customer_table_details
 * GET /api/customers/table-data
 */
router.get('/table-data', async (req, res) => {
  console.log('[CUSTOMERS API] GET /table-data endpoint called');
  
  try {
    const customersQuery = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone_number, 
        latitude,
        longitude,
        distance,
        COALESCE(user_status, 'active') as user_status,
        created_at,
        updated_at
      FROM customer_table_details
      ORDER BY created_at DESC
    `;
    
    console.log('[CUSTOMERS API] Executing customer_table_details query');
    
    const result = await query(customersQuery);
    
    console.log(`[CUSTOMERS API] Query executed successfully. Fetched ${result.rows.length} complete customer records`);
    
    // Format dates for better client handling
    const formattedResults = result.rows.map(customer => ({
      ...customer,
      created_at: customer.created_at ? new Date(customer.created_at).toISOString() : null,
      updated_at: customer.updated_at ? new Date(customer.updated_at).toISOString() : null
    }));
    
    res.json({
      success: true,
      count: formattedResults.length,
      data: formattedResults
    });
  } catch (error) {
    console.error('[CUSTOMERS API] Error fetching customer_table_details data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customer data',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

module.exports = router; 