const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all ready services
router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        id,
        service_name,
        service_description,
        price,
        duration,
        category,
        service_image,
        toggle_gender_services,
        icon_id
      FROM our_services_section 
      ORDER BY category, service_name
    `;
    
    const result = await query(queryText);
    const services = result.rows;
    
    res.json({
      success: true,
      services: services,
      message: `Retrieved ${services.length} ready services`
    });
  } catch (error) {
    console.error('Error fetching ready services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ready services',
      message: error.message
    });
  }
});

// POST - Get ready services by category and gender
router.post('/', async (req, res) => {
  try {
    const { category, gender } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    console.log(`[READY SERVICES API] Fetching services for category: "${category}" and gender: "${gender}"`);

    let queryText, queryParams;
    
    if (gender) {
      // Filter by both category and gender
      queryText = `
        SELECT 
          id,
          service_name,
          service_description,
          price,
          duration,
          category,
          service_image,
          toggle_gender_services,
          icon_id
        FROM our_services_section 
        WHERE LOWER(category) = LOWER($1) 
        AND LOWER(toggle_gender_services) = LOWER($2)
        ORDER BY service_name
      `;
      queryParams = [category, gender];
    } else {
      // Filter by category only
      queryText = `
        SELECT 
          id,
          service_name,
          service_description,
          price,
          duration,
          category,
          service_image,
          toggle_gender_services,
          icon_id
        FROM our_services_section 
        WHERE LOWER(category) = LOWER($1)
        ORDER BY service_name
      `;
      queryParams = [category];
    }
    
    const result = await query(queryText, queryParams);
    const services = result.rows;
    
    console.log(`[READY SERVICES API] Found ${services.length} services for category: "${category}" and gender: "${gender}"`);
    
    res.json({
      success: true,
      services: services,
      category: category,
      gender: gender,
      message: `Retrieved ${services.length} services for category: ${category}${gender ? ` and gender: ${gender}` : ''}`
    });
  } catch (error) {
    console.error('[READY SERVICES API] Error fetching services by category and gender:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services by category and gender',
      message: error.message
    });
  }
});

// POST - Get ready services by categories
router.post('/by-categories', async (req, res) => {
  try {
    const { categories, vendorEmail } = req.body;
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Categories array is required and cannot be empty'
      });
    }

    console.log(`[READY SERVICES API] Fetching services for categories:`, categories);
    console.log(`[READY SERVICES API] Vendor email:`, vendorEmail);

    // Create placeholders for IN clause
    const placeholders = categories.map((_, index) => `$${index + 1}`).join(',');
    
    const queryText = `
      SELECT 
        id,
        service_name,
        service_description,
        price,
        duration,
        category,
        service_image
      FROM our_services_section 
      WHERE category IN (${placeholders})
      ORDER BY category, service_name
    `;
    
    const result = await query(queryText, categories);
    const services = result.rows;
    
    console.log(`[READY SERVICES API] Found ${services.length} services`);
    
    res.json({
      success: true,
      services: services,
      categories: categories,
      message: `Retrieved ${services.length} ready services for ${categories.length} categories`
    });
  } catch (error) {
    console.error('[READY SERVICES API] Error fetching services by categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ready services by categories',
      message: error.message
    });
  }
});

// GET services by specific category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const queryText = `
      SELECT 
        id,
        service_name,
        service_description,
        price,
        duration,
        category,
        service_image
      FROM our_services_section 
      WHERE category = $1
      ORDER BY service_name
    `;
    
    const result = await query(queryText, [category]);
    const services = result.rows;
    
    res.json({
      success: true,
      services: services,
      category: category,
      message: `Retrieved ${services.length} services for category: ${category}`
    });
  } catch (error) {
    console.error(`Error fetching services for category ${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services for category',
      message: error.message
    });
  }
});

// GET all available categories
router.get('/categories', async (req, res) => {
  try {
    const queryText = `
      SELECT DISTINCT category
      FROM our_services_section 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `;
    
    const result = await query(queryText);
    const categories = result.rows;
    
    res.json({
      success: true,
      categories: categories.map(row => row.category),
      message: `Retrieved ${categories.length} service categories`
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service categories',
      message: error.message
    });
  }
});

