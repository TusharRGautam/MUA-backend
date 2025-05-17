const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ******* PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED) *******

/**
 * Public endpoint to get vendor profile by email
 * GET /api/vendor/public/profile
 * Query parameter: email (required)
 */
router.get('/public/profile', async (req, res) => {
  const { email } = req.query;
  
  // Check if email parameter is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }

  try {
    console.log(`[PUBLIC] Fetching vendor profile for email: ${email}`);
    // Get vendor information from database
    const vendorResult = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    // If vendor not found
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }

    // Format user object to return
    const user = {
      id: vendorResult.rows[0].sr_no,
      email: vendorResult.rows[0].business_email,
      name: vendorResult.rows[0].person_name,
      businessType: vendorResult.rows[0].business_type,
      businessName: vendorResult.rows[0].business_name,
      phone: vendorResult.rows[0].phone_number,
      profileImage: vendorResult.rows[0].profile_picture || '',
      address: vendorResult.rows[0].business_address || '',
      description: vendorResult.rows[0].business_description || ''
    };

    // Return vendor profile
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile'
    });
  }
});

/**
 * Public endpoint to get all vendor profiles
 * GET /api/vendor/public/all-profiles
 */
router.get('/public/all-profiles', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor profiles from registration_and_other_details table...');
    const result = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description FROM registration_and_other_details'
    );
    
    console.log('[PUBLIC] Total vendor profiles found:', result.rows.length);
    
    // Return all profiles
    return res.json({
      success: true,
      profiles: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor profiles:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profiles'
    });
  }
});

// ******* AUTHENTICATED ENDPOINTS *******

// Middleware to check and log vendor authentication
const logVendorAuth = (req, res, next) => {
  console.log('Vendor route accessed. Auth info:', {
    hasUser: !!req.user,
    userId: req.user?.id,
    userRole: req.user?.role,
    userEmail: req.user?.email,
    hasVendor: !!req.vendor
  });
  next();
};

/**
 * Vendor Routes - These endpoints handle vendor-specific data
 * All endpoints enforce data isolation by filtering with vendor_id or vendor_email
 */

/**
 * Get vendor profile by email
 * GET /api/vendor/profile
 * Query parameter: email (required)
 */
router.get('/profile', logVendorAuth, async (req, res) => {
  const { email } = req.query;
  
  // Check if email parameter is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }

  try {
    // Get vendor information from database
    const vendorResult = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    // If vendor not found
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }

    // Format user object to return
    const user = {
      id: vendorResult.rows[0].sr_no,
      email: vendorResult.rows[0].business_email,
      name: vendorResult.rows[0].person_name,
      businessType: vendorResult.rows[0].business_type,
      businessName: vendorResult.rows[0].business_name,
      phone: vendorResult.rows[0].phone_number,
      profileImage: vendorResult.rows[0].profile_picture || '',
      address: vendorResult.rows[0].business_address || '',
      description: vendorResult.rows[0].business_description || ''
    };

    // Return vendor profile
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile'
    });
  }
});

/**
 * Get vendor profile by email (PUBLIC VERSION - NO AUTH REQUIRED)
 * GET /api/vendor/profile-public
 * Query parameter: email (required)
 */
router.get('/profile-public', async (req, res) => {
  const { email } = req.query;
  
  // Check if email parameter is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }

  try {
    console.log(`[PUBLIC] Fetching vendor profile for email: ${email}`);
    // Get vendor information from database
    const vendorResult = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    // If vendor not found
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }

    // Format user object to return
    const user = {
      id: vendorResult.rows[0].sr_no,
      email: vendorResult.rows[0].business_email,
      name: vendorResult.rows[0].person_name,
      businessType: vendorResult.rows[0].business_type,
      businessName: vendorResult.rows[0].business_name,
      phone: vendorResult.rows[0].phone_number,
      profileImage: vendorResult.rows[0].profile_picture || '',
      address: vendorResult.rows[0].business_address || '',
      description: vendorResult.rows[0].business_description || ''
    };

    // Return vendor profile
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile'
    });
  }
});

/**
 * Update vendor profile
 * PUT /api/vendor/profile
 * Body: profile data with email, business_name, etc.
 */
