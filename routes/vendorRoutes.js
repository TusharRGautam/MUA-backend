const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Vendor Routes - These endpoints handle vendor-specific data
 * All endpoints enforce data isolation by filtering with vendor_id or vendor_email
 */

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
    
    res.json({
      success: true,
      message: 'Services saved successfully'
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
    
    // Get vendor packages
    const packagesResult = await query(
      'SELECT * FROM vendor_packages WHERE vendor_id = $1',
      [vendorId]
    );
    
    // Get services for each package
    const packages = [];
    for (const pkg of packagesResult.rows) {
      const servicesResult = await query(
        'SELECT name, price FROM vendor_package_services WHERE package_id = $1',
        [pkg.id]
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

module.exports = router; 