// POST - Save vendor's selected categories for ready services
router.post('/vendor-categories', async (req, res) => {
  try {
    const { vendor_email, vendor_id, selected_categories, service_setup_type, provider_type } = req.body;
    
    console.log('=== SAVING VENDOR CATEGORIES ===');
    console.log('Request body:', req.body);
    console.log('vendor_email:', vendor_email);
    console.log('selected_categories:', selected_categories);
    console.log('service_setup_type:', service_setup_type);
    console.log('provider_type:', provider_type);
    
    if (!vendor_email || !selected_categories || !Array.isArray(selected_categories)) {
      return res.status(400).json({
        success: false,
        message: 'vendor_email and selected_categories array are required'
      });
    }

    // Start transaction to ensure both tables are updated together
    await query('BEGIN');

    try {
      // 1. Save to ready_services_vendors_data table
      const checkQuery = `
        SELECT id FROM ready_services_vendors_data 
        WHERE vendor_email = $1
      `;
      const result = await query(checkQuery, [vendor_email]);
      const existingRecords = result.rows;

      if (existingRecords.length > 0) {
        // Update existing record
        const updateQuery = `
          UPDATE ready_services_vendors_data 
          SET selected_categories = $1, service_setup_type = $2, updated_at = CURRENT_TIMESTAMP
          WHERE vendor_email = $3
        `;
        await query(updateQuery, [
          JSON.stringify(selected_categories),
          'ready',
          vendor_email
        ]);
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO ready_services_vendors_data 
          (vendor_id, vendor_email, selected_categories, service_setup_type) 
          VALUES ($1, $2, $3, $4)
        `;
        await query(insertQuery, [
          vendor_id || null,
          vendor_email,
          JSON.stringify(selected_categories),
          'ready'
        ]);
      }

      // 2. Also update registration_and_other_details table for compatibility
      console.log('Updating registration_and_other_details table...');
      try {
        const updateRegistrationQuery = `
          UPDATE registration_and_other_details 
          SET provider_type_single_or_multi = $1
          WHERE business_email = $2
        `;
        const registrationUpdateResult = await query(updateRegistrationQuery, [
          provider_type || 'single', // Use provided provider_type or default to 'single'
          vendor_email
        ]);
        
        console.log('Registration table update result:', registrationUpdateResult.rowCount, 'rows affected');
      } catch (registrationError) {
        // Log the error but continue execution
        console.warn('Warning: Could not update registration_and_other_details table:', registrationError.message);
        console.log('Continuing without updating selected_category in registration table');
      }

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: 'Vendor category preferences saved successfully',
        data: {
          vendor_email,
          selected_categories,
          service_setup_type: service_setup_type || 'ready',
          provider_type: provider_type || 'single'
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving vendor category preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save vendor category preferences',
      error: error.message
    });
  }
});

// GET - Retrieve vendor's selected categories for ready services
router.get('/vendor-categories/:vendor_email', async (req, res) => {
  try {
    const { vendor_email } = req.params;
    
    if (!vendor_email) {
      return res.status(400).json({
        success: false,
        message: 'vendor_email is required'
      });
    }

    const queryText = `
      SELECT 
        id,
        vendor_id,
        vendor_email,
        selected_categories,
        service_setup_type,
        selection_timestamp,
        updated_at
      FROM ready_services_vendors_data 
      WHERE vendor_email = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await query(queryText, [vendor_email]);
    const records = result.rows;
    
    if (records.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No category preferences found for this vendor'
      });
    }

    const record = records[0];
    // Handle JSONB categories - they're already parsed by PostgreSQL
    if (typeof record.selected_categories === 'string') {
      try {
        record.selected_categories = JSON.parse(record.selected_categories);
      } catch (e) {
        console.error('Error parsing selected_categories:', e);
        record.selected_categories = [];
      }
    }

    res.json({
      success: true,
      data: record,
      message: 'Vendor category preferences retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving vendor category preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor category preferences',
      error: error.message
    });
  }
});

module.exports = router; 