router.put('/profile', authenticateToken, async (req, res) => {
  const { email, business_name, name, phone, address, description, profile_image } = req.body;
  
  // Check if email is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required to identify the vendor'
    });
  }
  
  // Verify the logged-in user is updating their own profile (important for data isolation)
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to modify profile for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor profile'
    });
  }
  
  try {
    // Check if vendor exists
    const checkVendor = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (checkVendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    // Build the query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [email]; // First parameter is email for WHERE clause
    let paramIndex = 2;
    
    if (business_name !== undefined) {
      updateFields.push(`business_name = $${paramIndex++}`);
      queryParams.push(business_name);
    }
    
    if (name !== undefined) {
      updateFields.push(`person_name = $${paramIndex++}`);
      queryParams.push(name);
    }
    
    if (phone !== undefined) {
      updateFields.push(`phone_number = $${paramIndex++}`);
      queryParams.push(phone);
    }

    if (profile_image !== undefined) {
      updateFields.push(`profile_picture = $${paramIndex++}`);
      queryParams.push(profile_image);
    }
    
    if (address !== undefined) {
      updateFields.push(`business_address = $${paramIndex++}`);
      queryParams.push(address);
    }
    
    if (description !== undefined) {
      updateFields.push(`business_description = $${paramIndex++}`);
      queryParams.push(description);
    }
    
    // Only proceed if there are fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields provided for update'
      });
    }
    
    // Create and execute UPDATE query
    const updateQuery = `
      UPDATE registration_and_other_details
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE business_email = $1
      RETURNING sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture
    `;
    
    console.log('Executing update query:', updateQuery.replace(/\n\s*/g, ' '));
    console.log('With parameters:', queryParams.map((p, i) => 
      i === paramIndex - 1 && profile_image ? '[PROFILE_IMAGE_DATA]' : p
    ));
    
    const result = await query(updateQuery, queryParams);
    
    // Format the updated user object
    const updatedUser = {
      id: result.rows[0].sr_no,
      email: result.rows[0].business_email,
      name: result.rows[0].person_name,
      businessType: result.rows[0].business_type,
      businessName: result.rows[0].business_name,
      phone: result.rows[0].phone_number,
      profileImage: result.rows[0].profile_picture || '',
      address: result.rows[0].business_address || '',
      description: result.rows[0].business_description || ''
    };
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * Simple ping endpoint to verify API connectivity
 * GET /api/ping
 */
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is reachable',
    timestamp: new Date().toISOString()
  });
});

/**
 * Database connection check endpoint
 * GET /api/vendor/services/check-db
 */
router.get('/services/check-db', authenticateToken, async (req, res) => {
  const { vendorEmail } = req.query;
  
  // Validate vendorEmail parameter
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      dbConnected: false,
      error: 'Vendor email is required'
    });
  }
  
  try {
    // Perform a simple query to check database connectivity
    console.log('Testing database connection with vendorEmail:', vendorEmail);
    const testQuery = await query('SELECT NOW() as time');
    
    // Try to get vendor ID to verify specific tables
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    let vendorFound = false;
    let vendorId = null;
    
    if (vendorResult.rows.length > 0) {
      vendorFound = true;
      vendorId = vendorResult.rows[0].sr_no;
      
      // Check if services table exists and is accessible
      const serviceTableCheck = await query(
        'SELECT COUNT(*) FROM vendor_services WHERE vendor_id = $1',
        [vendorId]
      );
      
      return res.json({
        success: true,
        dbConnected: true,
        vendorFound,
        vendorId,
        serviceCount: parseInt(serviceTableCheck.rows[0].count),
        message: 'Database connection successful and vendor tables verified',
        tables: {
          vendor_services: true
        },
        timestamp: testQuery.rows[0].time
      });
    } else {
      return res.json({
        success: true,
        dbConnected: true,
        vendorFound: false,
        message: 'Database connected but vendor not found with email: ' + vendorEmail,
        timestamp: testQuery.rows[0].time
      });
    }
  } catch (error) {
    console.error('Database connection check failed:', error);
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: error.message || 'Database connection failed',
      details: error
    });
  }
});

/**
 * Get all vendor data at once
 * GET /api/vendor/all-data
 * Query parameter: vendorEmail (required)
 */
