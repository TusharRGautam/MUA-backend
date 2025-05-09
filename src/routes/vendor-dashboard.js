const express = require('express');
const router = express.Router();
const { pool, query } = require('../../db');
const { authenticateToken } = require('../../middleware/auth');

// Middleware to verify vendor role
const verifyVendorRole = async (req, res, next) => {
  try {
    // Get vendor info from database using the user ID from auth
    const vendorQuery = 'SELECT * FROM registration_and_other_details WHERE sr_no = $1';
    const vendorResult = await query(vendorQuery, [req.user.id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: User is not a vendor' });
    }
    
    // Store vendor data for route handlers to use
    req.vendor = vendorResult.rows[0];
    next();
  } catch (error) {
    console.error('Vendor verification error:', error);
    res.status(500).json({ error: 'Server error during vendor verification' });
  }
};

/**
 * @route GET /api/vendor/business-info
 * @desc Get vendor business information
 * @access Private (Vendor only)
 */
router.get('/business-info', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const businessInfoQuery = 'SELECT * FROM vendor_business_info WHERE vendor_id = $1';
    const businessInfoResult = await query(businessInfoQuery, [req.vendor.sr_no]);
    
    if (businessInfoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business information not found' });
    }
    
    res.json(businessInfoResult.rows[0]);
  } catch (error) {
    console.error('Error fetching business info:', error);
    res.status(500).json({ error: 'Server error fetching business information' });
  }
});

/**
 * @route POST /api/vendor/business-info
 * @desc Create or update vendor business information
 * @access Private (Vendor only)
 */
router.post('/business-info', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const { businessName, cityName, about, workingHours, profilePicture } = req.body;
    
    // Validate required inputs
    if (!businessName || !cityName) {
      return res.status(400).json({ error: 'Business name and city are required' });
    }
    
    // Check if record already exists
    const checkQuery = 'SELECT id FROM vendor_business_info WHERE vendor_id = $1';
    const checkResult = await query(checkQuery, [req.vendor.sr_no]);
    
    let result;
    if (checkResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE vendor_business_info 
        SET business_name = $1, city_name = $2, about = $3, working_hours = $4, profile_picture = $5
        WHERE vendor_id = $6
        RETURNING *
      `;
      result = await query(updateQuery, [
        businessName, 
        cityName, 
        about || null, 
        JSON.stringify(workingHours || {}), 
        profilePicture || null,
        req.vendor.sr_no
      ]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO vendor_business_info (vendor_id, business_name, city_name, about, working_hours, profile_picture)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      result = await query(insertQuery, [
        req.vendor.sr_no, 
        businessName, 
        cityName, 
        about || null, 
        JSON.stringify(workingHours || {}), 
        profilePicture || null
      ]);
    }
    
    res.status(200).json({
      message: 'Business information saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving business info:', error);
    res.status(500).json({ error: 'Server error saving business information' });
  }
});

/**
 * @route GET /api/vendor/services
 * @desc Get all services for a vendor
 * @access Private (Vendor only)
 */
router.get('/services', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const servicesQuery = 'SELECT * FROM vendor_single_services WHERE vendor_id = $1 ORDER BY id';
    const servicesResult = await query(servicesQuery, [req.vendor.sr_no]);
    
    res.json(servicesResult.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Server error fetching services' });
  }
});

/**
 * @route POST /api/vendor/services
 * @desc Create a new service
 * @access Private (Vendor only)
 */
router.post('/services', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const { name, type, price, duration } = req.body;
    
    // Validate required inputs
    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Service name, type, and price are required' });
    }
    
    const insertQuery = `
      INSERT INTO vendor_single_services (vendor_id, name, type, price, duration)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(insertQuery, [
      req.vendor.sr_no,
      name,
      type,
      price,
      duration || null
    ]);
    
    res.status(201).json({
      message: 'Service created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Server error creating service' });
  }
});

/**
 * @route PUT /api/vendor/services/:id
 * @desc Update a service
 * @access Private (Vendor only)
 */
router.put('/services/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { name, type, price, duration } = req.body;
    
    // Validate required inputs
    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Service name, type, and price are required' });
    }
    
    // Verify service belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_single_services WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [serviceId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or not authorized' });
    }
    
    const updateQuery = `
      UPDATE vendor_single_services 
      SET name = $1, type = $2, price = $3, duration = $4
      WHERE id = $5 AND vendor_id = $6
      RETURNING *
    `;
    const result = await query(updateQuery, [
      name,
      type,
      price,
      duration || null,
      serviceId,
      req.vendor.sr_no
    ]);
    
    res.json({
      message: 'Service updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Server error updating service' });
  }
});

