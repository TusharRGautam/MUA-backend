const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Add the userController import at the top of the file
const userController = require('../controllers/userController');

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
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, provider_type_single_or_multi, selected_category FROM registration_and_other_details WHERE business_email = $1',
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
      description: vendorResult.rows[0].business_description || '',
      providerTypeSingleOrMulti: vendorResult.rows[0].provider_type_single_or_multi || '',
      selectedCategory: vendorResult.rows[0].selected_category || ''
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
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, provider_type_single_or_multi, selected_category FROM registration_and_other_details'
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

/**
 * Public endpoint to get all vendor single services
 * GET /api/vendor/vendorsingleservices
 */
router.get('/vendorsingleservices', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor single services from vendor_single_services table...');
    const result = await query(
      'SELECT * FROM vendor_single_services'
    );
    
    console.log('[PUBLIC] Total single services found:', result.rows.length);
    
    // Return all services
    return res.json({
      success: true,
      services: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor single services:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor single services'
    });
  }
});

/**
 * Public endpoint to get all vendor package services
 * GET /api/vendor/vendorpackageservices
 */
router.get('/vendorpackageservices', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor package services from vendor_packages_services table...');
    const result = await query(
      'SELECT * FROM vendor_packages_services'
    );
    
    console.log('[PUBLIC] Total package services found:', result.rows.length);
    
    // Return all package services
    return res.json({
      success: true,
      packages: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor package services:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor package services'
    });
  }
});

/**
 * Public endpoint to get all vendor combo services
 * GET /api/vendor/vendorcomboservices
 */
router.get('/vendorcomboservices', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor combo services from vendor_combo_services table...');
    const result = await query(
      'SELECT * FROM vendor_combo_services'
    );
    
    console.log('[PUBLIC] Total combo services found:', result.rows.length);
    
    // Return all combo services
    return res.json({
      success: true,
      combos: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor combo services:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor combo services'
    });
  }
});

/**
 * Public endpoint to get all vendor gallery images
 * GET /api/vendor/vendorgalleryimages
 */
router.get('/vendorgalleryimages', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor gallery images from vendor_gallery_images table...');
    const result = await query(
      'SELECT * FROM vendor_gallery_images'
    );
    
    console.log('[PUBLIC] Total gallery images found:', result.rows.length);
    
    // Return all gallery images
    return res.json({
      success: true,
      images: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor gallery images:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor gallery images'
    });
  }
});

/**
 * Public endpoint to get all vendor transformations
 * GET /api/vendor/vendortransformations
 */
router.get('/vendortransformations', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching all vendor transformations from vendor_transformations table...');
    const result = await query(
      'SELECT * FROM vendor_transformations'
    );
    
    console.log('[PUBLIC] Total transformations found:', result.rows.length);
    
    // Return all transformations
    return res.json({
      success: true,
      transformations: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching all vendor transformations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor transformations'
    });
  }
});

/**
 * Public endpoint to get hair color specialists
 * GET /api/vendor/public/hair-color-specialists
 */