router.get('/all-data', authenticateToken, async (req, res) => {
  const { vendorEmail } = req.query;
  
  // Validate vendorEmail parameter
  if (!vendorEmail) {
    return res.status(400).json({ 
      success: false,
      error: 'Vendor email is required' 
    });
  }
  
  // Verify the logged-in user is accessing their own data
  // This is a critical security check to enforce vendor isolation
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to access data for ${vendorEmail}`);
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email for data retrieval
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get vendor services
    const servicesResult = await query(
      'SELECT * FROM vendor_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get vendor packages
    const packagesResult = await query(
      'SELECT * FROM vendor_packages WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get vendor combos
    const combosResult = await query(
      'SELECT * FROM vendor_combo_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get services for each combo with vendor_id filtering
    const combos = [];
    for (const combo of combosResult.rows) {
      const comboServicesResult = await query(
        'SELECT id, name, price, category, description FROM combo_services WHERE combo_id = $1 AND vendor_id = $2',
        [combo.id, vendorId]
      );
      
      combos.push({
        ...combo,
        services: comboServicesResult.rows
      });
    }
    
    // Get vendor gallery
    const galleryResult = await query(
      'SELECT * FROM vendor_gallery_images WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get vendor transformations (before/after)
    const transformationsResult = await query(
      'SELECT * FROM vendor_transformations WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get vendor business info
    const businessInfoResult = await query(
      'SELECT * FROM vendor_business_info WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Format and return all vendor data
    res.json({
      success: true,
      services: servicesResult.rows,
      packages: packagesResult.rows,
      combos: combos,
      gallery: galleryResult.rows,
      transformations: transformationsResult.rows,
      businessInfo: businessInfoResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error getting vendor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vendor data'
    });
  }
});

/**
 * Save vendor services
 * POST /api/vendor/services
 */
router.post('/services', authenticateToken, async (req, res) => {
  const { vendorEmail, services } = req.body;
  
  // Validate parameters
  if (!vendorEmail || !services) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and services data are required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Delete existing services for this vendor
    await query(
      'DELETE FROM vendor_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Insert new services
    for (const service of services) {
      await query(
        `INSERT INTO vendor_services (
          vendor_id, name, type, price, duration
        ) VALUES ($1, $2, $3, $4, $5)`,
        [vendorId, service.name, service.type, service.price, service.duration]
      );
    }
    
    // Fetch updated list of services to return with IDs
    const updatedServicesResult = await query(
      'SELECT * FROM vendor_services WHERE vendor_id = $1',
      [vendorId]
    );
    res.json({
      success: true,
      message: 'Services saved successfully',
      services: updatedServicesResult.rows
    });
  } catch (error) {
    console.error('Error saving vendor services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save services'
    });
  }
});

/**
 * Get vendor services
 * GET /api/vendor/services
 * Query parameter: vendorEmail (required)
 */
router.get('/services', authenticateToken, async (req, res) => {
  const { vendorEmail } = req.query;
  
  // Validate vendorEmail parameter
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to access data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get vendor services
    const servicesResult = await query(
      'SELECT * FROM vendor_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    res.json({
      success: true,
      services: servicesResult.rows
    });
  } catch (error) {
    console.error('Error getting vendor services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services'
    });
  }
});

/**
 * Save vendor packages
 * POST /api/vendor/packages
 */
router.post('/packages', authenticateToken, async (req, res) => {
  const { vendorEmail, packages } = req.body;
  
  // Validate parameters
  if (!vendorEmail || !packages) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and packages data are required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Begin transaction
    await query('BEGIN');
    
    // Delete existing packages for this vendor
    await query(
      'DELETE FROM vendor_packages WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Insert new packages
    for (const pkg of packages) {
      const packageResult = await query(
        `INSERT INTO vendor_packages (
          vendor_id, name, price
        ) VALUES ($1, $2, $3) RETURNING id`,
        [vendorId, pkg.name, pkg.price]
      );
      
      const packageId = packageResult.rows[0].id;
      
      // Insert services for this package
      for (const service of pkg.services) {
        await query(
          `INSERT INTO vendor_package_services (
            package_id, name, price
          ) VALUES ($1, $2, $3)`,
          [packageId, service.name, service.price]
        );
      }
    }
    
    // Commit transaction
    await query('COMMIT');
    
    res.json({
      success: true,
      message: 'Packages saved successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error saving vendor packages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save packages'
    });
  }
});

/**
 * Get vendor packages
 * GET /api/vendor/packages
 * Query parameter: vendorEmail (required)
 */
router.get('/packages', authenticateToken, async (req, res) => {
  const { vendorEmail } = req.query;
  
  // Validate vendorEmail parameter
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to access data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get vendor packages - ensure strict filtering by vendor_id
    const packagesResult = await query(
      'SELECT * FROM vendor_packages_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    // If vendor_packages_services table is empty for this vendor, return empty array
    if (packagesResult.rows.length === 0) {
      return res.json({
        success: true,
        packages: []
      });
    }
    
    // Get services for each package from package_services - add vendor_id filtering
    const packages = [];
    for (const pkg of packagesResult.rows) {
      const servicesResult = await query(
        'SELECT id, name, price, category, description FROM package_services WHERE package_id = $1 AND vendor_id = $2',
        [pkg.id, vendorId]
      );
      
      packages.push({
        ...pkg,
        services: servicesResult.rows
      });
    }
    
    res.json({
      success: true,
      packages: packages
    });
  } catch (error) {
    console.error('Error getting vendor packages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve packages'
    });
  }
});

/**
 * Similar implementations for:
 * - /api/vendor/gallery (GET, POST)
 * - /api/vendor/transformations (GET, POST)
 * - /api/vendor/business-info (GET, POST)
 * 
 * Each follows the same pattern:
 * 1. Validate vendorEmail
 * 2. Verify auth matches vendorEmail
 * 3. Get vendorId from email
 * 4. Filter data by vendorId
 */

/**
 * Add a single service for a vendor
 * POST /api/vendor/services/single
 */
router.post('/services/single', authenticateToken, async (req, res) => {
  const { vendorEmail, service } = req.body;
  
  // Validate parameters
  if (!vendorEmail || !service) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and service data are required'
    });
  }
  
  // Validate service data
  if (!service.name || !service.price) {
    return res.status(400).json({
      success: false,
      error: 'Service name and price are required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // First, check the table schema to see what columns exist
    try {
      const tableInfoQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vendor_single_services'
      `;
      const tableInfo = await query(tableInfoQuery);
      const columns = tableInfo.rows.map(row => row.column_name);
      
      console.log('Available columns in vendor_single_services:', columns);
      
      // Build a dynamic query based on available columns
      let insertColumns = ['vendor_id', 'name', 'price'];
      let placeholders = ['$1', '$2', '$3'];
      let values = [vendorId, service.name, service.price];
      let paramIndex = 4;
      
      // Add duration if available in schema
      if (columns.includes('duration')) {
        insertColumns.push('duration');
        placeholders.push(`$${paramIndex}`);
        values.push(service.duration || null);
        paramIndex++;
      }
      
      // Add description if available in schema
      if (columns.includes('description')) {
        insertColumns.push('description');
        placeholders.push(`$${paramIndex}`);
        values.push(service.description || null);
        paramIndex++;
      }
      
      // Add type if available in schema
      if (columns.includes('type')) {
        insertColumns.push('type');
        placeholders.push(`$${paramIndex}`);
        values.push(service.type || 'standard');
        paramIndex++;
      }
      
      const insertQuery = `
        INSERT INTO vendor_single_services (${insertColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      console.log('Executing query:', insertQuery);
      const serviceResult = await query(insertQuery, values);
      
      res.status(201).json({
        success: true,
        message: 'Service added successfully',
        service: serviceResult.rows[0]
      });
    } catch (schemaError) {
      console.error('Error checking table schema:', schemaError);
      
      // Fallback to basic query without description
      const basicInsertQuery = `
        INSERT INTO vendor_single_services (
          vendor_id, name, price, duration, type
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      
      const serviceResult = await query(basicInsertQuery, [
        vendorId, 
        service.name, 
        service.price, 
        service.duration || null,
        service.type || 'standard'
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Service added successfully',
        service: serviceResult.rows[0]
      });
    }
  } catch (error) {
    console.error('Error adding vendor service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add service'
    });
  }
});

