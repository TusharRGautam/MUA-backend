const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { pool, query } = require('../../db'); // Import shared db connection

// Verify database connection is working using the imported pool
const verifyDbConnection = async () => {
  try {
    // Use the imported pool
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful via shared pool'); // Updated log
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
};

// Call this once when the router is initialized
verifyDbConnection();

// Business owner registration route
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, phoneNumber, password, businessType, gender } = req.body;

    console.log('Registration request received:', { 
      businessName, ownerName, email, businessType, gender 
    });

    // Input validation
    if (!ownerName || !email || !phoneNumber || !password || !businessType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Default gender to 'other' if not provided
    const userGender = gender || 'other';

    try {
      // Check database connection first
      const isConnected = await verifyDbConnection();
      if (!isConnected) {
        return res.status(500).json({ error: 'Database connection failed' });
      }

      // First, hash the password for security
      const bcrypt = require('bcrypt');
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
        userGender, // Use the default or provided gender
        phoneNumber,
        hashedPassword
      ];

      console.log('Executing query with values:', {
        businessType,
        ownerName,
      email,
        userGender,
        phoneNumber: phoneNumber.length // Just log the length for security
      });
      
      // Wrap in try/catch to get more detailed error information
      try {
        // Use the imported 'query' function or 'pool.query'
        const result = await query(insertQuery, values); // Use imported query
        console.log('Registration successful, record ID:', result.rows[0].sr_no);
        
        // Send a successful response
        return res.status(201).json({
          message: 'Business registration successful',
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
      } catch (queryError) {
        console.error('SQL error details:', queryError);
        
        // Handle duplicate email error
        if (queryError.code === '23505' && queryError.constraint === 'registration_and_other_details_business_email_key') {
          return res.status(400).json({ error: "Email already in use" });
        }
        
        // Check for table not existing error
        if (queryError.code === '42P01') {
          return res.status(500).json({ error: "Database table not found. Please ensure the migrations have been run." });
        }
        
        throw queryError; // Rethrow for general error handling
      }
    } catch (err) {
      console.error('Error in registration process:', err);
      
      // Handle database-specific errors
      if (err.code) {
        console.error('PostgreSQL error code:', err.code);
      }
      
      // Proceed with the existing error handling
      throw err;
    }
  } catch (error) {
    console.error('Business registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register business' });
  }
});

/**
 * Login for business owners
 * POST /login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, businessType } = req.body;
    
    console.log('Login attempt:', { email, businessType });

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try to find the user in registration_and_other_details table
    try {
      // Query the table for the provided email
      const dbQuery = 'SELECT * FROM registration_and_other_details WHERE business_email = $1'; // Renamed variable to avoid conflict
      // Use the imported 'query' function or 'pool.query'
      const result = await query(dbQuery, [email]); // Use imported query
      
      // Check if user exists
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      // Verify password
      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check if the business type matches what's in the database
      if (businessType && user.business_type !== businessType) {
        console.log('Business type mismatch:', { requested: businessType, actual: user.business_type });
        return res.status(403).json({ 
          error: 'Invalid business type',
          invalidRole: true,
          correctRole: user.business_type,
          message: `This account is registered as a ${user.business_type}. Please login with the correct business type.`
        });
      }
      
      // Generate a session token (in a real app, use JWT)
      const sessionToken = Math.random().toString(36).substring(2);
      
      // Return success response with user data
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.sr_no,
          email: user.business_email,
          person_name: user.person_name, 
          business_type: user.business_type,
          user_metadata: {
            person_name: user.person_name,
            business_type: user.business_type,
            gender: user.gender
          }
        },
        session: {
          access_token: sessionToken
        }
      });
    } catch (err) {
      console.error('Error querying registration_and_other_details:', err);
      
      // Continue with the existing Supabase auth if the new table fails
      throw err;
    }
  } catch (error) {
    console.error('Business login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login' });
  }
});

// Get business owner profile
router.get('/profile', async (req, res) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth Error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify if user is a business owner
    if (userData.user.user_metadata?.role !== 'business_owner') {
      return res.status(403).json({ error: 'User is not registered as a business owner' });
    }

    // Get business owner profile
    const { data: businessData, error: businessError } = await supabase
      .from('business_owners')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (businessError) {
      console.error('Business Profile Fetch Error:', businessError);
      if (businessError.message && businessError.message.includes('No rows found')) {
        return res.status(404).json({ error: 'Business profile not found' });
      }
      return res.status(500).json({ error: 'Error fetching business profile' });
    }

    res.json({
      user: {
        ...userData.user,
        businessProfile: businessData
      }
    });
  } catch (error) {
    console.error('Business Profile Fetch Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update business owner profile
router.put('/profile', async (req, res) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth Error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify if user is a business owner
    if (userData.user.user_metadata?.role !== 'business_owner') {
      return res.status(403).json({ error: 'User is not registered as a business owner' });
    }

    const { 
      businessName, 
      ownerName, 
      phoneNumber, 
      businessType,
      address,
      website,
      bio,
      logoUrl 
    } = req.body;

    // Update business owner profile
    const { data: businessData, error: businessError } = await supabase
      .from('business_owners')
      .update({
        business_name: businessName,
        owner_name: ownerName,
        phone_number: phoneNumber,
        business_type: businessType,
        address,
        website,
        bio,
        logo_url: logoUrl,
        updated_at: new Date()
      })
      .eq('id', userData.user.id)
      .select()
      .single();

    if (businessError) {
      console.error('Business Profile Update Error:', businessError);
      return res.status(500).json({ error: 'Error updating business profile' });
    }

    res.json({
      message: 'Business profile updated successfully',
      profile: businessData
    });
  } catch (error) {
    console.error('Business Profile Update Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a service to business
router.post('/services', async (req, res) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth Error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify if user is a business owner
    if (userData.user.user_metadata?.role !== 'business_owner') {
      return res.status(403).json({ error: 'User is not registered as a business owner' });
    }

    const { name, description, price, duration, imageUrl, active } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Service name and price are required' });
    }

    // Create service
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .insert([
        {
          business_id: userData.user.id,
          name,
          description,
          price,
          duration,
          image_url: imageUrl,
          active: active !== undefined ? active : true
        }
      ])
      .select();

    if (serviceError) {
      console.error('Service Creation Error:', serviceError);
      return res.status(500).json({ error: 'Error creating service' });
    }

    res.status(201).json({
      message: 'Service created successfully',
      service: serviceData[0]
    });
  } catch (error) {
    console.error('Service Creation Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all services for a business
router.get('/services', async (req, res) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth Error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify if user is a business owner
    if (userData.user.user_metadata?.role !== 'business_owner') {
      return res.status(403).json({ error: 'User is not registered as a business owner' });
    }

    // Get services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('Services Fetch Error:', servicesError);
      return res.status(500).json({ error: 'Error fetching services' });
    }

    res.json({
      services: servicesData
    });
  } catch (error) {
    console.error('Services Fetch Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 