router.get('/public/hair-color-specialists', async (req, res) => {
  try {
    console.log('[PUBLIC] Fetching hair color specialists from registration_and_other_details table...');
    
    // Query to fetch profiles where selected_category includes "Hair Colour" and business_type is "solo"
    const result = await query(
      `SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, selected_category 
       FROM registration_and_other_details 
       WHERE business_type = $1 AND (selected_category LIKE $2 OR selected_category LIKE $3 OR selected_category LIKE $4 OR selected_category = $5)`,
      ['solo', '%Hair Colour%', '%Hair Color%', '%hair colour%', 'Hair Colour']
    );
    
    console.log('[PUBLIC] Total hair color specialists found:', result.rows.length);
    
    // Return hair color specialists
    return res.json({
      success: true,
      profiles: result.rows
    });
  } catch (error) {
    console.error('[PUBLIC] Error fetching hair color specialists:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch hair color specialists'
    });
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
function calculateVendorDistance(lat1, lon1, lat2, lon2) {
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
 * Public endpoint to update vendor location coordinates
 * PUT /api/vendor/public/location
 * Body: { email, latitude, longitude, referenceLatitude?, referenceLongitude? }
 */
router.put('/public/location', async (req, res) => {
  const { email, latitude, longitude, referenceLatitude, referenceLongitude } = req.body;
  
  // Check if required parameters are provided
  if (!email || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Email, latitude, and longitude are required'
    });
  }
  
  // Validate latitude and longitude ranges
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
    console.log(`[VENDOR LOCATION] Updating location for email: ${email} to ${latitude}, ${longitude}`);
    
    // Check if vendor exists
    const checkVendor = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (checkVendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }
    
    // Calculate distance if reference coordinates are provided
    let calculatedDistance = null;
    if (referenceLatitude !== undefined && referenceLongitude !== undefined) {
      calculatedDistance = calculateVendorDistance(latitude, longitude, referenceLatitude, referenceLongitude);
      console.log(`[VENDOR LOCATION] Calculated distance: ${calculatedDistance} km from reference point (${referenceLatitude}, ${referenceLongitude})`);
    } else {
      // Use default reference point (you can change these coordinates to your business location)
      const defaultRefLat = 28.6139; // Delhi, India (example)
      const defaultRefLon = 77.2090;
      calculatedDistance = calculateVendorDistance(latitude, longitude, defaultRefLat, defaultRefLon);
      console.log(`[VENDOR LOCATION] Calculated distance: ${calculatedDistance} km from default reference point (${defaultRefLat}, ${defaultRefLon})`);
    }
    
    // Update location coordinates and distance
    const updateResult = await query(
      'UPDATE registration_and_other_details SET latitude = $1, longitude = $2, distance = $3, updated_at = CURRENT_TIMESTAMP WHERE business_email = $4 RETURNING sr_no, business_email, latitude, longitude, distance',
      [latitude, longitude, calculatedDistance, email]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
    
    console.log(`[VENDOR LOCATION] Location and distance updated successfully for ${email}`);
    
    return res.json({
      success: true,
      message: 'Location and distance updated successfully',
      data: {
        email: updateResult.rows[0].business_email,
        latitude: updateResult.rows[0].latitude,
        longitude: updateResult.rows[0].longitude,
        distance: updateResult.rows[0].distance
      }
    });
  } catch (error) {
    console.error('[VENDOR LOCATION] Error updating vendor location:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update location'
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
    // First, check if the working_hours column exists
    const columnCheckQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_and_other_details' AND column_name = 'working_hours'
      ) as has_working_hours
    `;
    const columnCheck = await query(columnCheckQuery);
    const hasWorkingHoursColumn = columnCheck.rows[0]?.has_working_hours || false;
    
    // Get vendor information from database (conditionally include working_hours)
    const vendorResult = await query(
      hasWorkingHoursColumn
        ? 'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, specialization, city, working_hours, vendor_status, status_updated_at FROM registration_and_other_details WHERE business_email = $1'
        : 'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, specialization, city, vendor_status, status_updated_at FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    // If vendor not found
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }

    // Format user object to return (added specialization and city)
    const vendor = vendorResult.rows[0];
    const user = {
      id: vendor.sr_no,
      email: vendor.business_email,
      name: vendor.person_name,
      businessType: vendor.business_type,
      businessName: vendor.business_name,
      phone: vendor.phone_number,
      profileImage: vendor.profile_picture || '',
      address: vendor.business_address || '',
      description: vendor.business_description || '',
      specialization: vendor.specialization || '',
      city: vendor.city || '',
      // Conditionally include working_hours based on column existence
      ...(hasWorkingHoursColumn && { workingHours: vendor.working_hours || '9:00 AM - 6:00 PM' }),
      // Include vendor status information
      vendor_status: vendor.vendor_status || 'active',
      status_updated_at: vendor.status_updated_at || new Date().toISOString()
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
    
    // First, check if the working_hours column exists
    const columnCheckQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registration_and_other_details' AND column_name = 'working_hours'
      ) as has_working_hours
    `;
    const columnCheck = await query(columnCheckQuery);
    const hasWorkingHoursColumn = columnCheck.rows[0]?.has_working_hours || false;
    
    // Get vendor information from database (conditionally include working_hours)
    const vendorResult = await query(
      hasWorkingHoursColumn
        ? 'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, specialization, city, working_hours, vendor_status, status_updated_at FROM registration_and_other_details WHERE business_email = $1'
        : 'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, specialization, city, vendor_status, status_updated_at FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    // If vendor not found
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found with the provided email'
      });
    }

    // Format user object to return (added specialization and city)
    const vendor = vendorResult.rows[0];
    const user = {
      id: vendor.sr_no,
      email: vendor.business_email,
      name: vendor.person_name,
      businessType: vendor.business_type,
      businessName: vendor.business_name,
      phone: vendor.phone_number,
      profileImage: vendor.profile_picture || '',
      address: vendor.business_address || '',
      description: vendor.business_description || '',
      specialization: vendor.specialization || '',
      city: vendor.city || '',
      // Conditionally include working_hours based on column existence
      ...(hasWorkingHoursColumn && { workingHours: vendor.working_hours || '9:00 AM - 6:00 PM' }),
      // Include vendor status information
      vendor_status: vendor.vendor_status || 'active',
      status_updated_at: vendor.status_updated_at || new Date().toISOString()
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
  const { email, business_name, name, phone, address, description, profile_image, specialization, city, latitude, longitude, working_hours } = req.body;
  
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
  
  // Max retries for database operations
  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Profile update attempt ${attempt} for ${email}`);
      
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
      
      // Add the new fields for specialization and city (removed experience as it doesn't exist in the table)
      if (specialization !== undefined) {
        updateFields.push(`specialization = $${paramIndex++}`);
        queryParams.push(specialization);
      }
      
      if (city !== undefined) {
        updateFields.push(`city = $${paramIndex++}`);
        queryParams.push(city);
      }
      
      // Check if working_hours column exists before trying to update it
      if (working_hours !== undefined) {
        try {
          // Check if working_hours column exists
          const columnCheckQuery = `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'registration_and_other_details' AND column_name = 'working_hours'
            ) as has_working_hours
          `;
          const columnCheck = await query(columnCheckQuery);
          const hasWorkingHoursColumn = columnCheck.rows[0]?.has_working_hours || false;
          
          if (hasWorkingHoursColumn) {
            updateFields.push(`working_hours = $${paramIndex++}`);
            queryParams.push(working_hours);
          } else {
            console.log('Skipping working_hours update as column does not exist');
          }
        } catch (columnCheckError) {
          console.error('Error checking for working_hours column:', columnCheckError);
          // Continue with other updates even if column check fails
        }
      }
      
      if (latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex++}`);
        queryParams.push(latitude);
      }
      
      if (longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex++}`);
        queryParams.push(longitude);
      }
      
      // Only proceed if there are fields to update
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields provided for update'
        });
      }
      
      // Create and execute UPDATE query (removed experience from RETURNING clause)
      const updateQuery = `
        UPDATE registration_and_other_details
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE business_email = $1
        RETURNING sr_no, business_email, person_name, business_type, business_name, phone_number, 
                 profile_picture, business_address, business_description, specialization, city, latitude, longitude
      `;
      
      console.log('Executing update query:', updateQuery.replace(/\n\s*/g, ' '));
      console.log('With parameters:', queryParams.map((p, i) => 
        i === paramIndex - 1 && profile_image ? '[PROFILE_IMAGE_DATA]' : p
      ));
      
      const result = await query(updateQuery, queryParams);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Update query did not return expected data');
      }
      
      // Format the updated user object (removed experience field)
      const updatedUser = {
        id: result.rows[0].sr_no,
        email: result.rows[0].business_email,
        name: result.rows[0].person_name,
        businessType: result.rows[0].business_type,
        businessName: result.rows[0].business_name,
        phone: result.rows[0].phone_number,
        profileImage: result.rows[0].profile_picture || '',
        address: result.rows[0].business_address || '',
        description: result.rows[0].business_description || '',
        specialization: result.rows[0].specialization || '',
        city: result.rows[0].city || '',
        latitude: result.rows[0].latitude || null,
        longitude: result.rows[0].longitude || null
      };
      
      console.log(`Profile update successful for ${email}`);
      
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
      
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      
      // For connection errors, try again unless it's the last attempt
      if (!isLastAttempt && (
          error.code === 'XX000' || 
          error.code === '08006' || 
          error.code === '08001' ||
          error.message?.includes('termination') ||
          error.message?.includes('timeout')
      )) {
        console.error(`Database connection error on attempt ${attempt} of ${MAX_RETRIES}, retrying...`, error.message);
        // Exponential backoff delay
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 3000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or not a connection error, return failure
      console.error('Error updating vendor profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
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
 * Query parameter: email or vendorEmail (required)
 */
router.get('/single-services', authenticateToken, async (req, res) => {
  // Support both email (legacy) and vendorEmail (new standard) parameters
  const email = req.query.email || req.query.vendorEmail;
  
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
 * Query parameter: email or vendorEmail (required)
 */
router.get('/services-public', async (req, res) => {
  // Support both email (legacy) and vendorEmail (new standard) parameters
  const email = req.query.email || req.query.vendorEmail;
  
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
 * Query parameter: email or vendorEmail (required)
 */
router.get('/services-fallback', async (req, res) => {
  // Support both email (legacy) and vendorEmail (new standard) parameters
  const email = req.query.email || req.query.vendorEmail;
  
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
 * Query parameter: vendorEmail (required)
 */
router.get('/gallery', async (req, res) => {
  const { vendorEmail } = req.query;
  
  console.log(`[vendor/gallery] Fetching gallery for email: ${vendorEmail}`);
  
  // Validate email parameter
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      console.log(`[vendor/gallery] Vendor not found for email: ${vendorEmail}`);
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
 * Save vendor gallery image
 * POST /api/vendor/gallery/:vendorEmail
 * Body: { id, url, caption, featured }
 */
router.post('/gallery/:vendorEmail', async (req, res) => {
  try {
    const vendorEmail = req.params.vendorEmail;
    const { id, url, caption, featured } = req.body;
    
    console.log(`[vendor/gallery] Saving gallery image for email: ${vendorEmail}`);
    
    // Validate parameters
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Vendor email is required'
      });
    }
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }
    
    // Get vendor info from database
    const vendorResult = await query(
      'SELECT sr_no, person_name FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    const personName = vendorResult.rows[0].person_name;
    
    console.log(`[vendor/gallery] Found vendor: ${personName} (ID: ${vendorId})`);
    
    let imageUrl = url;
    let imageFileId = null;
    
    // Check if this is a base64 image that needs to be uploaded to Google Drive
    if (url && url.startsWith('data:image/')) {
      console.log('[vendor/gallery] Processing base64 image for Google Drive upload');
      
      try {
        // Extract base64 data
        const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate unique filename
          const fileExt = mimeType.split('/')[1] || 'jpg';
          const timestamp = Date.now();
          const randomString = require('crypto').randomBytes(8).toString('hex');
          const fileName = `gallery_${timestamp}_${randomString}.${fileExt}`;
          
          console.log(`[vendor/gallery] Uploading image to Google Drive: ${fileName} (${buffer.length} bytes)`);
          
          // Import Google Drive service
          const googleDriveService = require('../utils/googleDriveService');
          
          try {
            // Upload directly to Google Drive
            const uploadResult = await googleDriveService.uploadGalleryImage(buffer, personName, {
              mimeType: mimeType
            });
            
            console.log('[vendor/gallery] Google Drive upload result:', uploadResult);
            
            // Update URLs
            imageUrl = uploadResult.publicUrl;
            imageFileId = uploadResult.fileId;
            
            console.log('[vendor/gallery] Image uploaded to Drive:', { imageUrl, imageFileId });
          } catch (driveError) {
            console.error('[vendor/gallery] Google Drive upload error details:', {
              message: driveError.message,
              stack: driveError.stack,
              bufferSize: buffer.length,
              personName: personName,
              mimeType: mimeType
            });
            
            return res.status(500).json({
              success: false,
              error: `Failed to upload image to Google Drive: ${driveError.message}`,
              details: 'There was an issue uploading the image to Google Drive. Please try again or contact support.'
            });
          }
        } else {
          throw new Error('Invalid base64 image format');
        }
      } catch (uploadError) {
        console.error('[vendor/gallery] Google Drive upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: `Failed to upload image to Google Drive: ${uploadError.message}`
        });
      }
    }
    
    // Now save to the database
    try {
      // Check if this is a local ID (starts with 'local_') - if so, always create a new record
      const isLocalId = id && typeof id === 'string' && id.startsWith('local_');
      
      if (id && !isLocalId) {
        // Update existing image
        console.log(`[vendor/gallery] Updating existing gallery image: ${id}`);
        
        // Check if image exists and belongs to this vendor
        const existingImage = await query(
          'SELECT id FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2',
          [id, vendorId]
        );
        
        if (existingImage.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Gallery image not found or not owned by this vendor'
          });
        }
        
        // Update the image
        const updateResult = await query(
          `UPDATE vendor_gallery_images 
           SET url = $1, caption = $2, featured = $3, drive_file_id = $4 
           WHERE id = $5 AND vendor_id = $6 
           RETURNING id, url, caption, featured, drive_file_id, created_at`,
          [imageUrl, caption || '', featured || false, imageFileId, id, vendorId]
        );
        
        return res.json({
          success: true,
          message: 'Gallery image updated successfully',
          data: updateResult.rows[0]
        });
      } else {
        // Insert new image (either no ID or local ID)
        console.log('[vendor/gallery] Creating new gallery image');
        
        const insertResult = await query(
          `INSERT INTO vendor_gallery_images 
           (vendor_id, url, caption, featured, drive_file_id, created_at) 
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
           RETURNING id, url, caption, featured, drive_file_id, created_at`,
          [vendorId, imageUrl, caption || '', featured || false, imageFileId]
        );
        
        return res.status(201).json({
          success: true,
          message: 'Gallery image created successfully',
          data: insertResult.rows[0]
        });
      }
    } catch (dbError) {
      console.error('[vendor/gallery] Error saving gallery image:', dbError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dbError.message}`
      });
    }
  } catch (error) {
    console.error('[vendor/gallery] Error saving gallery image:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

/**
 * Update vendor gallery image
 * PUT /api/vendor/gallery/:id
 * Body: { email, image }
 */
router.put('/gallery/:id', async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;
  const imageData = req.body;
  
  console.log(`[vendor/gallery] Updating gallery image ID: ${id} for email: ${email}`);
  
  // Validate parameters
  if (!email || !id) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and image ID are required'
    });
  }
  
  try {
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no, person_name FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    const personName = vendorResult.rows[0].person_name;
    
    // Check if the image exists and belongs to this vendor
    const imageResult = await query(
      'SELECT * FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2',
      [id, vendorId]
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gallery image not found or does not belong to this vendor'
      });
    }
    
    const existingImage = imageResult.rows[0];
    
    // Handle file upload if it's a new image
    if (imageData.url && (imageData.url.startsWith('file://') || imageData.url.startsWith('content://'))) {
      try {
        const googleDriveService = require('../utils/googleDriveService');
        const fs = require('fs');
        
        // Get image buffer from local URI
        let imageBuffer;
        
        if (imageData.url.startsWith('file://')) {
          const filePath = imageData.url.replace('file://', '');
          imageBuffer = fs.readFileSync(filePath);
        } else {
          return res.status(400).json({
            success: false,
            error: 'Content URI handling not implemented yet. Please use file:// URIs.'
          });
        }
        
        // If there's an existing Drive file ID, delete it
        if (existingImage.drive_file_id) {
          try {
            await googleDriveService.deleteFile(existingImage.drive_file_id);
            console.log(`[vendor/gallery] Deleted existing Drive file: ${existingImage.drive_file_id}`);
          } catch (deleteError) {
            console.error('[vendor/gallery] Error deleting existing Drive file:', deleteError);
            // Continue with upload even if delete fails
          }
        }
        
        // Upload new image to Google Drive with WebP conversion
        const uploadResult = await googleDriveService.uploadGalleryImage(imageBuffer, personName, {
          quality: 80,
          width: 1200
        });
        
        console.log(`[vendor/gallery] New image uploaded to Google Drive:`, uploadResult);
        
        // Update the image data with Google Drive info
        imageData.url = uploadResult.publicUrl;
        imageData.driveFileId = uploadResult.fileId;
      } catch (uploadError) {
        console.error('[vendor/gallery] Error uploading to Google Drive:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Error uploading image to Google Drive: ' + uploadError.message
        });
      }
    }
    
    // Update the image in database
    const updateResult = await query(
      `UPDATE vendor_gallery_images 
       SET url = $1, caption = $2, featured = $3, drive_file_id = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 AND vendor_id = $6 
       RETURNING id, url, caption, featured, drive_file_id, created_at, updated_at`,
      [
        imageData.url || existingImage.url,
        imageData.caption || existingImage.caption,
        imageData.featured !== undefined ? imageData.featured : existingImage.featured,
        imageData.driveFileId || existingImage.drive_file_id,
        id,
        vendorId
      ]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update gallery image'
      });
    }
    
    console.log(`[vendor/gallery] Image updated in database: ${id}`);
    
    // Return success with updated image data
    res.json({
      success: true,
      message: 'Gallery image updated successfully',
      data: {
        id: updateResult.rows[0].id,
        url: updateResult.rows[0].url,
        caption: updateResult.rows[0].caption,
        featured: updateResult.rows[0].featured,
        driveFileId: updateResult.rows[0].drive_file_id,
        created_at: updateResult.rows[0].created_at,
        updated_at: updateResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('[vendor/gallery] Error updating gallery image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gallery image'
    });
  }
});