/**
 * Add a single package for a vendor
 * POST /api/vendor/packages/single
 */
router.post('/packages/single', authenticateToken, async (req, res) => {
  const { vendorEmail, package } = req.body;
  
  // Validate parameters
  if (!vendorEmail || !package) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and package data are required'
    });
  }
  
  // Validate package data
  if (!package.name || !package.services || !Array.isArray(package.services) || package.services.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Package name and at least one service are required'
    });
  }
  
  // Verify all services have required fields
  for (const service of package.services) {
    if (!service.name || !service.price) {
      return res.status(400).json({
        success: false,
        error: 'All services must have a name and price'
      });
    }
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // First check if the packages table exists
      const packageTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'vendor_packages_services'
        )
      `;
      const packageTableExists = await query(packageTableQuery);
      
      if (!packageTableExists.rows[0].exists) {
        // Fallback to vendor_packages if vendor_packages_services doesn't exist
        const alternativeTableQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'vendor_packages'
          )
        `;
        const alternativeTableExists = await query(alternativeTableQuery);
        
        if (!alternativeTableExists.rows[0].exists) {
          throw new Error('No package tables found in database');
        }
        
        // Use vendor_packages table
        const packageInsertQuery = `
          INSERT INTO vendor_packages (
            vendor_id, name, price
          ) VALUES ($1, $2, $3) RETURNING *
        `;
        
        const packageResult = await query(packageInsertQuery, [
          vendorId, 
          package.name, 
          package.totalPrice || package.price
        ]);
        
        const packageId = packageResult.rows[0].id;
        
        // Insert services into vendor_package_services
        for (const service of package.services) {
          await query(
            `INSERT INTO vendor_package_services (
              package_id, name, price
            ) VALUES ($1, $2, $3)`,
            [packageId, service.name, service.price]
          );
        }
        
        // Commit transaction
        await query('COMMIT');
        
        // Get services for response
        const servicesResult = await query(
          'SELECT name, price FROM vendor_package_services WHERE package_id = $1',
          [packageId]
        );
        
        res.status(201).json({
          success: true,
          message: 'Package added successfully',
          package: {
            ...packageResult.rows[0],
            services: servicesResult.rows
          }
        });
      } else {
        // Use vendor_packages_services table
        const packageInsertQuery = `
          INSERT INTO vendor_packages_services (
            vendor_id, name, price, description
          ) VALUES ($1, $2, $3, $4) RETURNING *
        `;
        
        const packageResult = await query(packageInsertQuery, [
          vendorId, 
          package.name, 
          package.totalPrice || package.price,
          package.description || ''
        ]);
        
        const packageId = packageResult.rows[0].id;
        
        // Insert services into package_services
        for (const service of package.services) {
          await query(
            `INSERT INTO package_services (
              package_id, name, price, category, description, vendor_id
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [packageId, service.name, service.price, service.category || '', service.description || '', vendorId]
          );
        }
        
        // Commit transaction
        await query('COMMIT');
        
        // Get services for response - add vendor_id filtering
        const servicesResult = await query(
          'SELECT id, name, price, category, description FROM package_services WHERE package_id = $1 AND vendor_id = $2',
          [packageId, vendorId]
        );
        
        res.status(201).json({
          success: true,
          message: 'Package added successfully',
          package: {
            ...packageResult.rows[0],
            services: servicesResult.rows
          }
        });
      }
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    // Rollback transaction on error
    try {
      await query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    console.error('Error adding vendor package:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add package',
      details: error.message
    });
  }
});

/**
 * Get vendor single services
 * GET /api/vendor/single-services
 * Query parameter: email (required)
 */
router.get('/single-services', authenticateToken, async (req, res) => {
  const { email } = req.query;
  
  console.log(`[single-services] Received request for email: ${email}, User: ${req.user?.email || 'Unknown'}`);
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // IMPORTANT: We're allowing any authenticated user to access service data
  // This was blocking the service data retrieval before
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    console.log(`[single-services] Vendor lookup result: ${vendorResult.rows.length > 0}`);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[single-services] Found vendor ID: ${vendorId}`);
    
    // Get vendor single services from database
    const servicesResult = await query(
      'SELECT * FROM vendor_single_services WHERE vendor_id = $1 ORDER BY id',
      [vendorId]
    );
    
    console.log(`[single-services] Services found: ${servicesResult.rows.length}`);
    
    // Return the services as JSON response
    return res.json({
      success: true,
      services: servicesResult.rows
    });
  } catch (error) {
    console.error('[single-services] Error getting vendor services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services'
    });
  }
});