/**
 * @route DELETE /api/vendor/services/:id
 * @desc Delete a service
 * @access Private (Vendor only)
 */
router.delete('/services/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // Verify service belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_single_services WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [serviceId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or not authorized' });
    }
    
    await query('DELETE FROM vendor_single_services WHERE id = $1', [serviceId]);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Server error deleting service' });
  }
});

/**
 * @route GET /api/vendor/packages
 * @desc Get all packages for a vendor
 * @access Private (Vendor only)
 */
router.get('/packages', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Get all packages with strict vendor filtering
      const packagesQuery = 'SELECT * FROM vendor_packages_services WHERE vendor_id = $1 ORDER BY id';
      const packagesResult = await client.query(packagesQuery, [req.vendor.sr_no]);
      
      // Get all services for each package with vendor_id filtering to ensure data isolation
      const packages = [];
      for (const pkg of packagesResult.rows) {
        const servicesQuery = 'SELECT id, name, price, category, description FROM package_services WHERE package_id = $1 AND vendor_id = $2';
        const servicesResult = await client.query(servicesQuery, [pkg.id, req.vendor.sr_no]);
        
        packages.push({
          ...pkg,
          services: servicesResult.rows
        });
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Return a consistent format with the other endpoints
      res.json({
        success: true,
        packages: packages
      });
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching packages' 
    });
  }
});

/**
 * @route POST /api/vendor/packages
 * @desc Create a new package with services
 * @access Private (Vendor only)
 */
router.post('/packages', authenticateToken, verifyVendorRole, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, price, services } = req.body;
    
    // Validate required inputs
    if (!name || !price || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ 
        error: 'Package name, price, and at least one service are required' 
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Insert package
    const packageInsertQuery = `
      INSERT INTO vendor_packages_services (vendor_id, name, price, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const packageResult = await client.query(packageInsertQuery, [
      req.vendor.sr_no,
      name,
      price,
      req.body.description || ''
    ]);
    
    const packageId = packageResult.rows[0].id;
    
    // Insert services
    for (const service of services) {
      if (!service.name || !service.price) {
        throw new Error('Each service must have a name and price');
      }
      
      const serviceInsertQuery = `
        INSERT INTO package_services (package_id, name, price, category, description, vendor_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(serviceInsertQuery, [
        packageId, 
        service.name, 
        service.price, 
        service.category || '',
        service.description || '',
        req.vendor.sr_no
      ]);
    }
    
    // Get services for response
    const servicesQuery = 'SELECT id, name, price, category, description FROM package_services WHERE package_id = $1 AND vendor_id = $2';
    const servicesResult = await client.query(servicesQuery, [packageId, req.vendor.sr_no]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Package created successfully',
      data: {
        ...packageResult.rows[0],
        services: servicesResult.rows
      }
    });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Server error creating package' });
  } finally {
    client.release();
  }
});

/**
 * @route PUT /api/vendor/packages/:id
 * @desc Update a package and its services
 * @access Private (Vendor only)
 */
