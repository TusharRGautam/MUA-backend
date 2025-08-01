const express = require('express');
const router = express.Router();
const { pool, query } = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * Debug endpoint to check dashboard_salon_services table data
 * GET /api/salons/debug/dashboard-services
 */
router.get('/debug/dashboard-services', async (req, res, next) => {
  try {
    console.log('Debug: Checking dashboard_salon_services table');
    
    // First check if table exists and get column info
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dashboard_salon_services'
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await query(columnsQuery);
    console.log('Table columns:', columnsResult.rows);
    
    // Check table data count
    const countQuery = `SELECT COUNT(*) as total_services FROM dashboard_salon_services`;
    const countResult = await query(countQuery);
    console.log('Total services count:', countResult.rows[0]);
    
    // Get sample data with available columns
    const availableColumns = columnsResult.rows.map(row => row.column_name);
    const columnsToSelect = ['id', 'service_name'];
    
    // Add service_category or service_categories based on what exists
    if (availableColumns.includes('service_category')) {
      columnsToSelect.push('service_category');
    } else if (availableColumns.includes('service_categories')) {
      columnsToSelect.push('service_categories');
    }
    
    // Add price if it exists
    if (availableColumns.includes('price')) {
      columnsToSelect.push('price');
    }
    
    const sampleQuery = `
      SELECT ${columnsToSelect.join(', ')}
      FROM dashboard_salon_services
      LIMIT 10
    `;
    
    const sampleData = await query(sampleQuery);
    console.log('Sample data:', sampleData.rows);
    
    res.status(200).json({
      columns: columnsResult.rows,
      total_services: countResult.rows[0].total_services,
      sample_data: sampleData.rows
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all salons
 * GET /api/salons
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching all salons');
    
    const salonsQuery = `
      SELECT 
        b.sr_no AS id,
        b.business_name AS name,
        b.business_address AS address,
        b.business_city AS city,
        b.business_distance AS distance,
        COALESCE(AVG(r.rating)::NUMERIC(2,1), 0) AS rating,
        COUNT(r.review_id) AS review_count,
        b.business_cover_image AS image,
        b.business_description AS description
      FROM business_details b
      LEFT JOIN reviews r ON b.sr_no = r.business_id
      WHERE b.business_type = 'Salon'
      GROUP BY b.sr_no
      ORDER BY rating DESC, review_count DESC
      LIMIT 50
    `;
    
    const result = await query(salonsQuery);
    
    if (result.rows.length === 0) {
      console.log('No salons found');
      return res.status(200).json([]);
    }
    
    console.log(`Found ${result.rows.length} salons`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching salons:', error);
    next(error);
  }
});

/**
 * Get salon by ID with all details
 * GET /api/salons/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // Main salon query
    const salonQuery = `
      SELECT 
        b.sr_no AS id,
        b.business_name AS name,
        b.business_address AS address,
        b.business_city AS city,
        b.business_distance AS distance,
        COALESCE(AVG(r.rating)::NUMERIC(2,1), 0) AS rating,
        COUNT(r.review_id) AS review_count,
        b.business_cover_image AS image,
        b.business_description AS description,
        b.business_phone AS phone,
        b.business_email AS email,
        b.working_hours AS operating_hours
      FROM business_details b
      LEFT JOIN reviews r ON b.sr_no = r.business_id
      WHERE b.sr_no = $1 AND b.business_type = 'Salon'
      GROUP BY b.sr_no
    `;
    
    const salonResult = await query(salonQuery, [id]);
    
    if (salonResult.rows.length === 0) {
      console.log(`Salon with ID ${id} not found`);
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    const salon = salonResult.rows[0];
    
    // Fetch salon services
    const servicesQuery = `
      SELECT 
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration
      FROM services s
      WHERE s.business_id = $1
      ORDER BY s.service_category, s.service_name
    `;
    
    const servicesResult = await query(servicesQuery, [id]);
    salon.services = servicesResult.rows;
    
    // Fetch salon artists
    const artistsQuery = `
      SELECT 
        a.artist_id AS id,
        a.full_name,
        a.profile_image,
        a.specialties,
        a.rating,
        a.experience_years
      FROM artists a
      WHERE a.business_id = $1
    `;
    
    const artistsResult = await query(artistsQuery, [id]);
    salon.artists = artistsResult.rows;
    
    // Fetch gallery items
    const galleryQuery = `
      SELECT 
        g.gallery_id AS id,
        g.image_url AS image,
        g.gallery_type AS type
      FROM gallery g
      WHERE g.business_id = $1
    `;
    
    const galleryResult = await query(galleryQuery, [id]);
    salon.gallery = galleryResult.rows;
    
    // Fetch reviews
    const reviewsQuery = `
      SELECT 
        r.review_id AS id,
        u.user_name,
        u.avatar,
        r.rating,
        r.review_text AS comment,
        r.review_date AS date
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.business_id = $1
      ORDER BY r.review_date DESC
      LIMIT 10
    `;
    
    const reviewsResult = await query(reviewsQuery, [id]);
    salon.reviews = reviewsResult.rows;
    
    console.log(`Successfully fetched salon with ID ${id}`);
    res.status(200).json(salon);
  } catch (error) {
    console.error(`Error fetching salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get salon services
 * GET /api/salons/:id/services
 */
router.get('/:id/services', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching services for salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    const servicesQuery = `
      SELECT 
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration
      FROM services s
      WHERE s.business_id = $1
      ORDER BY s.service_category, s.service_name
    `;
    
    const result = await query(servicesQuery, [id]);
    
    console.log(`Found ${result.rows.length} services for salon with ID ${id}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching services for salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get salon artists
 * GET /api/salons/:id/artists
 */
router.get('/:id/artists', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching artists for salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    const artistsQuery = `
      SELECT 
        a.artist_id AS id,
        a.full_name,
        a.profile_image,
        a.specialties,
        a.rating,
        a.experience_years
      FROM artists a
      WHERE a.business_id = $1
    `;
    
    const result = await query(artistsQuery, [id]);
    
    console.log(`Found ${result.rows.length} artists for salon with ID ${id}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching artists for salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get dashboard salon services by service type
 * GET /api/salons/:id/dashboard-services/:serviceType
 */
router.get('/:id/dashboard-services/:serviceType', async (req, res, next) => {
  try {
    const { id, serviceType } = req.params;
    console.log(`Fetching ${serviceType} services for salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    if (!['single', 'combo', 'package'].includes(serviceType)) {
      return res.status(400).json({ error: 'Invalid service type. Must be single, combo, or package' });
    }
    
    const servicesQuery = `
      SELECT 
        id,
        service_name AS name,
        service_category AS category,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image AS image,
        'single' as service_type,
        created_at,
        updated_at
      FROM dashboard_salon_services
      ORDER BY service_name
    `;
    
    const result = await query(servicesQuery, [id]);
    
    console.log(`Found ${result.rows.length} ${serviceType} services for salon with ID ${id}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching ${req.params.serviceType} services for salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get all dashboard salon services (service catalog - not vendor specific)
 * GET /api/salons/:id/dashboard-services
 */
router.get('/:id/dashboard-services', async (req, res, next) => {
  try {
    console.log(`Fetching dashboard service catalog (not vendor-specific)`);
    
    // Dashboard services are a global catalog, not vendor-specific
    const servicesQuery = `
      SELECT 
        id,
        service_name AS name,
        service_category AS category,
        service_duration AS duration,
        service_description AS description,
        service_type,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image AS image,
        created_at,
        updated_at
      FROM dashboard_salon_services
      ORDER BY service_type, service_category, service_name
    `;
    
    const result = await query(servicesQuery);
    
    // Group services by service_type
    const servicesByType = {
      single: result.rows.filter(service => service.service_type?.toLowerCase() === 'single'),
      combo: result.rows.filter(service => service.service_type?.toLowerCase() === 'combo'),
      package: result.rows.filter(service => service.service_type?.toLowerCase() === 'package')
    };
    
    console.log(`Found ${result.rows.length} total dashboard services in catalog - Single: ${servicesByType.single.length}, Combo: ${servicesByType.combo.length}, Package: ${servicesByType.package.length}`);
    res.status(200).json(servicesByType);
  } catch (error) {
    console.error(`Error fetching dashboard services catalog:`, error);
    next(error);
  }
});

/**
 * Get vendor data from ready_services_vendors_data by business_type = salon
 * GET /api/salons/:id/vendor-data
 */
router.get('/:id/vendor-data', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching vendor data for salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // First get vendor basic info from registration_and_other_details where business_type = 'salon'
    const vendorQuery = `
      SELECT 
        sr_no as vendor_id,
        business_type,
        person_name,
        business_email,
        business_name,
        selected_category
      FROM registration_and_other_details
      WHERE sr_no = $1 AND LOWER(business_type) = 'salon'
    `;
    
    const vendorResult = await query(vendorQuery, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon vendor not found' });
    }
    
    const vendor = vendorResult.rows[0];
    
    // Try to get additional data from ready_services_vendors_data if exists
    const readyServicesQuery = `
      SELECT 
        selected_categories
      FROM ready_services_vendors_data
      WHERE vendor_id = $1
    `;
    
    const readyServicesResult = await query(readyServicesQuery, [id]);
    
    // Combine the data
    const result = {
      ...vendor,
      ready_services_data: readyServicesResult.rows.length > 0 ? readyServicesResult.rows[0] : null
    };
    
    console.log(`Found vendor data for salon with ID ${id}`);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error fetching vendor data for salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get dashboard salon services filtered by vendor's selected categories
 * GET /api/salons/:id/services-by-categories
 */
router.get('/:id/services-by-categories', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching services by vendor categories for salon with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // First get vendor's selected categories
    const vendorQuery = `
      SELECT 
        r.selected_category,
        rv.selected_categories
      FROM registration_and_other_details r
      LEFT JOIN ready_services_vendors_data rv ON r.sr_no = rv.vendor_id
      WHERE r.sr_no = $1 AND LOWER(r.business_type) = 'salon'
    `;
    
    const vendorResult = await query(vendorQuery, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon vendor not found' });
    }
    
    const vendor = vendorResult.rows[0];
    let selectedCategories = [];
    
    console.log('Raw vendor data:', vendor);
    
    // Parse selected categories from different sources
    if (vendor.selected_categories && vendor.selected_categories !== null) {
      try {
        // If it's already an array (parsed JSON)
        if (Array.isArray(vendor.selected_categories)) {
          selectedCategories = vendor.selected_categories;
        } else if (typeof vendor.selected_categories === 'string') {
          // Try to parse as JSON first
          try {
            selectedCategories = JSON.parse(vendor.selected_categories);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            selectedCategories = vendor.selected_categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
          }
        }
      } catch (e) {
        console.error('Error parsing selected_categories:', e);
        selectedCategories = [];
      }
    } else if (vendor.selected_category && vendor.selected_category !== null) {
      // If from registration_and_other_details, it might be comma-separated
      if (typeof vendor.selected_category === 'string') {
        selectedCategories = vendor.selected_category.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
      }
    }
    
    console.log(`Parsed vendor selected categories:`, selectedCategories);
    
    if (selectedCategories.length === 0) {
      // If no categories selected, return all dashboard services
      console.log('No categories selected, returning all dashboard services');
      const allServicesQuery = `
        SELECT 
          id,
          service_name AS name,
          service_category AS category,
          duration,
          description,
          things_to_know,
          what_packages_include,
          precautions,
          products_used,
          before_and_after_image,
          gallery_image,
          service_image AS image,
          'single' as service_type,
          created_at,
          updated_at
        FROM dashboard_salon_services
        ORDER BY service_category, service_name
      `;
      
      const allResult = await query(allServicesQuery);
      
      return res.status(200).json({
        single: allResult.rows,
        combo: [],
        package: [],
        selected_categories: [],
        message: 'No categories selected - showing all available services'
      });
    }
    
    // Filter dashboard services by vendor's selected categories
    const categoryPlaceholders = selectedCategories.map((_, index) => `$${index + 1}`).join(', ');
    
    const servicesQuery = `
      SELECT 
        id,
        service_name AS name,
        service_category AS category,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image AS image,
        'single' as service_type,
        created_at,
        updated_at
      FROM dashboard_salon_services
      WHERE service_category IN (${categoryPlaceholders})
      ORDER BY service_category, service_name
    `;
    
    const result = await query(servicesQuery, selectedCategories);
    
    // Group services by type (for now, all services are treated as 'single')
    const servicesByType = {
      single: result.rows,
      combo: [],
      package: []
    };
    
    console.log(`Found ${result.rows.length} services matching vendor categories for salon with ID ${id}`);
    res.status(200).json({
      ...servicesByType,
      selected_categories: selectedCategories
    });
  } catch (error) {
    console.error(`Error fetching services by categories for salon with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get vendor data specifically for salon business type
 * GET /api/salons/:id/vendor-data-salon
 */
router.get('/:id/vendor-data-salon', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching salon vendor data for ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // Get vendor data from ready_services_vendors_data where business_type = 'salon'
    const vendorQuery = `
      SELECT 
        rsv.id,
        rsv.vendor_id,
        rsv.vendor_email,
        rsv.selected_categories,
        rsv.business_type,
        rod.person_name,
        rod.business_name
      FROM ready_services_vendors_data rsv
      JOIN registration_and_other_details rod ON rsv.vendor_id = rod.sr_no
      WHERE rsv.vendor_id = $1 AND LOWER(rsv.business_type) = 'salon'
    `;
    
    const result = await query(vendorQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Salon vendor data not found',
        message: 'No salon vendor found with the provided ID in ready_services_vendors_data table'
      });
    }
    
    const vendorData = result.rows[0];
    
    // Parse selected_categories if it's a JSON string
    if (vendorData.selected_categories && typeof vendorData.selected_categories === 'string') {
      try {
        vendorData.selected_categories = JSON.parse(vendorData.selected_categories);
      } catch (e) {
        console.warn('Failed to parse selected_categories as JSON:', e);
      }
    }
    
    console.log(`Found salon vendor data for ID ${id}:`, vendorData);
    res.status(200).json(vendorData);
  } catch (error) {
    console.error(`Error fetching salon vendor data for ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get dashboard salon services filtered by vendor's selected categories
 * GET /api/salons/:id/services-filtered-by-categories
 */
router.get('/:id/services-filtered-by-categories', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching filtered services for salon ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // First get vendor's selected categories from ready_services_vendors_data
    const vendorQuery = `
      SELECT selected_categories
      FROM ready_services_vendors_data
      WHERE vendor_id = $1 AND LOWER(business_type) = 'salon'
    `;
    
    const vendorResult = await query(vendorQuery, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Salon vendor not found',
        message: 'No salon vendor found with the provided ID in ready_services_vendors_data table'
      });
    }
    
    let selectedCategories = [];
    const rawCategories = vendorResult.rows[0].selected_categories;
    
    // Parse selected categories
    if (rawCategories) {
      try {
        if (Array.isArray(rawCategories)) {
          selectedCategories = rawCategories;
        } else if (typeof rawCategories === 'string') {
          selectedCategories = JSON.parse(rawCategories);
        }
      } catch (e) {
        console.warn('Failed to parse selected_categories:', e);
        selectedCategories = [];
      }
    }
    
    console.log(`Vendor selected categories:`, selectedCategories);
    
    if (selectedCategories.length === 0) {
      return res.status(200).json({
        services: [],
        selected_categories: [],
        message: 'No categories selected by vendor'
      });
    }
    
    // Build dynamic query to match selected categories with service_categories
    // Using ILIKE for case-insensitive matching
    const categoryConditions = selectedCategories.map((_, index) => 
      `service_category ILIKE $${index + 1}`
    ).join(' OR ');
    
    const servicesQuery = `
      SELECT 
        id,
        service_name AS name,
        service_category AS category,
        service_price AS price,
        service_duration AS duration,
        service_description AS description,
        service_type,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image AS image,
        created_at,
        updated_at
      FROM dashboard_salon_services
      WHERE ${categoryConditions}
      ORDER BY service_type, service_category, service_name
    `;
    
    // Add % wildcards for ILIKE matching
    const categoryParams = selectedCategories.map(cat => `%${cat}%`);
    
    const result = await query(servicesQuery, categoryParams);
    
    console.log(`Found ${result.rows.length} services matching vendor categories`);
    res.status(200).json({
      services: result.rows,
      selected_categories: selectedCategories,
      total_services: result.rows.length
    });
  } catch (error) {
    console.error(`Error fetching filtered services for salon ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Submit a review for a salon vendor
 * POST /api/salons/:id/reviews
 */
router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, rating, comment } = req.body;
    
    console.log(`Submitting review for salon ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    if (!user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid review data. user_id and rating (1-5) are required' });
    }
    
    // Get current reviews for the vendor
    const vendorQuery = `
      SELECT reviews, vendor_email, business_type
      FROM ready_services_vendors_data
      WHERE vendor_id = $1 AND LOWER(business_type) = 'salon'
    `;
    
    const vendorResult = await query(vendorQuery, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Salon vendor not found',
        message: 'No salon vendor found with the provided ID in ready_services_vendors_data table'
      });
    }
    
    const vendor = vendorResult.rows[0];
    let currentReviews = vendor.reviews || [];
    
    // Create new review object
    const newReview = {
      user_id: user_id,
      rating: parseInt(rating),
      comment: comment || '',
      date: new Date().toISOString(),
      review_id: `review_${Date.now()}_${user_id}`
    };
    
    // Add new review to the array
    currentReviews.push(newReview);
    
    // Update the reviews column
    const updateQuery = `
      UPDATE ready_services_vendors_data
      SET reviews = $1, updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $2 AND LOWER(business_type) = 'salon'
    `;
    
    await query(updateQuery, [JSON.stringify(currentReviews), id]);
    
    console.log(`Review submitted successfully for salon ID ${id}`);
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error(`Error submitting review for salon ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Get reviews for a salon vendor with user details
 * GET /api/salons/:id/reviews
 */
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching reviews for salon ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    // Get reviews from ready_services_vendors_data
    const vendorQuery = `
      SELECT reviews
      FROM ready_services_vendors_data
      WHERE vendor_id = $1 AND LOWER(business_type) = 'salon'
    `;
    
    const vendorResult = await query(vendorQuery, [id]);
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Salon vendor not found',
        message: 'No salon vendor found with the provided ID'
      });
    }
    
    const reviews = vendorResult.rows[0].reviews || [];
    
    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        reviews: [],
        total_reviews: 0,
        average_rating: 0
      });
    }
    
    // Get user details for each review
    const userIds = reviews.map(review => review.user_id).filter(id => id);
    
    let reviewsWithUserData = [];
    
    if (userIds.length > 0) {
      // Create placeholders for the user IDs
      const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
      
      const userQuery = `
        SELECT id, email, custom_user_id, full_name
        FROM customer_table_details
        WHERE id::text = ANY($1) OR email = ANY($1) OR custom_user_id = ANY($1)
      `;
      
      const userResult = await query(userQuery, [userIds]);
      const userMap = {};
      
      // Create a map that can match different user identifiers
      userResult.rows.forEach(user => {
        // Map by all possible identifiers that might be stored in reviews
        userMap[user.id?.toString()] = {
          full_name: user.full_name,
          profile_picture: null // table doesn't have profile_picture column
        };
        if (user.email) {
          userMap[user.email] = {
            full_name: user.full_name,
            profile_picture: null
          };
        }
        if (user.custom_user_id) {
          userMap[user.custom_user_id] = {
            full_name: user.full_name,
            profile_picture: null
          };
        }
      });
      
      // Merge review data with user data
      reviewsWithUserData = reviews.map(review => ({
        ...review,
        user_name: userMap[review.user_id]?.full_name || 'Anonymous User',
        user_avatar: userMap[review.user_id]?.profile_picture || null
      }));
    } else {
      reviewsWithUserData = reviews.map(review => ({
        ...review,
        user_name: 'Anonymous User',
        user_avatar: null
      }));
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
    
    console.log(`Found ${reviews.length} reviews for salon ID ${id}`);
    res.status(200).json({
      success: true,
      reviews: reviewsWithUserData.sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date, newest first
      total_reviews: reviews.length,
      average_rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
    });
  } catch (error) {
    console.error(`Error fetching reviews for salon ID ${req.params.id}:`, error);
    next(error);
  }
});

module.exports = router; 