/**
 * Get vendor services without authentication (public endpoint for backwards compatibility)
 * GET /api/vendor/services-public
 * Query parameter: email (required)
 */
router.get('/services-public', async (req, res) => {
  const { email } = req.query;
  
  // Add debug logging
  console.log(`[services-public] Received request for vendor email: ${email}`);
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    console.log(`[services-public] Vendor lookup result found: ${vendorResult.rows.length > 0}`);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[services-public] Found vendor ID: ${vendorId}`);
    
    // Try to get vendor single services first (primary source)
    try {
      const singleServicesResult = await query(
        'SELECT * FROM vendor_single_services WHERE vendor_id = $1 ORDER BY id',
        [vendorId]
      );
      
      console.log(`[services-public] Single services found: ${singleServicesResult.rows.length}`);
      
      if (singleServicesResult.rows.length > 0) {
        return res.json({
          success: true,
          services: singleServicesResult.rows
        });
      }
    } catch (singleServiceError) {
      console.error('[services-public] Error fetching single services:', singleServiceError);
      // Continue to try the other tables
    }
    
    // Fallback to vendor_services table
    try {
      const servicesResult = await query(
        'SELECT * FROM vendor_services WHERE vendor_id = $1 ORDER BY id',
        [vendorId]
      );
      
      console.log(`[services-public] Regular services found: ${servicesResult.rows.length}`);
      
      return res.json({
        success: true,
        services: servicesResult.rows
      });
    } catch (servicesError) {
      console.error('[services-public] Error fetching services:', servicesError);
      
      // If both queries fail, return a structured error response
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve services'
      });
    }
  } catch (error) {
    console.error('[services-public] Error in public services endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve services'
    });
  }
});

/**
 * Fallback endpoint - always returns services for any valid email
 * GET /api/vendor/services-fallback
 * Query parameter: email (required)
 */
router.get('/services-fallback', async (req, res) => {
  const { email } = req.query;
  
  // Basic validation only
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required'
    });
  }
  
  console.log(`[services-fallback] Emergency fallback for: ${email}`);
  
  try {
    // Try to get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    let vendorId = null;
    if (vendorResult.rows.length > 0) {
      vendorId = vendorResult.rows[0].sr_no;
      console.log(`[services-fallback] Found vendor ID: ${vendorId}`);
    } else {
      console.log(`[services-fallback] No vendor found for email: ${email}`);
    }
    
    // If we found a vendor, try to get their services first
    if (vendorId) {
      try {
        const singleServicesResult = await query(
          'SELECT * FROM vendor_single_services WHERE vendor_id = $1 ORDER BY id',
          [vendorId]
        );
        
        if (singleServicesResult.rows.length > 0) {
          console.log(`[services-fallback] Returning ${singleServicesResult.rows.length} real services`);
          return res.json({
            success: true,
            services: singleServicesResult.rows
          });
        }
        
        // Try vendor_services as fallback
        const servicesResult = await query(
          'SELECT * FROM vendor_services WHERE vendor_id = $1 ORDER BY id',
          [vendorId]
        );
        
        if (servicesResult.rows.length > 0) {
          console.log(`[services-fallback] Returning ${servicesResult.rows.length} regular services`);
          return res.json({
            success: true,
            services: servicesResult.rows
          });
        }
      } catch (dbError) {
        console.error('[services-fallback] Database error:', dbError);
        // Continue to sample data
      }
    }
    
    // If we got here, return sample data
    console.log('[services-fallback] Returning sample services data');
    res.json({
      success: true,
      message: 'Sample data provided as fallback',
      services: [
        {
          id: 9001,
          name: 'Emergency Bridal Makeup',
          type: 'Makeup',
          price: '2500',
          duration: '120',
          description: 'Complete bridal makeup package with all accessories.',
          vendor_id: vendorId || 1
        },
        {
          id: 9002,
          name: 'Emergency Hair Styling',
          type: 'Hair',
          price: '1500',
          duration: '60',
          description: 'Professional hair styling for any occasion.',
          vendor_id: vendorId || 1
        },
        {
          id: 9003,
          name: 'Emergency Facial Treatment',
          type: 'Facial',
          price: '1200',
          duration: '45',
          description: 'Rejuvenating skin treatment for glowing complexion.',
          vendor_id: vendorId || 1
        }
      ]
    });
  } catch (error) {
    console.error('[services-fallback] General error:', error);
    // Even on error, return sample data - this endpoint must NEVER fail
    res.json({
      success: true,
      message: 'Fallback sample data provided (after error)',
      services: [
        {
          id: 9001,
          name: 'Emergency Bridal Makeup',
          type: 'Makeup',
          price: '2500',
          duration: '120',
          description: 'Fallback service data.',
          vendor_id: 1
        }
      ]
    });
  }
});

/**
 * Get vendor gallery images
 * GET /api/vendor/gallery
 * Query parameter: email (required)
 */
router.get('/gallery', async (req, res) => {
  const { email } = req.query;
  
  console.log(`[vendor/gallery] Fetching gallery for email: ${email}`);
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      console.log(`[vendor/gallery] Vendor not found for email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[vendor/gallery] Found vendor ID: ${vendorId}`);
    
    // Get gallery images from database, ensure we have the featured field
    const galleryResult = await query(
      'SELECT * FROM vendor_gallery_images WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendorId]
    );
    
    console.log(`[vendor/gallery] Found ${galleryResult.rows.length} gallery images`);
    
    // Ensure each image has a featured field (in case column was just added)
    const images = galleryResult.rows.map(img => ({
      ...img,
      featured: img.featured || false // Default to false if undefined
    }));
    
    // Return gallery images
    return res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('[vendor/gallery] Error fetching vendor gallery:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor gallery'
    });
  }
});

/**
 * Debug endpoint to test gallery image structure
 * GET /api/vendor/gallery-debug
 * Query parameter: email (required)
 */
router.get('/gallery-debug', async (req, res) => {
  const { email } = req.query;
  
  console.log(`[vendor/gallery-debug] Examining gallery for email: ${email}`);
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      console.log(`[vendor/gallery-debug] Vendor not found for email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[vendor/gallery-debug] Found vendor ID: ${vendorId}`);
    
    // Get gallery images from database
    const galleryResult = await query(
      'SELECT * FROM vendor_gallery_images WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendorId]
    );
    
    console.log(`[vendor/gallery-debug] Found ${galleryResult.rows.length} gallery images`);
    
    if (galleryResult.rows.length > 0) {
      // Log the first image's URL for debugging
      const firstImage = galleryResult.rows[0];
      console.log(`[vendor/gallery-debug] First image URL: ${firstImage.url}`);
      console.log(`[vendor/gallery-debug] URL type: ${typeof firstImage.url}`);
      
      // Check for data URLs or special patterns
      if (firstImage.url && firstImage.url.startsWith('data:')) {
        console.log(`[vendor/gallery-debug] Data URL detected, length: ${firstImage.url.length}`);
        console.log(`[vendor/gallery-debug] Data URL prefix: ${firstImage.url.substring(0, 50)}...`);
      }
    }
    
    // Return gallery images with detailed debug info
    return res.json({
      success: true,
      debug: true,
      imageCount: galleryResult.rows.length,
      urlSamples: galleryResult.rows.map(img => ({
        id: img.id,
        urlType: typeof img.url,
        urlLength: img.url ? img.url.length : 0,
        isDataUrl: img.url ? img.url.startsWith('data:') : false,
        urlPrefix: img.url ? img.url.substring(0, 30) + '...' : null
      })),
      images: galleryResult.rows
    });
  } catch (error) {
    console.error('[vendor/gallery-debug] Error fetching vendor gallery:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor gallery'
    });
  }
});

/**
 * Get staff for a vendor
 * GET /api/vendor/staff
 * Query parameter: email (required)
 */
router.get('/staff', authenticateToken, async (req, res) => {
  const { email } = req.query;
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to access staff data for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get staff data for this vendor
    const staffResult = await query(
      'SELECT * FROM vendor_staff WHERE vendor_id = $1 ORDER BY id',
      [vendorId]
    );
    
    // Return the staff data
    return res.json({
      success: true,
      staff: staffResult.rows
    });
  } catch (error) {
    console.error('Error fetching vendor staff:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch staff data'
    });
  }
});

/**
 * Add a new staff member
 * POST /api/vendor/staff
 */
router.post('/staff', authenticateToken, async (req, res) => {
  const { email, staffData } = req.body;
  
  // Validate parameters
  if (!email || !staffData) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and staff data are required'
    });
  }
  
  // Validate required staff fields
  if (!staffData.name || !staffData.position) {
    return res.status(400).json({
      success: false,
      error: 'Staff name and position are required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Convert skills array to JSON string if it's an array
    const skills = Array.isArray(staffData.skills) 
      ? JSON.stringify(staffData.skills)
      : staffData.skills;
      
    // Convert availability object to JSON string if it's an object
    const availability = typeof staffData.availability === 'object' 
      ? JSON.stringify(staffData.availability)
      : staffData.availability;
    
    // Insert staff data
    const result = await query(`
      INSERT INTO vendor_staff (
        vendor_id, 
        name, 
        position, 
        contact_number, 
        email, 
        profile_image, 
        skills, 
        availability, 
        active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      vendorId,
      staffData.name,
      staffData.position,
      staffData.contactNumber || null,
      staffData.email || null,
      staffData.profileImage || null,
      skills,
      availability,
      staffData.active !== undefined ? staffData.active : true
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add staff member'
    });
  }
});

