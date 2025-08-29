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
  const { fullName, email, phoneNumber, password, deviceId, deviceInfo } = req.body;
  
  console.log('Customer registration request received:', { 
    fullName, 
    email, 
    phoneNumber,
    deviceId: deviceId ? 'Provided' : 'Not provided',
    deviceInfo: deviceInfo ? 'Provided' : 'Not provided'
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
        device_id,
        device_info
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, custom_user_id;
    `;
    
    // Prepare device info with timestamp
    const deviceInfoWithTimestamp = deviceInfo ? {
      ...deviceInfo,
      registeredAt: new Date().toISOString()
    } : null;
    
    const values = [
      fullName,
      email,
      phoneNumber,
      hashedPassword,
      deviceId || null,
      deviceInfoWithTimestamp ? JSON.stringify(deviceInfoWithTimestamp) : null
    ];
    
    console.log('Executing insert query with values:', values.map((v, i) => i === 3 ? '[PASSWORD HIDDEN]' : v));
    const result = await query(insertQuery, values);
    console.log('Customer registration successful, returning data');
    
    // Create JWT token (no expiration - valid until logout)
    const token = jwt.sign(
      { 
        id: result.rows[0].id,
        custom_user_id: result.rows[0].custom_user_id,
        email: email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'mua-secret-key'
      // No expiresIn - token valid until user explicitly logs out
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.rows[0].id,
        custom_user_id: result.rows[0].custom_user_id,
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
 * Register customer with Firebase UID
 * POST /api/customers/firebase-register
 */
router.post('/firebase-register', async (req, res) => {
  const { firebaseUid, fullName, phoneNumber, email, deviceId, deviceInfo, authProvider } = req.body;
  
  console.log('Firebase customer registration request received:', { 
    firebaseUid: firebaseUid ? 'Provided' : 'Not provided',
    fullName, 
    phoneNumber,
    email,
    authProvider,
    deviceId: deviceId ? 'Provided' : 'Not provided',
    deviceInfo: deviceInfo ? 'Provided' : 'Not provided'
  });
  
  // Input validation - for Google Sign-In, email is required instead of phone number
  if (!firebaseUid || !fullName) {
    return res.status(400).json({ error: "Firebase UID and full name are required" });
  }
  
  // For Google auth, email is required; for OTP auth, phone number is required
  if (authProvider === 'google' && !email) {
    return res.status(400).json({ error: "Email is required for Google Sign-In" });
  } else if (authProvider !== 'google' && !phoneNumber) {
    return res.status(400).json({ error: "Phone number is required for OTP authentication" });
  }
  
  // Log the registration data for debugging
  console.log('Firebase registration data:', {
    firebaseUid: firebaseUid ? 'Provided' : 'Missing',
    fullName: fullName ? fullName.substring(0, 20) + '...' : 'Missing',
    email: email ? email : 'Not provided',
    phoneNumber: phoneNumber ? phoneNumber : 'Not provided',
    authProvider: authProvider || 'Not specified'
  });
  
  try {
    // Check if Firebase UID already exists
    const checkUidQuery = 'SELECT id FROM Customer_Table_Details WHERE firebase_uid = $1';
    const uidCheck = await query(checkUidQuery, [firebaseUid]);
    
    if (uidCheck.rows.length > 0) {
      // User already exists, return existing user data
      const getUserQuery = `
        SELECT id, custom_user_id, full_name, phone_number, firebase_uid, email, created_at
        FROM Customer_Table_Details 
        WHERE firebase_uid = $1
      `;
      const existingUser = await query(getUserQuery, [firebaseUid]);
      
      // Create JWT token for existing user (no expiration - valid until logout)
      const token = jwt.sign(
        { 
          id: existingUser.rows[0].id, 
          custom_user_id: existingUser.rows[0].custom_user_id,
          firebase_uid: existingUser.rows[0].firebase_uid,
          role: 'customer'
        },
        process.env.JWT_SECRET || 'mua-secret-key'
        // No expiresIn - token valid until user explicitly logs out
      );
      
      console.log('User already exists with Firebase UID, returning existing data');
      return res.status(200).json({
        message: 'User already exists',
        user: {
          id: existingUser.rows[0].id,
          custom_user_id: existingUser.rows[0].custom_user_id,
          full_name: existingUser.rows[0].full_name,
          phone_number: existingUser.rows[0].phone_number,
          firebase_uid: existingUser.rows[0].firebase_uid,
          email: existingUser.rows[0].email,
          created_at: existingUser.rows[0].created_at
        },
        session: {
          access_token: token,
          refresh_token: token
        }
      });
    }
    
    // Check for duplicate phone number (only if phone number is provided)
    if (phoneNumber) {
      const checkPhoneQuery = 'SELECT id FROM Customer_Table_Details WHERE phone_number = $1';
      const phoneCheck = await query(checkPhoneQuery, [phoneNumber]);
      
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
    }
    
    // Check for duplicate email (only if email is provided)
    if (email) {
      const checkEmailQuery = 'SELECT id FROM Customer_Table_Details WHERE email = $1';
      const emailCheck = await query(checkEmailQuery, [email]);
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }
    
    // Insert the new record into Customer_Table_Details
    const insertQuery = `
      INSERT INTO Customer_Table_Details (
        full_name,
        phone_number,
        firebase_uid,
        device_id,
        device_info,
        email,
        password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, custom_user_id;
    `;
    
    // Use provided email if available
    // Use a placeholder password for Firebase users since they authenticate via phone
    const placeholderPassword = 'FIREBASE_AUTH_USER';
    
    // Prepare device info with timestamp
    const deviceInfoWithTimestamp = deviceInfo ? {
      ...deviceInfo,
      registeredAt: new Date().toISOString()
    } : null;
    
    const values = [
      fullName,
      phoneNumber || null, // Allow null for Google Sign-In users
      firebaseUid,
      deviceId || null,
      deviceInfoWithTimestamp ? JSON.stringify(deviceInfoWithTimestamp) : null,
      email || null, // Use provided email - IMPORTANT: This should not be null for Google auth
      placeholderPassword
    ];
    
    console.log('Executing Firebase user insert query with values:', {
      fullName: values[0],
      phoneNumber: values[1],
      firebaseUid: values[2] ? 'Provided' : 'Missing',
      deviceId: values[3] ? 'Provided' : 'Not provided',
      deviceInfo: values[4] ? 'Provided' : 'Not provided',
      email: values[5], // Log actual email value for debugging
      password: values[6] ? 'Set' : 'Missing'
    });
    
    const result = await query(insertQuery, values);
    console.log('Firebase customer registration successful with result:', {
      id: result.rows[0].id,
      custom_user_id: result.rows[0].custom_user_id
    });
    
    // Verify that the user was created with the correct email
    const verifyUserQuery = `
      SELECT id, custom_user_id, full_name, phone_number, firebase_uid, email, created_at
      FROM Customer_Table_Details 
      WHERE id = $1
    `;
    const verifyResult = await query(verifyUserQuery, [result.rows[0].id]);
    
    if (verifyResult.rows.length > 0) {
      const createdUser = verifyResult.rows[0];
      console.log('✅ User verification successful - Email saved correctly:', {
        id: createdUser.id,
        custom_user_id: createdUser.custom_user_id,
        email: createdUser.email,
        firebase_uid: createdUser.firebase_uid,
        full_name: createdUser.full_name
      });
      
      // Check if email was saved correctly for Google auth
      if (authProvider === 'google' && !createdUser.email) {
        console.error('❌ EMAIL NOT SAVED: Google auth user created without email!');
        console.error('Expected email:', email);
        console.error('Saved email:', createdUser.email);
        
        // Try to update the email manually
        try {
          await query('UPDATE Customer_Table_Details SET email = $1 WHERE id = $2', [email, createdUser.id]);
          console.log('✅ Email updated manually after creation');
        } catch (updateError) {
          console.error('❌ Failed to update email manually:', updateError);
        }
      }
    } else {
      console.error('❌ User verification failed - User not found after creation');
    }
    
    // Create JWT token for the new customer (no expiration - valid until logout)
    const token = jwt.sign(
      { 
        id: result.rows[0].id, 
        custom_user_id: result.rows[0].custom_user_id,
        firebase_uid: firebaseUid,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'mua-secret-key'
      // No expiresIn - token valid until user explicitly logs out
    );
    
    res.status(201).json({
      message: 'Firebase registration successful',
      user: {
        id: result.rows[0].id,
        custom_user_id: result.rows[0].custom_user_id,
        full_name: fullName,
        phone_number: phoneNumber || null,
        firebase_uid: firebaseUid,
        email: email || null
      },
      session: {
        access_token: token,
        refresh_token: token
      }
    });
  } catch (error) {
    console.error('Error during Firebase customer registration:', error);
    res.status(500).json({ 
      error: 'Firebase registration failed. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Get customer profile by Firebase UID
 * GET /api/customers/profile/:firebaseUid
 */
router.get('/profile/:firebaseUid', async (req, res) => {
  const { firebaseUid } = req.params;
  
  console.log('Fetching customer profile for Firebase UID:', firebaseUid);
  
  if (!firebaseUid) {
    return res.status(400).json({ error: 'Firebase UID is required' });
  }
  
  try {
    const getUserQuery = `
      SELECT id, custom_user_id, full_name, phone_number, email, firebase_uid, 
             created_at, updated_at
      FROM Customer_Table_Details 
      WHERE firebase_uid = $1
    `;
    
    const result = await query(getUserQuery, [firebaseUid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    console.log('Customer profile found:', user.id);
    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user.id,
        custom_user_id: user.custom_user_id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email,
        firebase_uid: user.firebase_uid,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Login customer
 * POST /api/customers/login
 */
router.post('/login', async (req, res) => {
  const { email, password, deviceId, deviceInfo } = req.body;
  
  console.log('Customer login attempt for email:', email);
  if (deviceInfo) {
    console.log('Device info received:', {
      deviceId: deviceInfo.deviceId,
      brand: deviceInfo.brand,
      osName: deviceInfo.osName,
      modelName: deviceInfo.modelName
    });
  }
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Query to find user with the provided email
    const dbQuery = `
      SELECT id, full_name, email, phone_number, password, device_id, custom_user_id
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
    
    // Update device ID and device info if provided
    const shouldUpdateDevice = deviceId && deviceId !== user.device_id;
    const shouldUpdateDeviceInfo = deviceInfo && Object.keys(deviceInfo).length > 0;
    
    if (shouldUpdateDevice || shouldUpdateDeviceInfo) {
      console.log(`Updating device information for user ${user.id}`);
      try {
        let updateQuery = 'UPDATE Customer_Table_Details SET ';
        let updateValues = [];
        let paramIndex = 1;
        
        if (shouldUpdateDevice) {
          updateQuery += `device_id = $${paramIndex}`;
          updateValues.push(deviceId);
          paramIndex++;
        }
        
        if (shouldUpdateDeviceInfo) {
          if (shouldUpdateDevice) updateQuery += ', ';
          updateQuery += `device_info = $${paramIndex}`;
          // Add timestamp to device info
          const deviceInfoWithTimestamp = {
            ...deviceInfo,
            lastLoginAt: new Date().toISOString(),
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
          };
          updateValues.push(JSON.stringify(deviceInfoWithTimestamp));
          paramIndex++;
        }
        
        updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
        updateValues.push(user.id);
        
        await query(updateQuery, updateValues);
        
        console.log('Device information updated successfully');
      } catch (updateErr) {
        console.error('Error updating device information:', updateErr);
        // Continue login process even if device update fails
      }
    }
    
    // Create JWT token (no expiration - valid until logout)
    const token = jwt.sign(
      { 
        id: user.id, 
        custom_user_id: user.custom_user_id,
        email: user.email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'mua-secret-key'
      // No expiresIn - token valid until user explicitly logs out
    );
    
    console.log('Login successful for customer:', user.id);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        custom_user_id: user.custom_user_id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number
      },
      session: {
        access_token: token,
        refresh_token: token
      }
    });
  } catch (error) {
    console.error('Error during customer login:', error);
    
    // Check if it's a database connection error
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Database service temporarily unavailable. Please try again later.',
        code: 'DATABASE_UNAVAILABLE',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    } else {
      res.status(500).json({ 
        error: 'Login failed. Please try again.',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
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
  const { email, latitude, longitude, referenceLatitude, referenceLongitude, calculatedDistance } = req.body;
  
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
    
    // Use pre-calculated distance from frontend if provided, otherwise calculate here
    let finalDistance = calculatedDistance;
    
    if (!finalDistance) {
      console.log('[CUSTOMER LOCATION] No pre-calculated distance provided, calculating on backend...');
      if (referenceLatitude !== undefined && referenceLongitude !== undefined) {
        finalDistance = calculateDistance(latitude, longitude, referenceLatitude, referenceLongitude);
        console.log(`[CUSTOMER LOCATION] Calculated distance: ${finalDistance} km from reference point (${referenceLatitude}, ${referenceLongitude})`);
      } else {
        // Use default reference point (you can change these coordinates to your business location)
        const defaultRefLat = 28.6139; // Delhi, India (example)
        const defaultRefLon = 77.2090;
        finalDistance = calculateDistance(latitude, longitude, defaultRefLat, defaultRefLon);
        console.log(`[CUSTOMER LOCATION] Calculated distance: ${finalDistance} km from default reference point (${defaultRefLat}, ${defaultRefLon})`);
      }
    } else {
      console.log(`[CUSTOMER LOCATION] Using pre-calculated distance from frontend: ${finalDistance} km`);
    }
    
    // Update location coordinates and distance
    const updateResult = await query(
      'UPDATE Customer_Table_Details SET latitude = $1, longitude = $2, distance = $3, updated_at = CURRENT_TIMESTAMP WHERE email = $4 RETURNING id, email, latitude, longitude, distance',
      [latitude, longitude, finalDistance, email]
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
 * Create customer record (for address flow)
 * POST /api/customers/create-customer
 */
router.post('/create-customer', async (req, res) => {
  const { customer_id, custom_user_id, full_name, phone_number, email, firebase_uid } = req.body;
  
  console.log('Create customer request received:', { 
    customer_id, 
    custom_user_id, 
    full_name,
    phone_number: phone_number || 'not provided',
    email: email || 'not provided',
    firebase_uid: firebase_uid || 'not provided'
  });
  
  // Input validation
  if (!customer_id || !custom_user_id || !full_name) {
    return res.status(400).json({ 
      success: false,
      error: "Customer ID, custom user ID, and full name are required" 
    });
  }
  
  try {
    // Check if customer already exists
    const checkCustomerQuery = 'SELECT id FROM Customer_Table_Details WHERE custom_user_id = $1 OR id = $2';
    const customerCheck = await query(checkCustomerQuery, [custom_user_id, customer_id]);
    
    if (customerCheck.rows.length > 0) {
      return res.status(200).json({ 
        success: true,
        message: "Customer already exists" 
      });
    }
    
    // Insert the new customer record
    const insertQuery = `
      INSERT INTO Customer_Table_Details (
        full_name,
        phone_number,
        email,
        firebase_uid,
        password
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, custom_user_id;
    `;
    
    const values = [
      full_name,
      phone_number || null,
      email || null,
      firebase_uid || null,
      'ADDRESS_FLOW_USER' // Placeholder password
    ];
    
    console.log('Executing create customer query');
    const result = await query(insertQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create customer'
      });
    }
    
    console.log('Customer created successfully:', result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        id: result.rows[0].id,
        custom_user_id: result.rows[0].custom_user_id
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create customer. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Save customer address
 * POST /api/customers/address
 */
router.post('/address', async (req, res) => {
  const { customUserId, houseBlockNo, apartmentArea, additionalNotes, addressLabel, phoneNumber } = req.body;
  
  console.log('Customer address save request received:', { 
    customUserId, 
    houseBlockNo, 
    apartmentArea,
    addressLabel: addressLabel || 'home',
    phoneNumber: phoneNumber || 'not provided'
  });
  
  // Input validation
  if (!customUserId || !houseBlockNo || !apartmentArea) {
    return res.status(400).json({ 
      success: false,
      error: "Customer ID, house/block number, and apartment/area are required" 
    });
  }
  
  try {
    // Check if customer exists - handle both string custom_user_id and numeric id
    let checkCustomerQuery, customerCheck;
    
    // First try to find by custom_user_id (string)
    checkCustomerQuery = 'SELECT id, custom_user_id FROM Customer_Table_Details WHERE custom_user_id = $1';
    customerCheck = await query(checkCustomerQuery, [customUserId]);
    
    // If not found by custom_user_id, try by id (if customUserId is numeric)
    if (customerCheck.rows.length === 0 && !isNaN(customUserId)) {
      checkCustomerQuery = 'SELECT id, custom_user_id FROM Customer_Table_Details WHERE id = $1';
      customerCheck = await query(checkCustomerQuery, [parseInt(customUserId)]);
    }
    
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Customer not found" 
      });
    }
    
    // Update the customer record with address information
    // Use the customer info we found to determine the correct field to update
    const customerInfo = customerCheck.rows[0];
    let updateQuery, values;
    
    if (customerInfo.custom_user_id === customUserId) {
      // Update by custom_user_id
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          house_block_no = $1,
          apartment_area = $2,
          additional_notes = $3,
          address_label = $4,
          phone_number = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE custom_user_id = $6
        RETURNING id, custom_user_id, house_block_no, apartment_area, additional_notes, address_label, phone_number;
      `;
      values = [
        houseBlockNo.trim(),
        apartmentArea.trim(),
        additionalNotes ? additionalNotes.trim() : null,
        addressLabel || 'home',
        phoneNumber ? phoneNumber.trim() : null,
        customUserId
      ];
    } else {
      // Update by id
      updateQuery = `
        UPDATE Customer_Table_Details 
        SET 
          house_block_no = $1,
          apartment_area = $2,
          additional_notes = $3,
          address_label = $4,
          phone_number = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, custom_user_id, house_block_no, apartment_area, additional_notes, address_label, phone_number;
      `;
      values = [
        houseBlockNo.trim(),
        apartmentArea.trim(),
        additionalNotes ? additionalNotes.trim() : null,
        addressLabel || 'home',
        phoneNumber ? phoneNumber.trim() : null,
        customerInfo.id
      ];
    }
    
    console.log('Executing address update query for customer:', customUserId);
    const result = await query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save address'
      });
    }
    
    console.log('Customer address saved successfully:', result.rows[0].id);
    
    res.status(200).json({
      success: true,
      message: 'Address saved successfully',
      data: {
        id: result.rows[0].id,
        customUserId: result.rows[0].custom_user_id,
        houseBlockNo: result.rows[0].house_block_no,
        apartmentArea: result.rows[0].apartment_area,
        additionalNotes: result.rows[0].additional_notes,
        addressLabel: result.rows[0].address_label,
        phoneNumber: result.rows[0].phone_number
      }
    });
  } catch (error) {
    console.error('Error saving customer address:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save address. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Get customer address
 * GET /api/customers/address/:customUserId
 */
router.get('/address/:customUserId', async (req, res) => {
  const { customUserId } = req.params;
  
  console.log('Fetching customer address for:', customUserId);
  
  if (!customUserId) {
    return res.status(400).json({ 
      success: false,
      error: 'Customer ID is required' 
    });
  }
  
  try {
    // First try to find by custom_user_id (string)
    let getAddressQuery = `
      SELECT id, custom_user_id, house_block_no, apartment_area, additional_notes, address_label, updated_at
      FROM Customer_Table_Details 
      WHERE custom_user_id = $1
      AND house_block_no IS NOT NULL 
      AND apartment_area IS NOT NULL
    `;
    
    let result = await query(getAddressQuery, [customUserId]);
    
    // If not found by custom_user_id, try by id (if customUserId is numeric)
    if (result.rows.length === 0 && !isNaN(customUserId)) {
      getAddressQuery = `
        SELECT id, custom_user_id, house_block_no, apartment_area, additional_notes, address_label, updated_at
        FROM Customer_Table_Details 
        WHERE id = $1
        AND house_block_no IS NOT NULL 
        AND apartment_area IS NOT NULL
      `;
      result = await query(getAddressQuery, [parseInt(customUserId)]);
    }
    
    if (result.rows.length === 0) {
      console.log('No address found for customer:', customUserId);
      return res.status(404).json({ 
        success: false,
        error: 'Address not found',
        hasAddress: false
      });
    }
    
    const addressData = result.rows[0];
    
    console.log('Customer address found:', addressData.id);
    res.json({
      success: true,
      message: 'Address retrieved successfully',
      hasAddress: true,
      data: {
        id: addressData.id,
        customUserId: addressData.custom_user_id,
        houseBlockNo: addressData.house_block_no,
        apartmentArea: addressData.apartment_area,
        additionalNotes: addressData.additional_notes,
        addressLabel: addressData.address_label,
        updatedAt: addressData.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching customer address:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch address. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

module.exports = router;