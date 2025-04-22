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
  const { businessName, ownerName, email, phoneNumber, password, businessType, gender } = req.body;
  
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
        password
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING sr_no;
    `;
    
    const values = [
      businessType,
      ownerName,
      email,
      gender,
      phoneNumber,
      hashedPassword
    ];
    
    console.log('Executing insert query with values:', values.map((v, i) => i === 5 ? '[PASSWORD HIDDEN]' : v));
    const result = await query(insertQuery, values);
    console.log('Registration successful, returning data');
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.rows[0].sr_no,
        email: email,
        user_metadata: {
          business_name: businessName || ownerName,
          owner_name: ownerName,
          business_type: businessType
        }
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
  const { email, password } = req.body;
  
  console.log('Login attempt for email:', email);
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Query to find user with the provided email
    const dbQuery = `
      SELECT sr_no, business_email, password, person_name, business_type
      FROM registration_and_other_details
      WHERE business_email = $1
    `;
    const result = await query(dbQuery, [email]);

    if (result.rows.length === 0) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.sr_no, 
        email: user.business_email,
        role: 'business_owner' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.sr_no);
    res.json({
      message: 'Login successful',
      user: {
        id: user.sr_no,
        email: user.business_email,
        user_metadata: {
          owner_name: user.person_name,
          business_type: user.business_type
        }
      },
      token: token
    });
  } catch (error) {
    console.error('Error during login:', error);
    
    // Handle database connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return res.status(500).json({ error: "Database connection failed" });
    }
    
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router; 