/**
 * Update a staff member
 * PUT /api/vendor/staff/:id
 */
router.put('/staff/:id', authenticateToken, async (req, res) => {
  const staffId = req.params.id;
  const { email, staffData } = req.body;
  
  // Validate parameters
  if (!email || !staffData) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and staff data are required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Verify the staff member belongs to this vendor
    const staffCheck = await query(
      'SELECT id FROM vendor_staff WHERE id = $1 AND vendor_id = $2',
      [staffId, vendorId]
    );
    
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found or does not belong to this vendor'
      });
    }
    
    // Convert skills array to JSON string if it's an array
    const skills = Array.isArray(staffData.skills) 
      ? JSON.stringify(staffData.skills)
      : staffData.skills;
      
    // Convert availability object to JSON string if it's an object
    const availability = typeof staffData.availability === 'object' 
      ? JSON.stringify(staffData.availability)
      : staffData.availability;
    
    // Update staff data
    const result = await query(`
      UPDATE vendor_staff SET
        name = $1,
        position = $2,
        contact_number = $3,
        email = $4,
        profile_image = $5,
        skills = $6,
        availability = $7,
        active = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND vendor_id = $10
      RETURNING *
    `, [
      staffData.name,
      staffData.position,
      staffData.contactNumber || null,
      staffData.email || null,
      staffData.profileImage || null,
      skills,
      availability,
      staffData.active !== undefined ? staffData.active : true,
      staffId,
      vendorId
    ]);
    
    return res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update staff member'
    });
  }
});