router.put('/packages/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const packageId = req.params.id;
    const { name, price, services } = req.body;
    
    // Validate required inputs
    if (!name || !price || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ 
        error: 'Package name, price, and at least one service are required' 
      });
    }
    
    // Verify package belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_packages_services WHERE id = $1 AND vendor_id = $2';
    const checkResult = await client.query(checkQuery, [packageId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found or not authorized' });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Update package
    const packageUpdateQuery = `
      UPDATE vendor_packages_services 
      SET name = $1, price = $2, description = $3
      WHERE id = $4 AND vendor_id = $5
      RETURNING *
    `;
    const packageResult = await client.query(packageUpdateQuery, [
      name,
      price,
      req.body.description || '',
      packageId,
      req.vendor.sr_no
    ]);
    
    // Delete existing services
    await client.query('DELETE FROM package_services WHERE package_id = $1', [packageId]);
    
    // Insert new services
    for (const service of services) {
      if (!service.name || !service.price) {
        throw new Error('Each service must have a name and price');
      }
      
      const serviceInsertQuery = `
        INSERT INTO package_services (package_id, name, price, category, description, vendor_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(serviceInsertQuery, [
        packageId, 
        service.name, 
        service.price, 
        service.category || '',
        service.description || '',
        req.vendor.sr_no
      ]);
    }
    
    // Get services for response
    const servicesQuery = 'SELECT id, name, price, category, description FROM package_services WHERE package_id = $1 AND vendor_id = $2';
    const servicesResult = await client.query(servicesQuery, [packageId, req.vendor.sr_no]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.json({
      message: 'Package updated successfully',
      data: {
        ...packageResult.rows[0],
        services: servicesResult.rows
      }
    });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Server error updating package' });
  } finally {
    client.release();
  }
});

/**
 * @route DELETE /api/vendor/packages/:id
 * @desc Delete a package and its services
 * @access Private (Vendor only)
 */
router.delete('/packages/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const packageId = req.params.id;
    
    // Verify package belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_packages_services WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [packageId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found or not authorized' });
    }
    
    // Package services will be deleted automatically due to CASCADE constraint
    await query('DELETE FROM vendor_packages_services WHERE id = $1', [packageId]);
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Server error deleting package' });
  }
});

/**
 * @route GET /api/vendor/transformations
 * @desc Get all transformations for a vendor
 * @access Public (for vendor-specific data)
 */
router.get('/transformations', async (req, res) => {
  try {
    const { email } = req.query;
    
    console.log(`[GET transformations] Request for vendor email: ${email || 'missing'}`);
    
    if (!email) {
      console.error(`[GET transformations] Missing email parameter`);
      return res.status(400).json({ 
        success: false, 
        error: 'Vendor email is required' 
      });
    }
    
    // First, need to get the vendor_id from the email
    const vendorQuery = `
      SELECT sr_no FROM registration_and_other_details 
      WHERE business_email = $1
    `;
    
    const vendorResult = await query(vendorQuery, [email]);
    
    if (vendorResult.rows.length === 0) {
      console.error(`[GET transformations] No vendor found with email: ${email}`);
      return res.status(404).json({ 
        success: false,
        error: 'Vendor not found' 
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    console.log(`[GET transformations] Found vendor ID: ${vendorId}`);
    
    // Get transformations for this vendor
    const transformationsQuery = `
      SELECT * FROM vendor_transformations 
      WHERE vendor_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await query(transformationsQuery, [vendorId]);
    
    console.log(`[GET transformations] Found ${result.rows.length} transformations`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('[GET transformations] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error fetching transformations',
      details: error.message
    });
  }
});

/**
 * @route POST /api/vendor/transformations
 * @desc Create or update transformations
 * @access Private (Vendor only)
 */
