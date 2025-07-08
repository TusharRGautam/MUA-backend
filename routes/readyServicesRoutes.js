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
    const { categories, vendorEmail, businessType } = req.body;
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Categories array is required and cannot be empty'
      });
    }

    console.log(`[READY SERVICES API] Fetching services for categories:`, categories);
    console.log(`[READY SERVICES API] Vendor email:`, vendorEmail);
    console.log(`[READY SERVICES API] Business type:`, businessType);

    // Create placeholders for IN clause
    const placeholders = categories.map((_, index) => `$${index + 1}`).join(',');
    
    let queryText;
    let tableName;
    
    // Determine which table to query based on business type
    if (businessType === 'prp') {
      tableName = 'dashboard_prp_services';
      queryText = `
        SELECT 
          id,
          service_name,
          service_description,
          service_price as price,
          service_duration as duration,
          service_category as category
        FROM ${tableName} 
        WHERE service_category IN (${placeholders})
        ORDER BY service_category, service_name
      `;
    } else if (businessType === 'medical_diagnostics') {
      tableName = 'dashboard_diagnostics_services';
      queryText = `
        SELECT 
          id,
          service_name,
          service_description,
          service_price as price,
          service_duration as duration,
          service_category as category
        FROM ${tableName} 
        WHERE service_category IN (${placeholders})
        ORDER BY service_category, service_name
      `;
    } else if (businessType === 'salon') {
      tableName = 'dashboard_salon_services';
      queryText = `
        SELECT 
          id,
          service_name,
          service_description,
          service_price as price,
          service_duration as duration,
          service_category as category
        FROM ${tableName} 
        WHERE service_category IN (${placeholders})
        ORDER BY service_category, service_name
      `;
    } else {
      // Default fallback to our_services_section for backward compatibility and solo users
      tableName = 'our_services_section';
              queryText = `
          SELECT 
            s.id,
            s.service_name,
            s.service_description,
            s.price,
            s.duration,
            s.category,
            s.service_image,
            s.icon_id,
            i.icon_title,
            i.icon,
            i.icon_description
          FROM ${tableName} s
          LEFT JOIN our_services_icons i ON s.icon_id = i.id
          WHERE s.category IN (${placeholders})
          ORDER BY s.category, s.service_name
        `;
    }
    
    console.log(`[READY SERVICES API] Querying table: ${tableName}`);
    
    const result = await query(queryText, categories);
    const services = result.rows;
    
    console.log(`[READY SERVICES API] Found ${services.length} services from ${tableName}`);
    
    res.json({
      success: true,
      services: services,
      categories: categories,
      businessType: businessType,
      tableName: tableName,
      message: `Retrieved ${services.length} ready services for ${categories.length} categories from ${tableName}`
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

// GET all available categories based on business type
router.get('/categories', async (req, res) => {
  try {
    let { businessType } = req.query;
    
    console.log(`[READY SERVICES API] Raw businessType parameter:`, businessType);
    
    // Validate and sanitize business type
    const validBusinessTypes = ['salon', 'prp', 'medical_diagnostics', 'solo'];
    if (!businessType || !validBusinessTypes.includes(businessType)) {
      console.log(`[READY SERVICES API] Invalid business type '${businessType}', defaulting to 'salon'`);
      businessType = 'salon';
    }
    
    console.log(`[READY SERVICES API] Using validated businessType:`, businessType);
    
    let queryText;
    let categories = [];
    
    if (businessType === 'prp') {
      console.log('💉 Fetching unique PRP service categories from dashboard_prp_services');
      queryText = `
        SELECT DISTINCT service_category as category
        FROM dashboard_prp_services 
        WHERE service_category IS NOT NULL 
        AND service_category != '' 
        ORDER BY service_category
      `;
    } else if (businessType === 'medical_diagnostics') {
      console.log('🏥 Fetching unique diagnostics service categories from dashboard_diagnostics_services');
      queryText = `
        SELECT DISTINCT service_category as category
        FROM dashboard_diagnostics_services 
        WHERE service_category IS NOT NULL 
        AND service_category != '' 
        ORDER BY service_category
      `;
    } else if (businessType === 'salon') {
      console.log('🏪 Fetching unique salon service categories from dashboard_salon_services');
      queryText = `
        SELECT DISTINCT service_category as category
        FROM dashboard_salon_services 
        WHERE service_category IS NOT NULL 
        AND service_category != '' 
        ORDER BY service_category
      `;
    } else if (businessType === 'solo') {
      console.log('👤 Fetching unique solo service categories from our_services_section');
      queryText = `
        SELECT DISTINCT category
        FROM our_services_section 
        WHERE category IS NOT NULL 
        AND category != '' 
        ORDER BY category
      `;
    } else {
      // This should never happen now due to validation above, but keeping as safety fallback
      console.log('📋 Fallback: Using salon categories');
      queryText = `
        SELECT DISTINCT service_category as category
        FROM dashboard_salon_services 
        WHERE service_category IS NOT NULL 
        AND service_category != '' 
        ORDER BY service_category
      `;
    }
    
    const result = await query(queryText);
    categories = result.rows.map(row => row.category);
    
    console.log(`[READY SERVICES API] Found ${categories.length} categories for businessType: ${businessType}`);
    
    res.json({
      success: true,
      categories: categories,
      businessType: businessType || 'default',
      message: `Retrieved ${categories.length} service categories${businessType ? ` for business type: ${businessType}` : ''}`
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

// POST - Initialize vendor entry in ready_services_vendors_data table (without categories)
router.post('/vendor-init', async (req, res) => {
  try {
    const { vendor_email, vendor_id, business_type } = req.body;
    
    console.log('=== INITIALIZING VENDOR ENTRY ===');
    console.log('Request body:', req.body);
    console.log('vendor_email:', vendor_email);
    console.log('vendor_id:', vendor_id);
    console.log('business_type:', business_type);
    
    if (!vendor_email) {
      return res.status(400).json({
        success: false,
        message: 'vendor_email is required'
      });
    }

    // Start transaction
    await query('BEGIN');

    try {
      // If vendor_id wasn't provided, try to get it from registration table
      let resolvedVendorId = vendor_id;
      
      if (!resolvedVendorId) {
        console.log('No vendor_id provided, attempting to lookup by email:', vendor_email);
        const vendorLookupQuery = `
          SELECT sr_no FROM registration_and_other_details 
          WHERE business_email = $1 
          LIMIT 1
        `;
        const vendorResult = await query(vendorLookupQuery, [vendor_email]);
        
        if (vendorResult.rows.length > 0) {
          resolvedVendorId = vendorResult.rows[0].sr_no;
          console.log('Found vendor_id from lookup:', resolvedVendorId);
        } else {
          console.log('Could not find vendor_id for email:', vendor_email);
        }
      }
      
      // Check if vendor already exists
      const checkQuery = `
        SELECT id FROM ready_services_vendors_data 
        WHERE vendor_email = $1
      `;
      const result = await query(checkQuery, [vendor_email]);
      const existingRecords = result.rows;

      if (existingRecords.length > 0) {
        // Update existing record to ensure service_setup_type is 'ready'
        console.log('Updating existing vendor entry to ready state:', vendor_email);
        const updateQuery = `
          UPDATE ready_services_vendors_data 
          SET service_setup_type = 'ready', 
              business_type = $1,
              vendor_id = CASE WHEN $2::integer IS NULL THEN vendor_id ELSE $2::integer END,
              updated_at = CURRENT_TIMESTAMP
          WHERE vendor_email = $3
          RETURNING id, vendor_id, vendor_email, service_setup_type, business_type
        `;
        const updateResult = await query(updateQuery, [
          business_type || 'salon',
          resolvedVendorId,
          vendor_email
        ]);
        
        console.log('Update successful, affected rows:', updateResult.rowCount);
        console.log('Updated record:', updateResult.rows[0]);
      } else {
        // Insert new record with empty selected_categories
        console.log('Creating new vendor entry with ready state:', vendor_email);
        const insertQuery = `
          INSERT INTO ready_services_vendors_data 
          (vendor_id, vendor_email, selected_categories, service_setup_type, business_type) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, vendor_id, vendor_email, service_setup_type, business_type
        `;
        const insertResult = await query(insertQuery, [
          resolvedVendorId,
          vendor_email,
          JSON.stringify([]), // Empty categories array
          'ready',
          business_type || 'salon'
        ]);
        
        console.log('Insert successful, new record:', insertResult.rows[0]);
      }

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: 'Vendor initialized successfully for ready services',
        data: {
          vendor_id: resolvedVendorId,
          vendor_email,
          service_setup_type: 'ready',
          business_type: business_type || 'salon'
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error initializing vendor entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize vendor entry',
      error: error.message
    });
  }
});

// POST - Save vendor's selected categories for ready services
router.post('/vendor-categories', async (req, res) => {
  try {
    const { vendor_email, vendor_id, selected_categories, service_setup_type, provider_type, business_type } = req.body;
    
    console.log('=== SAVING VENDOR CATEGORIES ===');
    console.log('Request body:', req.body);
    console.log('vendor_email:', vendor_email);
    console.log('vendor_id:', vendor_id);
    console.log('selected_categories:', selected_categories);
    console.log('service_setup_type:', service_setup_type);
    console.log('provider_type:', provider_type);
    console.log('business_type:', business_type);
    
    if (!vendor_email || !selected_categories || !Array.isArray(selected_categories)) {
      return res.status(400).json({
        success: false,
        message: 'vendor_email and selected_categories array are required'
      });
    }

    // Prevent saving empty category arrays
    if (selected_categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'selected_categories cannot be empty. Please select at least one category.'
      });
    }

    // Start transaction to ensure both tables are updated together
    await query('BEGIN');

    try {
      // If vendor_id wasn't provided, try to get it from registration table
      let resolvedVendorId = vendor_id;
      
      if (!resolvedVendorId) {
        console.log('No vendor_id provided, attempting to lookup by email:', vendor_email);
        const vendorLookupQuery = `
          SELECT sr_no FROM registration_and_other_details 
          WHERE business_email = $1 
          LIMIT 1
        `;
        const vendorResult = await query(vendorLookupQuery, [vendor_email]);
        
        if (vendorResult.rows.length > 0) {
          resolvedVendorId = vendorResult.rows[0].sr_no;
          console.log('Found vendor_id from lookup:', resolvedVendorId);
        } else {
          console.log('Could not find vendor_id for email:', vendor_email);
        }
      }
      
      // 1. Save to ready_services_vendors_data table
      const checkQuery = `
        SELECT id FROM ready_services_vendors_data 
        WHERE vendor_email = $1
      `;
      const result = await query(checkQuery, [vendor_email]);
      const existingRecords = result.rows;

      if (existingRecords.length > 0) {
        // Update existing record - now includes business_type
        console.log('Updating existing record for vendor email:', vendor_email);
        const updateQuery = `
          UPDATE ready_services_vendors_data 
          SET selected_categories = $1, 
              service_setup_type = $2, 
              business_type = $3,
              vendor_id = CASE WHEN $4::integer IS NULL THEN vendor_id ELSE $4::integer END,
              updated_at = CURRENT_TIMESTAMP
          WHERE vendor_email = $5
          RETURNING id, vendor_id, vendor_email, selected_categories
        `;
        const updateResult = await query(updateQuery, [
          JSON.stringify(selected_categories),
          service_setup_type || 'ready',
          business_type || 'salon',
          resolvedVendorId,
          vendor_email
        ]);
        
        console.log('Update successful, affected rows:', updateResult.rowCount);
        console.log('Updated record:', updateResult.rows[0]);
      } else {
        // Insert new record - now includes business_type
        console.log('Creating new record for vendor email:', vendor_email);
        const insertQuery = `
          INSERT INTO ready_services_vendors_data 
          (vendor_id, vendor_email, selected_categories, service_setup_type, business_type) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, vendor_id, vendor_email, selected_categories
        `;
        const insertResult = await query(insertQuery, [
          resolvedVendorId,
          vendor_email,
          JSON.stringify(selected_categories),
          service_setup_type || 'ready',
          business_type || 'salon'
        ]);
        
        console.log('Insert successful, new record:', insertResult.rows[0]);
      }

      // 2. Also update registration_and_other_details table for compatibility
      console.log('Updating registration_and_other_details table...');
      try {
        const updateRegistrationQuery = `
          UPDATE registration_and_other_details 
          SET provider_type_single_or_multi = $1
          WHERE business_email = $2
          RETURNING sr_no, business_email
        `;
        const registrationUpdateResult = await query(updateRegistrationQuery, [
          provider_type || 'single', // Use provided provider_type or default to 'single'
          vendor_email
        ]);
        
        console.log('Registration table update result:', registrationUpdateResult.rowCount, 'rows affected');
        if (registrationUpdateResult.rowCount > 0) {
          console.log('Updated registration record:', registrationUpdateResult.rows[0]);
        }
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
          vendor_id: resolvedVendorId,
          vendor_email,
          selected_categories,
          service_setup_type: service_setup_type || 'ready',
          provider_type: provider_type || 'single',
          business_type: business_type || 'salon'
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('Transaction error:', error);
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
        business_type,
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

// GET - Check if vendor has already selected categories (for modal display logic)
router.get('/vendor-has-categories/:vendor_email', async (req, res) => {
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
        vendor_id,
        vendor_email,
        selected_categories,
        business_type,
        updated_at
      FROM ready_services_vendors_data 
      WHERE vendor_email = $1
      AND selected_categories IS NOT NULL 
      AND selected_categories != '[]'::jsonb
      AND jsonb_array_length(selected_categories) > 0
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await query(queryText, [vendor_email]);
    const records = result.rows;
    
    const hasCategories = records.length > 0;
    let categoriesData = null;
    
    if (hasCategories) {
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
      categoriesData = record;
    }

    res.json({
      success: true,
      hasCategories,
      data: categoriesData,
      message: hasCategories 
        ? 'Vendor has already selected categories' 
        : 'Vendor has not selected categories yet'
    });
  } catch (error) {
    console.error('Error checking vendor categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vendor categories',
      error: error.message
    });
  }
});

// GET - Check if vendor has categories by vendor_id (alternative endpoint)
router.get('/vendor-has-categories-by-id/:vendor_id', async (req, res) => {
  try {
    const { vendor_id } = req.params;
    
    if (!vendor_id) {
      return res.status(400).json({
        success: false,
        message: 'vendor_id is required'
      });
    }

    const queryText = `
      SELECT 
        vendor_id,
        vendor_email,
        selected_categories,
        business_type,
        updated_at
      FROM ready_services_vendors_data 
      WHERE vendor_id = $1
      AND selected_categories IS NOT NULL 
      AND selected_categories != '[]'::jsonb
      AND jsonb_array_length(selected_categories) > 0
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await query(queryText, [vendor_id]);
    const records = result.rows;
    
    const hasCategories = records.length > 0;
    let categoriesData = null;
    
    if (hasCategories) {
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
      categoriesData = record;
    }

    res.json({
      success: true,
      hasCategories,
      data: categoriesData,
      message: hasCategories 
        ? 'Vendor has already selected categories' 
        : 'Vendor has not selected categories yet'
    });
  } catch (error) {
    console.error('Error checking vendor categories by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vendor categories by ID',
      error: error.message
    });
  }
});

module.exports = router;