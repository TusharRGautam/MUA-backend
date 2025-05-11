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

module.exports = router; 