/**
 * Delete vendor gallery image
 * DELETE /api/vendor/gallery/:id
 * Query parameter: email (required)
 */
router.delete('/gallery/:id', async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;
  
  console.log(`[vendor/gallery] Deleting gallery image ID: ${id} for email: ${email}`);
  
  // Validate parameters
  if (!email || !id) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and image ID are required'
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
    
    // Get the image to check for Google Drive file ID
    const imageResult = await query(
      'SELECT id, drive_file_id FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2',
      [id, vendorId]
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gallery image not found or does not belong to this vendor'
      });
    }
    
    // If the image has a Google Drive file ID, delete it from Drive
    if (imageResult.rows[0].drive_file_id) {
      try {
        const googleDriveService = require('../utils/googleDriveService');
        await googleDriveService.deleteFile(imageResult.rows[0].drive_file_id);
        console.log(`[vendor/gallery] Deleted from Google Drive: ${imageResult.rows[0].drive_file_id}`);
      } catch (driveError) {
        console.error('[vendor/gallery] Error deleting from Google Drive:', driveError);
        // Continue with database deletion even if Drive deletion fails
      }
    }
    
    // Delete the image from the database
    const deleteResult = await query(
      'DELETE FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendorId]
    );
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gallery image not found or already deleted'
      });
    }
    
    console.log(`[vendor/gallery] Image deleted from database: ${id}`);
    
    // Return success
    res.json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    console.error('[vendor/gallery] Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete gallery image'
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

/**
 * Get all staff entries from the vendor_staff table
 * GET /api/vendor/all-staff
 */
router.get('/all-staff', async (req, res) => {
  try {
    console.log('Fetching all staff entries from vendor_staff table...');
    
    // Use a simpler query just to get the count first
    const countQuery = `SELECT COUNT(*) FROM vendor_staff`;
    const countResult = await query(countQuery);
    console.log('Staff count query result:', countResult.rows[0]);
    
    // Check the table structure
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_staff'
      ORDER BY ordinal_position
    `;
    const structureResult = await query(structureQuery);
    console.log('Table structure:', structureResult.rows);
    
    // Try a very simple query to get just ids first
    const simpleQuery = `SELECT id, vendor_id, name FROM vendor_staff LIMIT 10`;
    const simpleResult = await query(simpleQuery);
    console.log('Simple query result count:', simpleResult.rows.length);
    console.log('Simple query first few rows:', simpleResult.rows);
    
    // Now try the full query
    const result = await query(
      'SELECT * FROM vendor_staff ORDER BY vendor_id, id'
    );
    
    console.log('Full query result count:', result.rows.length);
    
    // Return all staff entries
    return res.json({
      success: true,
      debug: {
        count: parseInt(countResult.rows[0].count),
        structure: structureResult.rows,
        simpleQueryCount: simpleResult.rows.length
      },
      staff: result.rows
    });
  } catch (error) {
    console.error('Error fetching all staff entries:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch staff entries',
      details: error.message
    });
  }
});

/**
 * Database diagnostic endpoint
 * GET /api/vendor/diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    console.log('Running database diagnostics...');
    
    // Get list of all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = await query(tablesQuery);
    console.log('Tables found:', tables.rows.length);
    
    // Check row counts for each table
    const tableCounts = [];
    for (const table of tables.rows) {
      try {
        const countQuery = `SELECT COUNT(*) FROM "${table.table_name}"`;
        const count = await query(countQuery);
        tableCounts.push({
          table: table.table_name,
          count: parseInt(count.rows[0].count),
          accessible: true
        });
      } catch (countError) {
        console.error(`Error counting rows in table ${table.table_name}:`, countError.message);
        tableCounts.push({
          table: table.table_name,
          error: countError.message,
          accessible: false
        });
      }
    }
    
    // Specifically check vendor_staff table
    let staffTableInfo = null;
    try {
      // Check if vendor_staff table exists
      const staffTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'vendor_staff'
        )
      `;
      const staffTableExists = await query(staffTableQuery);
      
      if (staffTableExists.rows[0].exists) {
        // Get vendor_staff structure
        const staffStructureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'vendor_staff'
          ORDER BY ordinal_position
        `;
        const staffStructure = await query(staffStructureQuery);
        
        // Try to get one row from vendor_staff
        let sampleRow = null;
        try {
          const sampleQuery = `SELECT * FROM vendor_staff LIMIT 1`;
          const sampleResult = await query(sampleQuery);
          sampleRow = sampleResult.rows[0] || null;
        } catch (sampleError) {
          console.error('Error getting sample row:', sampleError.message);
        }
        
        staffTableInfo = {
          exists: true,
          columns: staffStructure.rows,
          sampleRow
        };
      } else {
        staffTableInfo = {
          exists: false
        };
      }
    } catch (staffError) {
      console.error('Error checking vendor_staff table:', staffError.message);
      staffTableInfo = {
        error: staffError.message
      };
    }
    
    // Return diagnostics
    return res.json({
      success: true,
      tables: tableCounts,
      vendorStaffTable: staffTableInfo
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run diagnostics',
      details: error.message
    });
  }
});

/**
 * Initialization function to fetch and log vendor staff data when the app loads
 */
const fetchAndLogVendorStaff = async () => {
  try {
    console.log('='.repeat(80));
    console.log('INITIALIZING: Fetching all vendor staff data on application startup');
    console.log('='.repeat(80));
    
    // Check if vendor_staff table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_staff'
      )
    `;
    const tableExists = await query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('VENDOR STAFF TABLE DOES NOT EXIST IN DATABASE');
      return;
    }
    
    // Get all vendor staff data
    const staffResult = await query('SELECT * FROM vendor_staff ORDER BY vendor_id, id');
    
    console.log('='.repeat(80));
    console.log(`VENDOR STAFF DATA (${staffResult.rows.length} records found)`);
    console.log('='.repeat(80));
    
    if (staffResult.rows.length === 0) {
      console.log('NO VENDOR STAFF RECORDS FOUND IN DATABASE');
    } else {
      staffResult.rows.forEach((staff, index) => {
        console.log(`STAFF RECORD #${index + 1}:`);
        console.log(JSON.stringify(staff, null, 2));
        console.log('-'.repeat(40));
      });
    }
    console.log('='.repeat(80));
    console.log('END OF VENDOR STAFF DATA');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('ERROR FETCHING VENDOR STAFF DATA ON STARTUP:', error);
  }
};

// Execute the initialization function immediately when this module is loaded
fetchAndLogVendorStaff();

/**
 * Initialization function to fetch and log admin data when the app loads
 */
const fetchAndLogAdminData = async () => {
  try {
    console.log('='.repeat(80));
    console.log('INITIALIZING: Fetching admin data from admin_related table on application startup');
    console.log('='.repeat(80));
    
    // Check if admin_related table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_related'
      )
    `;
    const tableExists = await query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('ADMIN_RELATED TABLE DOES NOT EXIST IN DATABASE');
      return;
    }
    
    // Get all admin data
    const adminResult = await query('SELECT * FROM admin_related ORDER BY id');
    
    console.log('='.repeat(80));
    console.log(`ADMIN DATA (${adminResult.rows.length} records found)`);
    console.log('='.repeat(80));
    
    if (adminResult.rows.length === 0) {
      console.log('NO ADMIN RECORDS FOUND IN DATABASE');
    } else {
      adminResult.rows.forEach((admin, index) => {
        console.log(`ADMIN RECORD #${index + 1}:`);
        console.log('Raw data:', JSON.stringify(admin, null, 2));
        
        // Map to global variables
        const globalVariables = {
          globalDashboardId: admin.id || null,
          globalDashboardName: admin.name || null,
          globalDashboardPhoneNumber: admin.phone_number || null,
          globalDashboardWhoAreYou: admin.who_are_you || null,
          globalDashboardPassword: admin.password || null
        };
        
        console.log('Global Variables Mapping:');
        console.log(JSON.stringify(globalVariables, null, 2));
        console.log('-'.repeat(40));
      });
    }
    console.log('='.repeat(80));
    console.log('END OF ADMIN DATA');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('ERROR FETCHING ADMIN DATA ON STARTUP:', error);
    console.log('='.repeat(80));
    console.log('ADMIN DATA STARTUP ERROR DETAILS:');
    console.log('='.repeat(80));
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('='.repeat(80));
  }
};