router.post('/transformations', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const { vendorEmail, transformations } = req.body;
    
    console.log(`[POST transformations] Processing for vendor: ${vendorEmail || 'unknown'}`);
    console.log(`[POST transformations] Request body:`, JSON.stringify(req.body, null, 2));
    
    if (!transformations || !Array.isArray(transformations) || transformations.length === 0) {
      console.error('[POST transformations] Invalid request: missing or empty transformations array');
      return res.status(400).json({ 
        success: false,
        error: 'At least one transformation is required' 
      });
    }

    const results = [];
    
    // Process each transformation in the array
    for (const transformation of transformations) {
      // Normalize field names to handle different naming conventions
      const { 
        id, 
        title, 
        description, 
        before, beforeImage, before_image,
        after, afterImage, after_image
      } = transformation;
      
      // Handle different field naming conventions
      const actualBeforeImage = before || beforeImage || before_image;
      const actualAfterImage = after || afterImage || after_image;
      
      // Log the processed transformation
      console.log(`[POST transformations] Processing transformation: ${title}, ID: ${id || 'new'}`);
      console.log(`[POST transformations] Before image: ${actualBeforeImage ? 'Present' : 'Missing'}`);
      console.log(`[POST transformations] After image: ${actualAfterImage ? 'Present' : 'Missing'}`);
      
      // Validate required inputs
      if (!title || !actualBeforeImage || !actualAfterImage) {
        return res.status(400).json({ 
          success: false,
          error: 'Title, before image, and after image are required for each transformation',
          data: { title, beforeImage: !!actualBeforeImage, afterImage: !!actualAfterImage }
        });
      }
      
      let result;
      
      // If ID exists and isn't a local ID, update existing transformation
      if (id && !id.includes('local_')) {
        const updateQuery = `
          UPDATE vendor_transformations 
          SET title = $1, description = $2, before_image = $3, after_image = $4, updated_at = NOW()
          WHERE id = $5 AND vendor_id = $6
          RETURNING *
        `;
        
        result = await query(updateQuery, [
          title,
          description || null,
          actualBeforeImage,
          actualAfterImage,
          id,
          req.vendor.sr_no
        ]);
        
        if (result.rows.length === 0) {
          // If no rows were updated, the transformation doesn't exist or doesn't belong to this vendor
          // Create a new one instead
          console.log(`[POST transformations] No existing transformation found with ID ${id}, creating new`);
          const insertQuery = `
            INSERT INTO vendor_transformations (vendor_id, title, description, before_image, after_image)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;
          
          result = await query(insertQuery, [
            req.vendor.sr_no,
            title,
            description || null,
            actualBeforeImage,
            actualAfterImage
          ]);
        } else {
          console.log(`[POST transformations] Updated existing transformation with ID ${id}`);
        }
      } else {
        // No ID or local ID, create new transformation
        console.log(`[POST transformations] Creating new transformation`);
        const insertQuery = `
          INSERT INTO vendor_transformations (vendor_id, title, description, before_image, after_image)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        result = await query(insertQuery, [
          req.vendor.sr_no,
          title,
          description || null,
          actualBeforeImage,
          actualAfterImage
        ]);
        
        console.log(`[POST transformations] Created new transformation with ID ${result.rows[0].id}`);
      }
      
      results.push(result.rows[0]);
    }
    
    res.status(201).json({
      success: true,
      message: 'Transformations saved successfully',
      data: results
    });
  } catch (error) {
    console.error('[POST transformations] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error saving transformations',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/vendor/transformations/:id
 * @desc Update a transformation
 * @access Private (Vendor only)
 */
router.put('/transformations/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const transformationId = req.params.id;
    const { title, description, beforeImage, afterImage } = req.body;
    
    // Validate required inputs
    if (!title || !beforeImage || !afterImage) {
      return res.status(400).json({ error: 'Title, before image, and after image are required' });
    }
    
    // Verify transformation belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_transformations WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [transformationId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transformation not found or not authorized' });
    }
    
    const updateQuery = `
      UPDATE vendor_transformations 
      SET title = $1, description = $2, before_image = $3, after_image = $4
      WHERE id = $5 AND vendor_id = $6
      RETURNING *
    `;
    const result = await query(updateQuery, [
      title,
      description || null,
      beforeImage,
      afterImage,
      transformationId,
      req.vendor.sr_no
    ]);
    
    res.json({
      message: 'Transformation updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating transformation:', error);
    res.status(500).json({ error: 'Server error updating transformation' });
  }
});

/**
 * @route DELETE /api/vendor/transformations/:id
 * @desc Delete a transformation
 * @access Public (for vendor-specific data)
 */
router.delete('/transformations/:id', async (req, res) => {
  try {
    const transformationId = req.params.id;
    const { vendorEmail } = req.query;
    
    console.log(`[DELETE transformation] Request for ID: ${transformationId}, vendor: ${vendorEmail || 'missing'}`);
    
    if (!vendorEmail) {
      console.error('[DELETE transformation] Missing vendor email');
      return res.status(400).json({ 
        success: false, 
        error: 'Vendor email is required' 
      });
    }
    
    // First, get the vendor ID from email
    const vendorQuery = `
      SELECT sr_no FROM registration_and_other_details 
      WHERE business_email = $1
    `;
    
    const vendorResult = await query(vendorQuery, [vendorEmail]);
    
    if (vendorResult.rows.length === 0) {
      console.error(`[DELETE transformation] No vendor found with email: ${vendorEmail}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Vendor not found' 
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Verify transformation belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_transformations WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [transformationId, vendorId]);
    
    if (checkResult.rows.length === 0) {
      console.error(`[DELETE transformation] Transformation not found or not owned by vendor`);
      return res.status(404).json({ 
        success: false, 
        error: 'Transformation not found or not authorized' 
      });
    }
    
    await query('DELETE FROM vendor_transformations WHERE id = $1', [transformationId]);
    
    console.log(`[DELETE transformation] Successfully deleted transformation ${transformationId}`);
    res.json({ 
      success: true, 
      message: 'Transformation deleted successfully' 
    });
  } catch (error) {
    console.error('[DELETE transformation] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error deleting transformation',
      details: error.message
    });
  }
});

/**
 * @route GET /api/vendor/gallery
 * @desc Get all gallery images for a vendor
 * @access Private (Vendor only)
 */
router.get('/gallery', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    // Updated query to include the featured field
    const query = 'SELECT * FROM vendor_gallery_images WHERE vendor_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [req.vendor.sr_no]);
    
    // Return data in a format that matches the frontend expectations
    res.json({
      success: true,
      images: result.rows
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching gallery images' 
    });
  }
});

/**
 * @route POST /api/vendor/gallery
 * @desc Create a new gallery image
 * @access Private (Vendor only)
 */
router.post('/gallery', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const { url, caption, featured } = req.body;
    
    // Validate required inputs
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'Image URL is required' 
      });
    }
    
    // Updated query to include featured field
    const insertQuery = `
      INSERT INTO vendor_gallery_images (vendor_id, url, caption, featured)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      req.vendor.sr_no,
      url,
      caption || null,
      featured || false
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Gallery image added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error adding gallery image' 
    });
  }
});

/**
 * @route PUT /api/vendor/gallery/:id
 * @desc Update a gallery image
 * @access Private (Vendor only)
 */
router.put('/gallery/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const imageId = req.params.id;
    const { url, caption, featured } = req.body;
    
    // Validate required inputs
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'Image URL is required' 
      });
    }
    
    // Verify image belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2';
    const checkResult = await pool.query(checkQuery, [imageId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Gallery image not found or not authorized' 
      });
    }
    
    // Updated query to include featured field
    const updateQuery = `
      UPDATE vendor_gallery_images 
      SET url = $1, caption = $2, featured = $3
      WHERE id = $4 AND vendor_id = $5
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      url,
      caption || null,
      featured !== undefined ? featured : false,
      imageId,
      req.vendor.sr_no
    ]);
    
    res.json({
      success: true,
      message: 'Gallery image updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating gallery image' 
    });
  }
});

/**
 * @route DELETE /api/vendor/gallery/:id
 * @desc Delete a gallery image
 * @access Private (Vendor only)
 */
router.delete('/gallery/:id', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const imageId = req.params.id;
    
    // Verify image belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [imageId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gallery image not found or not authorized' });
    }
    
    await query('DELETE FROM vendor_gallery_images WHERE id = $1', [imageId]);
    
    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Server error deleting gallery image' });
  }
});

/**
 * @route GET /api/vendor/bookings
 * @desc Get all bookings for a vendor
 * @access Private (Vendor only)
 */
router.get('/bookings', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let bookingsQuery = 'SELECT * FROM vendor_bookings WHERE vendor_id = $1';
    const queryParams = [req.vendor.sr_no];
    
    // Add status filter if provided
    if (status) {
      bookingsQuery += ' AND booking_status = $2';
      queryParams.push(status);
    }
    
    // Add search filter if provided
    if (search) {
      const paramIndex = queryParams.length + 1;
      bookingsQuery += ` AND (customer_name ILIKE $${paramIndex} OR service_name ILIKE $${paramIndex} OR contact_number ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
    }
    
    bookingsQuery += ' ORDER BY date_time DESC';
    
    const result = await query(bookingsQuery, queryParams);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

