const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken, conditionalVendorAuth } = require('../middleware/auth');

/**
 * @route GET /api/vendor-preferences
 * @desc Get vendor preferences
 * @access Private (vendors only)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req;
    
    // Query to get vendor preferences from database
    const vendorResult = await query(
      'SELECT sr_no, business_email FROM registration_and_other_details WHERE user_id = $1',
      [user_id]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get vendor preferences
    const preferencesResult = await query(
      'SELECT * FROM vendor_preferences WHERE vendor_id = $1',
      [vendorId]
    );
    
    // If no preferences exist yet, return an empty object
    if (preferencesResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          vendorId,
          preferences: {}
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        vendorId,
        preferences: preferencesResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error getting vendor preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get vendor preferences',
      error: error.message
    });
  }
});

/**
 * @route POST /api/vendor-preferences
 * @desc Save vendor preferences
 * @access Private (vendors only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req;
    const { serviceTypes, providerType, serviceCategories, bookingPreferences } = req.body;
    
    // Get vendor ID
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE user_id = $1',
      [user_id]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Check if preferences already exist
    const existingPrefs = await query(
      'SELECT * FROM vendor_preferences WHERE vendor_id = $1',
      [vendorId]
    );
    
    if (existingPrefs.rows.length > 0) {
      // Update existing preferences
      await query(
        `UPDATE vendor_preferences 
         SET service_types = $1, provider_type = $2, service_categories = $3, booking_preferences = $4,
             updated_at = NOW()
         WHERE vendor_id = $5`,
        [serviceTypes, providerType, serviceCategories, bookingPreferences, vendorId]
      );
    } else {
      // Insert new preferences
      await query(
        `INSERT INTO vendor_preferences 
         (vendor_id, service_types, provider_type, service_categories, booking_preferences, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [vendorId, serviceTypes, providerType, serviceCategories, bookingPreferences]
      );
    }
    
    return res.status(200).json({
      success: true,
      message: 'Vendor preferences saved successfully',
      data: { vendorId, serviceTypes, providerType, serviceCategories, bookingPreferences }
    });
    
  } catch (error) {
    console.error('Error saving vendor preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save vendor preferences',
      error: error.message
    });
  }
});

// Get vendor preferences
router.get('/preferences', async (req, res) => {
  try {
    const { vendorEmail } = req.query;
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Vendor email is required'
      });
    }

    console.log('Fetching vendor preferences for:', vendorEmail);

    // Check if vendor preferences exist
    const checkQuery = `
      SELECT * FROM vendor_preferences 
      WHERE vendor_email = $1
    `;
    
    const result = await query(checkQuery, [vendorEmail]);
    
    if (result.rows && result.rows.length > 0) {
      const preferences = result.rows[0];
      console.log('Vendor preferences found:', preferences);
      
      return res.json({
        success: true,
        data: {
          serviceSetupType: preferences.service_setup_type,
          providerType: preferences.provider_type,
          selectedCategories: preferences.selected_categories ? preferences.selected_categories.split(',') : [],
          acceptsOurServices: preferences.accepts_our_services,
          autoAcceptBookings: preferences.auto_accept_bookings,
          maxServiceRadius: preferences.max_service_radius,
          minimumOrderAmount: preferences.minimum_order_amount,
          createdAt: preferences.created_at,
          updatedAt: preferences.updated_at
        }
      });
    } else {
      console.log('No vendor preferences found for:', vendorEmail);
      return res.json({
        success: false,
        message: 'No preferences found'
      });
    }
  } catch (error) {
    console.error('Error fetching vendor preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor preferences'
    });
  }
});

// Save vendor preferences
router.post('/preferences', async (req, res) => {
  try {
    const {
      vendorEmail,
      serviceSetupType,
      providerType,
      selectedCategories,
      acceptsOurServices,
      autoAcceptBookings,
      maxServiceRadius,
      minimumOrderAmount
    } = req.body;

    if (!vendorEmail || !serviceSetupType) {
      return res.status(400).json({
        success: false,
        error: 'Vendor email and service setup type are required'
      });
    }

    console.log('Saving vendor preferences for:', vendorEmail);

    // First check if preferences already exist
    const checkQuery = `
      SELECT id FROM vendor_preferences 
      WHERE vendor_email = $1
    `;
    
    const existingResult = await query(checkQuery, [vendorEmail]);
    
    if (existingResult.rows && existingResult.rows.length > 0) {
      // Update existing preferences
      const updateQuery = `
        UPDATE vendor_preferences SET
          service_setup_type = $2,
          provider_type = $3,
          selected_categories = $4,
          accepts_our_services = $5,
          auto_accept_bookings = $6,
          max_service_radius = $7,
          minimum_order_amount = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE vendor_email = $1
        RETURNING *
      `;
      
      const categoriesString = Array.isArray(selectedCategories) ? selectedCategories.join(',') : selectedCategories;
      
      const updateResult = await query(updateQuery, [
        vendorEmail,
        serviceSetupType,
        providerType || 'single',
        categoriesString || '',
        acceptsOurServices || true,
        autoAcceptBookings || false,
        maxServiceRadius || 15,
        minimumOrderAmount || 500
      ]);
      
      console.log('Vendor preferences updated successfully');
      
      return res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updateResult.rows[0]
      });
    } else {
      // Create new preferences
      const insertQuery = `
        INSERT INTO vendor_preferences (
          vendor_email,
          service_setup_type,
          provider_type,
          selected_categories,
          accepts_our_services,
          auto_accept_bookings,
          max_service_radius,
          minimum_order_amount,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const categoriesString = Array.isArray(selectedCategories) ? selectedCategories.join(',') : selectedCategories;
      
      const insertResult = await query(insertQuery, [
        vendorEmail,
        serviceSetupType,
        providerType || 'single',
        categoriesString || '',
        acceptsOurServices || true,
        autoAcceptBookings || false,
        maxServiceRadius || 15,
        minimumOrderAmount || 500
      ]);
      
      console.log('Vendor preferences created successfully');
      
      return res.json({
        success: true,
        message: 'Preferences saved successfully',
        data: insertResult.rows[0]
      });
    }
  } catch (error) {
    console.error('Error saving vendor preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save vendor preferences'
    });
  }
});

module.exports = router; 