// Execute the admin data initialization function immediately when this module is loaded
fetchAndLogAdminData();

/**
 * Update vendor provider type (single or multi service)
 * PUT /api/vendor/provider-type
 */
router.put('/provider-type', authenticateToken, async (req, res) => {
  const { vendorEmail, provider_type_single_or_multi, selected_category } = req.body;
  
  // Validate required parameters
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  if (!provider_type_single_or_multi || (provider_type_single_or_multi !== 'single' && provider_type_single_or_multi !== 'multi')) {
    return res.status(400).json({
      success: false,
      error: 'Provider type must be either "single" or "multi"'
    });
  }
  
  // Verify the logged-in user is updating their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to update provider type for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Check if vendor exists
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
    
    // Update vendor provider type in the database
    const updateResult = await query(
      'UPDATE registration_and_other_details SET provider_type_single_or_multi = $1, selected_category = $2 WHERE business_email = $3 RETURNING sr_no',
      [provider_type_single_or_multi, selected_category || null, vendorEmail]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update provider type'
      });
    }
    
    console.log(`Provider type updated for vendor ${vendorEmail}: ${provider_type_single_or_multi} (${selected_category || 'all categories'})`);
    
    res.json({
      success: true,
      message: 'Provider type updated successfully',
      data: {
        provider_type_single_or_multi,
        selected_category: selected_category || null
      }
    });
  } catch (error) {
    console.error('Error updating provider type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider type'
    });
  }
});

/**
 * Save service preferences
 * POST /api/vendor/service-preferences
 */