/**
 * @route PUT /api/vendor/bookings/:id/status
 * @desc Update booking status
 * @access Private (Vendor only)
 */
router.put('/bookings/:id/status', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'denied', 'started', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    // Verify booking belongs to this vendor
    const checkQuery = 'SELECT id FROM vendor_bookings WHERE id = $1 AND vendor_id = $2';
    const checkResult = await query(checkQuery, [bookingId, req.vendor.sr_no]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or not authorized' });
    }
    
    const updateQuery = `
      UPDATE vendor_bookings 
      SET booking_status = $1, is_new = false
      WHERE id = $2 AND vendor_id = $3
      RETURNING *
    `;
    const result = await query(updateQuery, [status, bookingId, req.vendor.sr_no]);
    
    res.json({
      message: 'Booking status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Server error updating booking status' });
  }
});

/**
 * @route PUT /api/vendor/bookings/clear-new
 * @desc Mark all new bookings as seen
 * @access Private (Vendor only)
 */
router.put('/bookings/clear-new', authenticateToken, verifyVendorRole, async (req, res) => {
  try {
    const updateQuery = 'UPDATE vendor_bookings SET is_new = false WHERE vendor_id = $1 AND is_new = true';
    await query(updateQuery, [req.vendor.sr_no]);
    
    res.json({ message: 'New booking alerts cleared successfully' });
  } catch (error) {
    console.error('Error clearing new booking alerts:', error);
    res.status(500).json({ error: 'Server error clearing new booking alerts' });
  }
});

module.exports = router; 