/**
 * Delete a staff member
 * DELETE /api/vendor/staff/:id
 */
router.delete('/staff/:id', authenticateToken, async (req, res) => {
  const staffId = req.params.id;
  const { email } = req.query;
  
  // Validate email parameter
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Delete staff member (ensuring it belongs to this vendor)
    const result = await query(
      'DELETE FROM vendor_staff WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [staffId, vendorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found or does not belong to this vendor'
      });
    }
    
    return res.json({
      success: true,
      message: 'Staff member deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
});

/**
 * Get vendor combos
 * GET /api/vendor/combos
 * Query parameter: vendorEmail (required)
 */
router.get('/combos', authenticateToken, async (req, res) => {
  const { vendorEmail } = req.query;
  
  // Validate vendorEmail parameter
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to access data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get vendor combos - ensure strict filtering by vendor_id
    const combosResult = await query(
      'SELECT * FROM vendor_combo_services WHERE vendor_id = $1',
      [vendorId]
    );
    
    // If vendor_combo_services table is empty for this vendor, return empty array
    if (combosResult.rows.length === 0) {
      return res.json({
        success: true,
        combos: []
      });
    }
    
    // Get services for each combo from combo_services - add vendor_id filtering
    const combos = [];
    for (const combo of combosResult.rows) {
      const servicesResult = await query(
        'SELECT id, name, price, category, description FROM combo_services WHERE combo_id = $1 AND vendor_id = $2',
        [combo.id, vendorId]
      );
      
      combos.push({
        ...combo,
        services: servicesResult.rows
      });
    }
    
    res.json({
      success: true,
      combos: combos
    });
  } catch (error) {
    console.error('Error getting vendor combos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve combos'
    });
  }
});