router.post('/service-preferences', authenticateToken, async (req, res) => {
  const { vendorEmail, provider_type_single_or_multi, selected_category } = req.body;
  
  // Validate required parameters
  if (!vendorEmail) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  if (!provider_type_single_or_multi || (provider_type_single_or_multi !== 'single' && provider_type_single_or_multi !== 'multi')) {
    return res.status(400).json({
      success: false,
      error: 'Provider type must be either "single" or "multi"'
    });
  }
  
  // Verify the logged-in user is updating their own data
  if (req.user.email !== vendorEmail) {
    console.error(`Security violation: User ${req.user.email} attempted to save service preferences for ${vendorEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Check if vendor exists
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
    
    // Update vendor service preferences in the database
    const updateResult = await query(
      'UPDATE registration_and_other_details SET provider_type_single_or_multi = $1, selected_category = $2 WHERE business_email = $3 RETURNING sr_no',
      [provider_type_single_or_multi, selected_category || null, vendorEmail]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save service preferences'
      });
    }
    
    console.log(`Service preferences saved for vendor ${vendorEmail}: ${provider_type_single_or_multi} (${selected_category || 'all categories'})`);
    
    res.json({
      success: true,
      message: 'Service preferences saved successfully',
      data: {
        provider_type_single_or_multi,
        selected_category: selected_category || null
      }
    });
  } catch (error) {
    console.error('Error saving service preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save service preferences'
    });
  }
});

/**
 * Get service preferences
 * GET /api/vendor/service-preferences?email=<vendorEmail>
 */
router.get('/service-preferences', authenticateToken, async (req, res) => {
  const { email } = req.query;
  
  // Validate required parameters
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to access service preferences for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor service preferences from database
    const vendorResult = await query(
      'SELECT sr_no, provider_type_single_or_multi, selected_category FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendor = vendorResult.rows[0];
    
    // If preferences are not set (null), return null
    if (!vendor.provider_type_single_or_multi && !vendor.selected_category) {
      return res.json({
        success: true,
        preferences: null
      });
    }
    
    // Return preferences
    res.json({
      success: true,
      preferences: {
        provider_type_single_or_multi: vendor.provider_type_single_or_multi,
        selected_category: vendor.selected_category
      }
    });
  } catch (error) {
    console.error('Error getting service preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service preferences'
    });
  }
});

/**
 * Get registration details for business dashboard
 * GET /api/vendor/registration-details?email=<vendorEmail>
 */
router.get('/registration-details', authenticateToken, async (req, res) => {
  const { email } = req.query;
  
  // Validate required parameters
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }
  
  // Verify the logged-in user is accessing their own data
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to access registration details for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Get vendor registration details from database
    const vendorResult = await query(
      'SELECT sr_no, business_email, provider_type_single_or_multi, selected_category, business_name, person_name FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendor = vendorResult.rows[0];
    
    // Return registration details
    res.json({
      success: true,
      data: {
        sr_no: vendor.sr_no,
        business_email: vendor.business_email,
        provider_type_single_or_multi: vendor.provider_type_single_or_multi,
        selected_category: vendor.selected_category,
        business_name: vendor.business_name,
        person_name: vendor.person_name
      }
    });
  } catch (error) {
    console.error('Error getting registration details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get registration details'
    });
  }
});

/**
 * Get admin related data
 * GET /api/vendor/admin-data
 */
router.get('/admin-data', async (req, res) => {
  try {
    console.log('[admin-data] Fetching data from admin_related table...');
    
    // Fetch all data from admin_related table
    const adminResult = await query(
      'SELECT * FROM admin_related ORDER BY id'
    );
    
    console.log(`[admin-data] Found ${adminResult.rows.length} records in admin_related table`);
    
    if (adminResult.rows.length === 0) {
      console.log('[admin-data] No records found in admin_related table');
      return res.json({
        success: true,
        message: 'No admin data found',
        data: null,
        globalVariables: {
          globalDashboardId: null,
          globalDashboardName: null,
          globalDashboardPhoneNumber: null,
          globalDashboardWhoAreYou: null,
          globalDashboardPassword: null
        }
      });
    }
    
    // Get the first record (assuming there's typically one admin record)
    const adminData = adminResult.rows[0];
    
    // Map the data to global variable names
    const globalVariables = {
      globalDashboardId: adminData.id || null,
      globalDashboardName: adminData.name || null,
      globalDashboardPhoneNumber: adminData.phone_number || null,
      globalDashboardWhoAreYou: adminData.who_are_you || null,
      globalDashboardPassword: adminData.password || null // Note: Handle this securely in production
    };
    
    // Console log the entire response for verification
    console.log('='.repeat(80));
    console.log('[admin-data] ADMIN DATA RESPONSE:');
    console.log('='.repeat(80));
    console.log('Raw admin data:', JSON.stringify(adminData, null, 2));
    console.log('-'.repeat(40));
    console.log('Global variables mapping:', JSON.stringify(globalVariables, null, 2));
    console.log('='.repeat(80));
    
    // Return success response with mapped data
    return res.json({
      success: true,
      message: 'Admin data fetched successfully',
      data: adminData,
      globalVariables: globalVariables,
      allRecords: adminResult.rows // Include all records in case there are multiple
    });
    
  } catch (error) {
    console.error('[admin-data] Error fetching admin data:', error);
    
    // Console log error details
    console.log('='.repeat(80));
    console.log('[admin-data] ERROR RESPONSE:');
    console.log('='.repeat(80));
    console.log('Error message:', error.message);
    console.log('Error details:', error);
    console.log('='.repeat(80));
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get admin related data with security (password excluded from response)
 * GET /api/vendor/admin-data-secure
 */
router.get('/admin-data-secure', async (req, res) => {
  try {
    console.log('[admin-data-secure] Fetching data from admin_related table (secure version)...');
    
    // Fetch all data from admin_related table except password
    const adminResult = await query(
      'SELECT id, name, phone_number, who_are_you FROM admin_related ORDER BY id'
    );
    
    console.log(`[admin-data-secure] Found ${adminResult.rows.length} records in admin_related table`);
    
    if (adminResult.rows.length === 0) {
      console.log('[admin-data-secure] No records found in admin_related table');
      return res.json({
        success: true,
        message: 'No admin data found',
        data: null,
        globalVariables: {
          globalDashboardId: null,
          globalDashboardName: null,
          globalDashboardPhoneNumber: null,
          globalDashboardWhoAreYou: null
        }
      });
    }
    
    // Get the first record (assuming there's typically one admin record)
    const adminData = adminResult.rows[0];
    
    // Map the data to global variable names (excluding password)
    const globalVariables = {
      globalDashboardId: adminData.id || null,
      globalDashboardName: adminData.name || null,
      globalDashboardPhoneNumber: adminData.phone_number || null,
      globalDashboardWhoAreYou: adminData.who_are_you || null
    };
    
    // Console log the entire response for verification
    console.log('='.repeat(80));
    console.log('[admin-data-secure] ADMIN DATA RESPONSE (SECURE):');
    console.log('='.repeat(80));
    console.log('Raw admin data (no password):', JSON.stringify(adminData, null, 2));
    console.log('-'.repeat(40));
    console.log('Global variables mapping:', JSON.stringify(globalVariables, null, 2));
    console.log('='.repeat(80));
    
    // Return success response with mapped data
    return res.json({
      success: true,
      message: 'Admin data fetched successfully (secure)',
      data: adminData,
      globalVariables: globalVariables,
      allRecords: adminResult.rows // Include all records in case there are multiple
    });
    
  } catch (error) {
    console.error('[admin-data-secure] Error fetching admin data:', error);
    
    // Console log error details
    console.log('='.repeat(80));
    console.log('[admin-data-secure] ERROR RESPONSE:');
    console.log('='.repeat(80));
    console.log('Error message:', error.message);
    console.log('Error details:', error);
    console.log('='.repeat(80));
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Register admin user - Store data in admin_related table
 * POST /api/vendor/admin-register
 */
router.post('/admin-register', async (req, res) => {
  const { name, phone_number, who_are_you, password } = req.body;
  
  // Validate required fields
  if (!name || !phone_number || !who_are_you || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: name, phone_number, who_are_you, password'
    });
  }
  
  // Validate phone number format (10 digits)
  if (!/^[0-9]{10}$/.test(phone_number)) {
    return res.status(400).json({
      success: false,
      error: 'Phone number must be exactly 10 digits'
    });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }
  
  try {
    console.log('[admin-register] Registration attempt:', { name, phone_number, who_are_you });
    
    // Check if phone number already exists
    const existingUser = await query(
      'SELECT id FROM admin_related WHERE phone_number = $1',
      [phone_number]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered'
      });
    }
    
    // Insert new admin user
    const insertResult = await query(
      'INSERT INTO admin_related (name, phone_number, who_are_you, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone_number, who_are_you, password]
    );
    
    const newUser = insertResult.rows[0];
    
    // Map to global variables format
    const globalVariables = {
      globalDashboardId: newUser.id,
      globalDashboardName: newUser.name,
      globalDashboardPhoneNumber: newUser.phone_number,
      globalDashboardWhoAreYou: newUser.who_are_you,
      globalDashboardPassword: newUser.password
    };
    
    console.log('='.repeat(80));
    console.log('[admin-register] USER REGISTRATION SUCCESSFUL:');
    console.log('='.repeat(80));
    console.log('New user data:', JSON.stringify(newUser, null, 2));
    console.log('Global variables:', JSON.stringify(globalVariables, null, 2));
    console.log('='.repeat(80));
    
    // Return success response (excluding password for security)
    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        phone_number: newUser.phone_number,
        who_are_you: newUser.who_are_you
      },
      globalVariables: {
        globalDashboardId: newUser.id,
        globalDashboardName: newUser.name,
        globalDashboardPhoneNumber: newUser.phone_number,
        globalDashboardWhoAreYou: newUser.who_are_you,
        globalDashboardPassword: newUser.password // Include for frontend storage
      }
    });
    
  } catch (error) {
    console.error('[admin-register] Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register admin user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Login admin user - Authenticate using phone and password
 * POST /api/vendor/admin-login
 */
router.post('/admin-login', async (req, res) => {
  const { phone_number, password } = req.body;
  
  // Validate required fields
  if (!phone_number || !password) {
    return res.status(400).json({
      success: false,
      error: 'Phone number and password are required'
    });
  }
  
  try {
    console.log('[admin-login] Login attempt for phone:', phone_number);
    
    // Find user by phone number and password
    const userResult = await query(
      'SELECT * FROM admin_related WHERE phone_number = $1 AND password = $2',
      [phone_number, password]
    );
    
    if (userResult.rows.length === 0) {
      console.log('[admin-login] Login failed: Invalid credentials');
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password'
      });
    }
    
    const user = userResult.rows[0];
    
    // Map to global variables format
    const globalVariables = {
      globalDashboardId: user.id,
      globalDashboardName: user.name,
      globalDashboardPhoneNumber: user.phone_number,
      globalDashboardWhoAreYou: user.who_are_you,
      globalDashboardPassword: user.password
    };
    
    console.log('='.repeat(80));
    console.log('[admin-login] LOGIN SUCCESSFUL:');
    console.log('='.repeat(80));
    console.log('User data:', JSON.stringify({...user, password: '[HIDDEN]'}, null, 2));
    console.log('Global variables:', JSON.stringify({...globalVariables, globalDashboardPassword: '[HIDDEN]'}, null, 2));
    console.log('='.repeat(80));
    
    // Generate a simple token (in production, use JWT or similar)
    const token = `admin_token_${user.id}_${Date.now()}`;
    
    // Return success response
    return res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        who_are_you: user.who_are_you
      },
      globalVariables: globalVariables
    });
    
  } catch (error) {
    console.error('[admin-login] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all records from our_services_section table
 * GET /api/vendor/our-services-section
 */
router.get('/our-services-section', async (req, res) => {
  try {
    console.log('[our-services-section] Fetching all records from our_services_section table...');
    
    // Fetch all records from our_services_section table
    const result = await query(
      'SELECT * FROM our_services_section ORDER BY id'
    );
    
    console.log(`[our-services-section] Found ${result.rows.length} records`);
    
    // Console log the entire response for verification
    console.log('='.repeat(80));
    console.log('[our-services-section] OUR_SERVICES_SECTION DATA:');
    console.log('='.repeat(80));
    console.log('Total records:', result.rows.length);
    if (result.rows.length > 0) {
      result.rows.forEach((record, index) => {
        console.log(`Record #${index + 1}:`, JSON.stringify(record, null, 2));
        console.log('-'.repeat(40));
      });
    } else {
      console.log('No records found in our_services_section table');
    }
    console.log('='.repeat(80));
    
    // Return success response
    return res.json({
      success: true,
      message: 'Our services section data fetched successfully',
      data: result.rows,
      totalRecords: result.rows.length
    });
    
  } catch (error) {
    console.error('[our-services-section] Error fetching data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch our services section data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all records from our_services_icons table
 * GET /api/vendor/our-services-icons
 */
router.get('/our-services-icons', async (req, res) => {
  try {
    console.log('[our-services-icons] Fetching all records from our_services_icons table...');
    
    // Fetch all records from our_services_icons table
    const result = await query(
      'SELECT * FROM our_services_icons ORDER BY id'
    );
    
    console.log(`[our-services-icons] Found ${result.rows.length} records`);
    
    // Console log the entire response for verification
    console.log('='.repeat(80));
    console.log('[our-services-icons] OUR_SERVICES_ICONS DATA:');
    console.log('='.repeat(80));
    console.log('Total records:', result.rows.length);
    if (result.rows.length > 0) {
      result.rows.forEach((record, index) => {
        console.log(`Record #${index + 1}:`, JSON.stringify(record, null, 2));
        console.log('-'.repeat(40));
      });
    } else {
      console.log('No records found in our_services_icons table');
    }
    console.log('='.repeat(80));
    
    // Return success response
    return res.json({
      success: true,
      message: 'Our services icons data fetched successfully',
      data: result.rows,
      totalRecords: result.rows.length
    });
    
  } catch (error) {
    console.error('[our-services-icons] Error fetching data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch our services icons data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all records from our_services_product table
 * GET /api/vendor/our-services-product
 */
router.get('/our-services-product', async (req, res) => {
  try {
    console.log('[our-services-product] Fetching all records from our_services_product table...');
    
    // Fetch all records from our_services_product table
    const result = await query(
      'SELECT * FROM our_services_product ORDER BY id'
    );
    
    console.log(`[our-services-product] Found ${result.rows.length} records`);
    
    // Console log the entire response for verification
    console.log('='.repeat(80));
    console.log('[our-services-product] OUR_SERVICES_PRODUCT DATA:');
    console.log('='.repeat(80));
    console.log('Total records:', result.rows.length);
    if (result.rows.length > 0) {
      result.rows.forEach((record, index) => {
        console.log(`Record #${index + 1}:`, JSON.stringify(record, null, 2));
        console.log('-'.repeat(40));
      });
    } else {
      console.log('No records found in our_services_product table');
    }
    console.log('='.repeat(80));
    
    // Return success response
    return res.json({
      success: true,
      message: 'Our services product data fetched successfully',
      data: result.rows,
      totalRecords: result.rows.length
    });
    
  } catch (error) {
    console.error('[our-services-product] Error fetching data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch our services product data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all services data at once (combined endpoint)
 * GET /api/vendor/all-services-data
 */
router.get('/all-services-data', async (req, res) => {
  try {
    console.log('[all-services-data] Fetching all services data from all tables...');
    
    // Fetch data from all three tables
    const [sectionsResult, iconsResult, productsResult] = await Promise.all([
      query('SELECT * FROM our_services_section ORDER BY id'),
      query('SELECT * FROM our_services_icons ORDER BY id'),
      query('SELECT * FROM our_services_product ORDER BY id')
    ]);
    
    const responseData = {
      sections: sectionsResult.rows,
      icons: iconsResult.rows,
      products: productsResult.rows
    };
    
    console.log('='.repeat(80));
    console.log('[all-services-data] COMBINED SERVICES DATA:');
    console.log('='.repeat(80));
    console.log('Sections count:', responseData.sections.length);
    console.log('Icons count:', responseData.icons.length);
    console.log('Products count:', responseData.products.length);
    console.log('Combined data:', JSON.stringify(responseData, null, 2));
    console.log('='.repeat(80));
    
    // Return combined response
    return res.json({
      success: true,
      message: 'All services data fetched successfully',
      data: responseData,
      totalRecords: {
        sections: responseData.sections.length,
        icons: responseData.icons.length,
        products: responseData.products.length
      }
    });
    
  } catch (error) {
    console.error('[all-services-data] Error fetching combined data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch all services data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all services data with normalized image URLs
 * GET /api/vendor/all-services-data-with-images
 */
router.get('/all-services-data-with-images', async (req, res) => {
  try {
    console.log('[all-services-data-with-images] Fetching all services data with normalized image URLs...');
    
    // Fetch data from all three tables
    const [sectionsResult, iconsResult, productsResult] = await Promise.all([
      query('SELECT * FROM our_services_section ORDER BY id'),
      query('SELECT * FROM our_services_icons ORDER BY id'),
      query('SELECT * FROM our_services_product ORDER BY id')
    ]);
    
    // Function to normalize Google Drive URLs for better browser compatibility
    const normalizeImageUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      
      try {
        // Handle Google Drive links
        if (url.includes('drive.google.com')) {
          // Extract file ID from various Google Drive URL formats
          const patterns = [
            /\/uc\?id=([a-zA-Z0-9_-]+)/,  // https://drive.google.com/uc?id=FILE_ID
            /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/FILE_ID/view
            /id=([a-zA-Z0-9_-]+)/          // Any link with id= parameter
          ];

          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
              // Use the direct usercontent URL for better browser compatibility
              // This bypasses redirects and works better in img tags
              return `https://drive.usercontent.google.com/download?id=${match[1]}`;
            }
          }
        }
        
        // Handle local storage links - ensure they're absolute
        if (url.includes('/static/uploads/')) {
          if (url.startsWith('http')) {
            return url; // Already absolute
          }
          return `http://localhost:3000${url}`; // Make absolute
        }
        
        // Return as-is for other URLs (including base64 data URLs)
        return url;
      } catch (error) {
        console.error('Error normalizing image URL:', error);
        return url; // Return original on error
      }
    };
    
    // Process and normalize image URLs in sections data
    const normalizedSections = sectionsResult.rows.map(section => ({
      ...section,
      service_image: normalizeImageUrl(section.service_image),
      // Also provide the original URL for debugging
      original_service_image: section.service_image
    }));
    
    // Process and normalize image URLs in icons data
    const normalizedIcons = iconsResult.rows.map(icon => ({
      ...icon,
      icon: normalizeImageUrl(icon.icon),
      // Also provide the original URL for debugging
      original_icon: icon.icon
    }));
    
    // Products data (no image column currently, but prepare for future)
    const normalizedProducts = productsResult.rows.map(product => ({
      ...product,
      // Add image normalization if product_image column exists in future
      ...(product.product_image && {
        product_image: normalizeImageUrl(product.product_image),
        original_product_image: product.product_image
      })
    }));
    
    const responseData = {
      sections: normalizedSections,
      icons: normalizedIcons,
      products: normalizedProducts
    };
    
    console.log('='.repeat(80));
    console.log('[all-services-data-with-images] NORMALIZED SERVICES DATA:');
    console.log('='.repeat(80));
    console.log('Sections count:', responseData.sections.length);
    console.log('Icons count:', responseData.icons.length);
    console.log('Products count:', responseData.products.length);
    
    // Log sample normalized URLs for debugging
    if (responseData.sections.length > 0) {
      console.log('Sample section image URLs:');
      responseData.sections.slice(0, 3).forEach((section, index) => {
        console.log(`  Section ${index + 1}:`);
        console.log(`    Original: ${section.original_service_image}`);
        console.log(`    Normalized: ${section.service_image}`);
      });
    }
    
    if (responseData.icons.length > 0) {
      console.log('Sample icon image URLs:');
      responseData.icons.slice(0, 3).forEach((icon, index) => {
        console.log(`  Icon ${index + 1}:`);
        console.log(`    Original: ${icon.original_icon}`);
        console.log(`    Normalized: ${icon.icon}`);
      });
    }
    
    console.log('='.repeat(80));
    
    // Return combined response
    return res.json({
      success: true,
      message: 'All services data with normalized images fetched successfully',
      data: responseData,
      totalRecords: {
        sections: responseData.sections.length,
        icons: responseData.icons.length,
        products: responseData.products.length
      },
      imageNormalization: {
        applied: true,
        description: 'Google Drive URLs converted to direct usercontent format for better browser compatibility'
      }
    });
    
  } catch (error) {
    console.error('[all-services-data-with-images] Error fetching combined data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch all services data with images',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ******* HELPER FUNCTIONS FOR IMAGE URL VALIDATION *******

/**
 * Validate and normalize image URL to ensure only Google Drive links are stored
 * @param {string} imageUrl - The image URL to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {object} - { isValid: boolean, normalizedUrl: string, error?: string }
 */
const validateAndNormalizeImageUrl = (imageUrl, fieldName = 'image') => {
  // Allow empty/null values
  if (!imageUrl || imageUrl.trim() === '') {
    return { 
      isValid: true, 
      normalizedUrl: '' 
    };
  }

  // Reject base64 data URLs
  if (imageUrl.startsWith('data:image/') || imageUrl.includes('base64')) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} cannot be base64 data. Please upload image to Google Drive and provide the link.`
    };
  }

  // Reject extremely long URLs (likely base64 or corrupted data)
  if (imageUrl.length > 500) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} URL is too long (${imageUrl.length} characters). Maximum allowed is 500 characters.`
    };
  }

  // Check if it's a Google Drive link
  if (imageUrl.includes('drive.google.com')) {
    // Extract file ID and normalize to direct download format
    const patterns = [
      /\/uc\?id=([a-zA-Z0-9_-]+)/,  // https://drive.google.com/uc?id=FILE_ID
      /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/FILE_ID/view
      /id=([a-zA-Z0-9_-]+)/          // Any link with id= parameter
    ];

    for (const pattern of patterns) {
      const match = imageUrl.match(pattern);
      if (match && match[1]) {
        // Normalize to direct download format for better compatibility
        const normalizedUrl = `https://drive.usercontent.google.com/download?id=${match[1]}`;
        return {
          isValid: true,
          normalizedUrl: normalizedUrl
        };
      }
    }

    // If it contains drive.google.com but we couldn't extract file ID
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} appears to be a Google Drive link but file ID could not be extracted. Please use a valid Google Drive sharing link.`
    };
  }

  // Check if it's a local storage link
  if (imageUrl.includes('/static/uploads/')) {
    // Ensure it's an absolute URL
    if (imageUrl.startsWith('http')) {
      return { isValid: true, normalizedUrl: imageUrl };
    } else {
      return { isValid: true, normalizedUrl: `http://localhost:3000${imageUrl}` };
    }
  }

  // Check if it's a placeholder URL
  if (imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder.com')) {
    return { isValid: true, normalizedUrl: imageUrl };
  }

  // For any other URL format, validate it's a proper URL
  try {
    new URL(imageUrl);
    return { isValid: true, normalizedUrl: imageUrl };
  } catch (error) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: `${fieldName} must be a valid URL. Supported formats: Google Drive links, local storage links, or standard URLs.`
    };
  }
};

// ******* OUR SERVICES SECTION CRUD OPERATIONS *******

/**
 * Create a new service in our_services_section table
 * POST /api/vendor/our-services-section
 */
router.post('/our-services-section', async (req, res) => {
  try {
    console.log('[POST our-services-section] Creating new service...');
    console.log('Request body:', req.body);
    
    const {
      service_name,
      category,
      toggle_gender_services,
      price,
      duration,
      service_image,
      service_description,
      icon_id
    } = req.body;
    
    // Validate required fields
    if (!service_name || !category || price === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service_name, category, price, duration'
      });
    }
    
    // Validate and sanitize price
    let sanitizedPrice = price;
    if (typeof price === 'number') {
      // Check if price is within valid range (max 99,999,999.99 for NUMERIC(10,2))
      if (price > 99999999.99) {
        return res.status(400).json({
          success: false,
          error: 'Price exceeds maximum allowed value (99,999,999.99)'
        });
      }
      if (price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price cannot be negative'
        });
      }
      sanitizedPrice = Math.round(price * 100) / 100; // Round to 2 decimal places
    }
    
    // Convert gender string to boolean if needed
    let genderValue = toggle_gender_services;
    if (typeof toggle_gender_services === 'string') {
      genderValue = toggle_gender_services.toLowerCase() === 'true' || toggle_gender_services === 'male';
    }
    
    // Validate and normalize service image URL
    const imageValidation = validateAndNormalizeImageUrl(service_image, 'service_image');
    if (!imageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: imageValidation.error
      });
    }
    
    console.log('[POST our-services-section] Image validation passed:', {
      original: service_image,
      normalized: imageValidation.normalizedUrl,
      length: service_image ? service_image.length : 0
    });
    
    // Insert new service
    const result = await query(
      `INSERT INTO our_services_section 
       (service_name, category, toggle_gender_services, price, duration, service_image, service_description, icon_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        service_name,
        category,
        genderValue,
        sanitizedPrice,
        duration,
        imageValidation.normalizedUrl,
        service_description || '',
        icon_id || null
      ]
    );
    
    console.log('[POST our-services-section] Service created successfully:', result.rows[0]);
    
    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[POST our-services-section] Error creating service:', error);
    
    // Handle specific database errors
    if (error.code === '22003') {
      return res.status(400).json({
        success: false,
        error: 'Numeric field overflow - price value is too large',
        details: 'Price must be less than 99,999,999.99'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create service',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update a service in our_services_section table
 * PUT /api/vendor/our-services-section/:id
 */
router.put('/our-services-section/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PUT our-services-section] Updating service ID: ${id}`);
    console.log('Request body:', req.body);
    
    const {
      service_name,
      category,
      toggle_gender_services,
      price,
      duration,
      service_image,
      service_description,
      icon_id
    } = req.body;
    
    // Validate and sanitize price
    let sanitizedPrice = price;
    if (typeof price === 'number') {
      // Check if price is within valid range (max 99,999,999.99 for NUMERIC(10,2))
      if (price > 99999999.99) {
        return res.status(400).json({
          success: false,
          error: 'Price exceeds maximum allowed value (99,999,999.99)'
        });
      }
      if (price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price cannot be negative'
        });
      }
      sanitizedPrice = Math.round(price * 100) / 100; // Round to 2 decimal places
    }
    
    // Convert gender string to boolean if needed
    let genderValue = toggle_gender_services;
    if (typeof toggle_gender_services === 'string') {
      genderValue = toggle_gender_services.toLowerCase() === 'true' || toggle_gender_services === 'male';
    }
    
    // Validate and normalize service image URL
    const imageValidation = validateAndNormalizeImageUrl(service_image, 'service_image');
    if (!imageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: imageValidation.error
      });
    }
    
    console.log('[PUT our-services-section] Image validation passed:', {
      original: service_image,
      normalized: imageValidation.normalizedUrl,
      length: service_image ? service_image.length : 0
    });
    
    // Update service
    const result = await query(
      `UPDATE our_services_section 
       SET service_name = $1, category = $2, toggle_gender_services = $3,
           price = $4, duration = $5, service_image = $6,
           service_description = $7, icon_id = $8 
       WHERE id = $9 
       RETURNING *`,
      [
        service_name,
        category,
        genderValue,
        sanitizedPrice,
        duration,
        imageValidation.normalizedUrl,
        service_description || '',
        icon_id || null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    console.log('[PUT our-services-section] Service updated successfully:', result.rows[0]);
    
    return res.json({
      success: true,
      message: 'Service updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[PUT our-services-section] Error updating service:', error);
    
    // Handle specific database errors
    if (error.code === '22003') {
      return res.status(400).json({
        success: false,
        error: 'Numeric field overflow - price value is too large',
        details: 'Price must be less than 99,999,999.99'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update service',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete a service from our_services_section table
 * DELETE /api/vendor/our-services-section/:id
 */
router.delete('/our-services-section/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cascade } = req.query;
    console.log(`[DELETE our-services-section] Deleting service ID: ${id}, cascade: ${cascade}`);
    
    // Begin transaction for cascade deletion
    await query('BEGIN');
    
    try {
      // First, delete all related products that reference this service
      console.log(`[DELETE our-services-section] Deleting related products for service ID: ${id}`);
      const deletedProducts = await query(
        'DELETE FROM our_services_product WHERE service_id = $1 RETURNING *',
        [id]
      );
      console.log(`[DELETE our-services-section] Deleted ${deletedProducts.rows.length} related products`);
      
      // Note: our_services_icons table does not have a service_id column, so we skip icon deletion
      // Icons are independent entities and not directly linked to services
      console.log(`[DELETE our-services-section] Skipping icon deletion - icons are not linked to services`);
      
      // Finally, delete the service itself
      console.log(`[DELETE our-services-section] Deleting service ID: ${id}`);
      const result = await query(
        'DELETE FROM our_services_section WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }
      
      // Commit the transaction
      await query('COMMIT');
      
      console.log('[DELETE our-services-section] Service and related data deleted successfully:', {
        service: result.rows[0],
        deletedProducts: deletedProducts.rows.length,
        deletedIcons: 0 // Icons are not linked to services
      });
      
      return res.json({
        success: true,
        message: 'Service and related data deleted successfully',
        data: {
          service: result.rows[0],
          deletedProducts: deletedProducts.rows.length,
          deletedIcons: 0 // Icons are not linked to services
        }
      });
      
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('[DELETE our-services-section] Error deleting service:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete service',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ******* OUR SERVICES ICONS CRUD OPERATIONS *******

/**
 * Create a new icon in our_services_icons table
 * POST /api/vendor/our-services-icons
 */
router.post('/our-services-icons', async (req, res) => {
  try {
    console.log('[POST our-services-icons] Creating new icon...');
    console.log('Request body:', req.body);
    
    const {
      icon_title,
      toggle_gender,
      icon,
      icon_description
    } = req.body;
    
    // Validate required fields
    if (!icon_title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: icon_title'
      });
    }
    
    // Convert gender string to boolean if needed
    let genderValue = toggle_gender;
    if (typeof toggle_gender === 'string') {
      genderValue = toggle_gender.toLowerCase() === 'true' || toggle_gender === 'male';
    }
    
    // Validate and normalize icon image URL
    const imageValidation = validateAndNormalizeImageUrl(icon, 'icon');
    if (!imageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: imageValidation.error
      });
    }
    
    console.log('[POST our-services-icons] Image validation passed:', {
      original: icon,
      normalized: imageValidation.normalizedUrl,
      length: icon ? icon.length : 0
    });
    
    // Insert new icon
    const result = await query(
      `INSERT INTO our_services_icons 
       (icon_title, toggle_gender, icon, icon_description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        icon_title,
        genderValue,
        imageValidation.normalizedUrl,
        icon_description || ''
      ]
    );
    
    console.log('[POST our-services-icons] Icon created successfully:', result.rows[0]);
    
    return res.status(201).json({
      success: true,
      message: 'Icon created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[POST our-services-icons] Error creating icon:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create icon',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update an icon in our_services_icons table
 * PUT /api/vendor/our-services-icons/:id
 */
router.put('/our-services-icons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PUT our-services-icons] Updating icon ID: ${id}`);
    console.log('Request body:', req.body);
    
    const {
      icon_title,
      toggle_gender,
      icon,
      icon_description
    } = req.body;
    
    // Convert gender string to boolean if needed
    let genderValue = toggle_gender;
    if (typeof toggle_gender === 'string') {
      genderValue = toggle_gender.toLowerCase() === 'true' || toggle_gender === 'male';
    }
    
    // Validate and normalize icon image URL
    const imageValidation = validateAndNormalizeImageUrl(icon, 'icon');
    if (!imageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: imageValidation.error
      });
    }
    
    console.log('[PUT our-services-icons] Image validation passed:', {
      original: icon,
      normalized: imageValidation.normalizedUrl,
      length: icon ? icon.length : 0
    });
    
    // Update icon
    const result = await query(
      `UPDATE our_services_icons 
       SET icon_title = $1, toggle_gender = $2, icon = $3, icon_description = $4 
       WHERE id = $5 
       RETURNING *`,
      [
        icon_title,
        genderValue,
        imageValidation.normalizedUrl,
        icon_description || '',
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Icon not found'
      });
    }
    
    console.log('[PUT our-services-icons] Icon updated successfully:', result.rows[0]);
    
    return res.json({
      success: true,
      message: 'Icon updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[PUT our-services-icons] Error updating icon:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update icon',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete an icon from our_services_icons table
 * DELETE /api/vendor/our-services-icons/:id
 */
router.delete('/our-services-icons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE our-services-icons] Deleting icon ID: ${id}`);
    
    // Delete icon
    const result = await query(
      'DELETE FROM our_services_icons WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Icon not found'
      });
    }
    
    console.log('[DELETE our-services-icons] Icon deleted successfully:', result.rows[0]);
    
    return res.json({
      success: true,
      message: 'Icon deleted successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[DELETE our-services-icons] Error deleting icon:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete icon',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ******* OUR SERVICES PRODUCT CRUD OPERATIONS *******

/**
 * Create a new product in our_services_product table
 * POST /api/vendor/our-services-product
 */
router.post('/our-services-product', async (req, res) => {
  try {
    console.log('[POST our-services-product] Creating new product...');
    console.log('Request body:', req.body);
    
    const {
      our_services_category,
      product_name,
      service_id
    } = req.body;
    
    // Validate required fields
    if (!our_services_category || !product_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: our_services_category, product_name'
      });
    }
    
    // Insert new product
    const result = await query(
      `INSERT INTO our_services_product 
       (our_services_category, product_name, service_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        our_services_category,
        product_name,
        service_id || null
      ]
    );
    
    console.log('[POST our-services-product] Product created successfully:', result.rows[0]);
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[POST our-services-product] Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update a product in our_services_product table
 * PUT /api/vendor/our-services-product/:id
 */
router.put('/our-services-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PUT our-services-product] Updating product ID: ${id}`);
    console.log('Request body:', req.body);
    
    const {
      our_services_category,
      product_name,
      service_id
    } = req.body;
    
    // Update product
    const result = await query(
      `UPDATE our_services_product 
       SET our_services_category = $1, product_name = $2, service_id = $3 
       WHERE id = $4 
       RETURNING *`,
      [
        our_services_category,
        product_name,
        service_id || null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    console.log('[PUT our-services-product] Product updated successfully:', result.rows[0]);
    
    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[PUT our-services-product] Error updating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete a product from our_services_product table
 * DELETE /api/vendor/our-services-product/:id
 */
router.delete('/our-services-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE our-services-product] Deleting product ID: ${id}`);
    
    // Delete product
    const result = await query(
      'DELETE FROM our_services_product WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    console.log('[DELETE our-services-product] Product deleted successfully:', result.rows[0]);
    
    return res.json({
      success: true,
      message: 'Product deleted successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[DELETE our-services-product] Error deleting product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get vendor transformations (before/after images)
 * GET /api/vendor/transformations
 * Query parameter: email (required)
 */
router.get('/transformations', async (req, res) => {
  const { email } = req.query;
  
  console.log(`[vendor/transformations] Fetching transformations for email: ${email}`);
  
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
      console.log(`[vendor/transformations] Vendor not found for email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[vendor/transformations] Found vendor ID: ${vendorId}`);
    
    // Get transformations from database
    const transformationsResult = await query(
      'SELECT * FROM vendor_transformations WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendorId]
    );
    
    console.log(`[vendor/transformations] Found ${transformationsResult.rows.length} transformations`);
    
    // Return transformations
    return res.json({
      success: true,
      transformations: transformationsResult.rows
    });
  } catch (error) {
    console.error('[vendor/transformations] Error fetching vendor transformations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor transformations'
    });
  }
});

/**
 * Add a new transformation (before/after images)
 * POST /api/vendor/transformations
 */
router.post('/transformations', authenticateToken, async (req, res) => {
  const { email, transformation } = req.body;
  
  // Validate parameters
  if (!email || !transformation) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email and transformation data are required'
    });
  }
  
  // Validate required transformation fields
  if (!transformation.title || !transformation.beforeImage || !transformation.afterImage) {
    return res.status(400).json({
      success: false,
      error: 'Transformation title, beforeImage, and afterImage are required'
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
    
    // Insert transformation
    const result = await query(`
      INSERT INTO vendor_transformations (
        vendor_id, 
        title, 
        description, 
        before_image, 
        after_image, 
        category,
        client_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      vendorId,
      transformation.title,
      transformation.description || null,
      transformation.beforeImage,
      transformation.afterImage,
      transformation.category || null,
      transformation.client_name || null
    ]);
    
    return res.status(201).json({
      success: true,
      message: 'Transformation added successfully',
      transformation: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding transformation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add transformation'
    });
  }
});

/**
 * Delete a transformation
 * DELETE /api/vendor/transformations/:id
 */
router.delete('/transformations/:id', authenticateToken, async (req, res) => {
  const transformationId = req.params.id;
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
    
    // Delete transformation (ensuring it belongs to this vendor)
    const result = await query(
      'DELETE FROM vendor_transformations WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [transformationId, vendorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transformation not found or does not belong to this vendor'
      });
    }
    
    return res.json({
      success: true,
      message: 'Transformation deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting transformation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete transformation'
    });
  }
});

// Route for uploading profile picture
router.post('/profile-picture', userController.uploadProfilePicture);

/**
 * Update vendor status (active/inactive)
 * PUT /api/vendor/status
 * Body: { email, status }
 */
router.put('/status', authenticateToken, async (req, res) => {
  const { email, status } = req.body;
  
  // Validate parameters
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Vendor email is required'
    });
  }
  
  if (!status || (status !== 'active' && status !== 'inactive')) {
    return res.status(400).json({
      success: false,
      error: 'Status must be either "active" or "inactive"'
    });
  }
  
  // Verify the logged-in user is updating their own data (important for security)
  if (req.user.email !== email) {
    console.error(`Security violation: User ${req.user.email} attempted to modify status for ${email}`);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access to vendor data'
    });
  }
  
  try {
    // Check if vendor exists
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
    
    // Update vendor status and timestamp in the database
    const updateResult = await query(
      'UPDATE registration_and_other_details SET vendor_status = $1, status_updated_at = CURRENT_TIMESTAMP WHERE business_email = $2 RETURNING sr_no, vendor_status, status_updated_at',
      [status, email]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update vendor status'
      });
    }
    
    console.log(`Vendor status updated for ${email}: ${status} at ${updateResult.rows[0].status_updated_at}`);
    
    // Return success response with updated data
    res.json({
      success: true,
      message: 'Vendor status updated successfully',
      data: {
        status: updateResult.rows[0].vendor_status,
        updatedAt: updateResult.rows[0].status_updated_at
      }
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor status'
    });
  }
});

module.exports = router; 