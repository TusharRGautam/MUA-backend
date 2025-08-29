const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../db');

/**
 * Register a new business owner
 * POST /api/business/register
 */
router.post('/register', async (req, res) => {
  const { businessName, ownerName, email, phoneNumber, password, businessType, gender, aadhaarCard, panCard } = req.body;
  
  console.log('Registration request received:', { businessName, ownerName, email, businessType, gender });
  
  // Input validation
  if (!ownerName || !email || !phoneNumber || !password || !businessType || !gender) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the new record into registration_and_other_details
    const insertQuery = `
      INSERT INTO registration_and_other_details (
        business_type,
        person_name,
        business_email,
        gender,
        phone_number,
        password,
        business_name,
        aadhaar_card,
        pan_card
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING sr_no, custom_user_id;
    `;
    
    const values = [
      businessType,
      ownerName,
      email,
      gender,
      phoneNumber,
      hashedPassword,
      businessName || ownerName, // Use ownerName as fallback if businessName not provided
      aadhaarCard || null, // Optional Aadhaar card
      panCard || null // Optional PAN card
    ];
    
    console.log('Executing insert query with values:', values.map((v, i) => i === 5 ? '[PASSWORD HIDDEN]' : v));
    const result = await query(insertQuery, values);
    console.log('Registration successful, returning data');
    
    // Create JWT token (no expiration - valid until logout)
    const token = jwt.sign(
      { 
        id: result.rows[0].sr_no,
        custom_user_id: result.rows[0].custom_user_id,
        email: email,
        business_type: businessType,
        role: 'business_owner'
      },
      process.env.JWT_SECRET || 'mua-secret-key'
      // No expiresIn - token valid until user explicitly logs out
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.rows[0].sr_no,
        custom_user_id: result.rows[0].custom_user_id,
        email: email,
        name: ownerName,
        business_name: businessName || ownerName,
        business_type: businessType
      },
      session: {
        access_token: token,
        refresh_token: token
      }
    });
  } catch (error) {
    console.error('Error registering business:', error);
    
    // Handle database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return res.status(500).json({ error: "Database connection failed" });
    }
    
    // Handle duplicate email
    if (error.code === '23505' && error.constraint === 'registration_and_other_details_business_email_key') {
      return res.status(400).json({ error: "Email already in use" });
    }
    
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/**
 * Login for business owner
 * POST /api/business/login
 */
router.post('/login', async (req, res) => {
  const { email, password, businessType } = req.body;
  
  console.log('Login attempt for email:', email, 'businessType:', businessType);
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Make sure JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      process.env.JWT_SECRET = 'mua-secret-key'; // Consistent fallback for all auth
    }

    // Query to find user with the provided email
    const dbQuery = `
      SELECT sr_no, person_name, business_email, phone_number, password, business_type, business_name, custom_user_id
      FROM registration_and_other_details
      WHERE business_email = $1
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
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.sr_no, 
        custom_user_id: user.custom_user_id,
        email: user.business_email,
        business_type: user.business_type,
        role: 'business_owner'
      },
      process.env.JWT_SECRET || 'mua-secret-key'
      // No expiresIn - token valid until user explicitly logs out
    );
    
    console.log('Login successful for business user:', user.sr_no);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.sr_no,
        custom_user_id: user.custom_user_id,
        email: user.business_email,
        name: user.person_name,
        business_name: user.business_name,
        business_type: user.business_type
      },
      session: {
        access_token: token,
        refresh_token: token
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    
    // Handle database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return res.status(500).json({ 
        error: "Database connection failed"
      });
    }
    
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Get unique salon service categories
 * GET /api/business/salon-categories
 */
router.get('/salon-categories', async (req, res) => {
  try {
    console.log('🏪 Fetching unique salon service categories from dashboard_salon_services');
    
    const categoriesQuery = `
      SELECT DISTINCT service_category 
      FROM dashboard_salon_services 
      WHERE service_category IS NOT NULL 
      AND service_category != '' 
      ORDER BY service_category;
    `;
    
    const result = await query(categoriesQuery);
    const categories = result.rows.map(row => row.service_category);
    
    console.log('🏪 Found salon categories:', categories);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching salon categories:', error);
    res.status(500).json({ error: 'Failed to fetch salon categories' });
  }
});

/**
 * Get unique PRP service categories
 * GET /api/business/prp-categories
 */
router.get('/prp-categories', async (req, res) => {
  try {
    console.log('💉 Fetching unique PRP service categories from dashboard_prp_services');
    
    const categoriesQuery = `
      SELECT DISTINCT service_category 
      FROM dashboard_prp_services 
      WHERE service_category IS NOT NULL 
      AND service_category != '' 
      ORDER BY service_category;
    `;
    
    const result = await query(categoriesQuery);
    const categories = result.rows.map(row => row.service_category);
    
    console.log('💉 Found PRP categories:', categories);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching PRP categories:', error);
    res.status(500).json({ error: 'Failed to fetch PRP categories' });
  }
});

/**
 * Get unique medical diagnostics service categories
 * GET /api/business/diagnostics-categories
 */
router.get('/diagnostics-categories', async (req, res) => {
  try {
    console.log('🏥 Fetching unique diagnostics service categories from dashboard_diagnostics_services');
    
    const categoriesQuery = `
      SELECT DISTINCT service_category 
      FROM dashboard_diagnostics_services 
      WHERE service_category IS NOT NULL 
      AND service_category != '' 
      ORDER BY service_category;
    `;
    
    const result = await query(categoriesQuery);
    const categories = result.rows.map(row => row.service_category);
    
    console.log('🏥 Found diagnostics categories:', categories);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching diagnostics categories:', error);
    res.status(500).json({ error: 'Failed to fetch diagnostics categories' });
  }
});

module.exports = router;