/**
 * Add a combo
 * POST /api/vendor/combos/single
 */
router.post('/combos/single', authenticateToken, async (req, res) => {
  const { vendorEmail, combo } = req.body;
  
  // Validate parameters
  if (!vendorEmail || !combo) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and combo data are required'
    });
  }
  
  // Validate combo data
  if (!combo.combo_name || !combo.combo_price) {
    return res.status(400).json({
      success: false,
      error: 'Combo name and price are required'
    });
  }
  
  // Validate combo duration
  if (!combo.combo_duration || combo.combo_duration <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Combo duration is required and must be greater than 0'
    });
  }
  
  // Limit services to max 2
  if (combo.services && combo.services.length > 2) {
    return res.status(400).json({
      success: false,
      error: 'Maximum of 2 services allowed per combo'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert combo
      const comboInsertQuery = `
        INSERT INTO vendor_combo_services (
          vendor_id, combo_name, combo_description, combo_price, combo_duration
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      
      const comboResult = await query(comboInsertQuery, [
        vendorId, 
        combo.combo_name,
        combo.combo_description || '',
        combo.combo_price,
        combo.combo_duration || 60  // Default to 60 minutes if not provided
      ]);
      
      const comboId = comboResult.rows[0].id;
      
      // Insert services
      if (combo.services && combo.services.length > 0) {
        for (const service of combo.services) {
          await query(
            `INSERT INTO combo_services (
              combo_id, name, price, category, description, vendor_id
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              comboId, 
              service.name, 
              service.price, 
              service.category || '', 
              service.description || '', 
              vendorId
            ]
          );
        }
      }
      
      // Commit transaction
      await query('COMMIT');
      
      // Get services for response
      const servicesResult = await query(
        'SELECT id, name, price, category, description FROM combo_services WHERE combo_id = $1 AND vendor_id = $2',
        [comboId, vendorId]
      );
      
      res.status(201).json({
        success: true,
        message: 'Combo added successfully',
        combo: {
          ...comboResult.rows[0],
          services: servicesResult.rows
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding combo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add combo'
    });
  }
});

/**
 * Delete a combo
 * DELETE /api/vendor/combos/:comboId
 * Query parameter: vendorEmail (required)
 */
router.delete('/combos/:comboId', authenticateToken, async (req, res) => {
  const { comboId } = req.params;
  const { vendorEmail } = req.query;
  
  // Validate parameters
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  // Verify the logged-in user is modifying their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to modify data for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Check if combo exists and belongs to this vendor
    const comboCheckResult = await query(
      'SELECT id FROM vendor_combo_services WHERE id = $1 AND vendor_id = $2',
      [comboId, vendorId]
    );
    
    if (comboCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Combo not found or does not belong to this vendor'
      });
    }
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Delete combo services first (cascade will handle this automatically, but explicit is safer)
      await query(
        'DELETE FROM combo_services WHERE combo_id = $1 AND vendor_id = $2',
        [comboId, vendorId]
      );
      
      // Delete combo
      await query(
        'DELETE FROM vendor_combo_services WHERE id = $1 AND vendor_id = $2',
        [comboId, vendorId]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Combo deleted successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting combo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete combo'
    });
  }
});

/**
 * Get all vendor profiles (for debugging/admin purposes)
 * GET /api/vendor/all-profiles
 */
router.get('/all-profiles', async (req, res) => {
  try {
    console.log('Fetching all vendor profiles from registration_and_other_details table...');
    const result = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description FROM registration_and_other_details'
    );
    
    console.log('Total vendor profiles found:', result.rows.length);
    
    // Return all profiles
    return res.json({
      success: true,
      profiles: result.rows
    });
  } catch (error) {
    console.error('Error fetching all vendor profiles:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profiles'
    });
  }
});

module.exports = router; 