const express = require('express');
const router = express.Router();
const { pool, query } = require('../db');

// Initialization functions to load data when server starts
async function loadServiceIcons() {
  try {
    console.log('Initializing: Loading all service icons');
    
    const iconsQuery = `
      SELECT *
      FROM our_services_icons
      LIMIT 100
    `;
    
    console.log('Executing query:', iconsQuery);
    const result = await query(iconsQuery);
    
    console.log('Query completed. Result:', JSON.stringify(result).substring(0, 200));
    console.log('Result rows:', result.rows ? result.rows.length : 'undefined');
    
    if (!result.rows || result.rows.length === 0) {
      console.log('No service icons found or empty result');
      return [];
    }
    
    // Debug the first row
    console.log('First row:', JSON.stringify(result.rows[0]).substring(0, 200));
    
    // Log all columns/fields
    const columns = Object.keys(result.rows[0]);
    console.log('our_services_icons columns:', columns);
    console.log(`Found ${result.rows.length} service icons`);
    
    return result.rows;
  } catch (error) {
    console.error('Error loading service icons - FULL ERROR:', error);
    console.error('Error details - message:', error.message);
    console.error('Error details - code:', error.code);
    console.error('Error details - stack:', error.stack);
    if (error.code === '42P01') {
      console.error('Table our_services_icons does not exist in the database');
    }
    return [];
  }
}

async function loadServiceProducts() {
  try {
    console.log('Initializing: Loading all service products');
    
    const productsQuery = `
      SELECT *
      FROM our_services_product
      LIMIT 100
    `;
    
    const result = await query(productsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service products found');
      return [];
    }
    
    // Log all columns/fields
    console.log('our_services_product columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service products`);
    
    return result.rows;
  } catch (error) {
    console.error('Error loading service products:', error.message);
    if (error.code === '42P01') {
      console.error('Table our_services_product does not exist in the database');
    }
    return [];
  }
}

async function loadServiceSections() {
  try {
    console.log('Initializing: Loading all service sections');
    
    const sectionsQuery = `
      SELECT *
      FROM our_services_section
      LIMIT 100
    `;
    
    const result = await query(sectionsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service sections found');
      return [];
    }
    
    // Log all columns/fields
    console.log('our_services_section columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service sections`);
    
    return result.rows;
  } catch (error) {
    console.error('Error loading service sections:', error.message);
    if (error.code === '42P01') {
      console.error('Table our_services_section does not exist in the database');
    }
    return [];
  }
}

// Initialize data when module loads
(async () => {
  console.log('=== Initializing service data ===');
  
  // Explicitly handle each function to ensure all are executed
  try {
    const icons = await loadServiceIcons();
    console.log('Icons data loaded successfully:', icons.length > 0);
  } catch (err) {
    console.error('Failed to load icons:', err.message);
  }
  
  try {
    const products = await loadServiceProducts();
    console.log('Products data loaded successfully:', products.length > 0);
  } catch (err) {
    console.error('Failed to load products:', err.message);
  }
  
  try {
    const sections = await loadServiceSections();
    console.log('Sections data loaded successfully:', sections.length > 0);
  } catch (err) {
    console.error('Failed to load sections:', err.message);
  }
  
  console.log('=== Service data initialization complete ===');
  
  // Run dedicated diagnostic for our_services_icons
  setTimeout(checkServiceIconsTable, 2000);
})();

// Special diagnostic function specifically for our_services_icons
async function checkServiceIconsTable() {
  console.log('=== DIAGNOSTIC: Checking our_services_icons table ===');
  
  // First check if table exists
  try {
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'our_services_icons'
      );
    `;
    
    const tableResult = await query(tableCheckQuery);
    console.log('Table check result:', tableResult.rows[0]);
    
    if (tableResult.rows[0].exists) {
      console.log('Table our_services_icons exists in the database');
      
      // Now get the column names
      const columnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'our_services_icons';
      `;
      
      const columnResult = await query(columnQuery);
      console.log('Column names from schema:', columnResult.rows.map(row => row.column_name));
      
      // Try direct select with limit 1
      try {
        const directQuery = `SELECT * FROM our_services_icons LIMIT 1;`;
        const directResult = await query(directQuery);
        
        if (directResult.rows && directResult.rows.length > 0) {
          console.log('Direct query successful. Found row.');
          console.log('our_services_icons columns (direct):', Object.keys(directResult.rows[0]));
        } else {
          console.log('Table exists but has no data');
        }
      } catch (err) {
        console.error('Error in direct query:', err.message);
      }
    } else {
      console.log('Table our_services_icons does NOT exist');
      
      // Try to find similar tables
      const similarTablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%service%' 
        OR table_name LIKE '%icon%';
      `;
      
      const similarResult = await query(similarTablesQuery);
      console.log('Similar tables found:', similarResult.rows.map(row => row.table_name));
    }
  } catch (err) {
    console.error('Error during table diagnostic:', err.message);
  }
  
  console.log('=== DIAGNOSTIC COMPLETE ===');
}

/**
 * Get all services
 * GET /api/services
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching all services');
    
    const servicesQuery = `
      SELECT 
        s.id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        'Dashboard Service' AS salon_name,
        1 AS salon_id
      FROM dashboard_salon_services s
      ORDER BY s.service_category, s.service_name
      LIMIT 100
    `;
    
    const result = await query(servicesQuery);
    
    if (result.rows.length === 0) {
      console.log('No services found');
      return res.status(200).json([]);
    }
    
    console.log(`Found ${result.rows.length} services`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    next(error);
  }
});

/**
 * Get services by category
 * GET /api/services/category/:category
 */
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    console.log(`Fetching services in category: ${category}`);
    
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }
    
    const servicesQuery = `
      SELECT 
        s.id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        'Dashboard Service' AS salon_name,
        1 AS salon_id
      FROM dashboard_salon_services s
      WHERE s.service_category ILIKE $1
      ORDER BY s.service_name
      LIMIT 50
    `;
    
    // Use ILIKE for case-insensitive matching with % for partial matches
    const result = await query(servicesQuery, [`%${category}%`]);
    
    console.log(`Found ${result.rows.length} services in category: ${category}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching services in category ${req.params.category}:`, error);
    next(error);
  }
});

/**
 * Get service by ID
 * GET /api/services/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching service with ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    
    const serviceQuery = `
      SELECT 
        s.id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        'Dashboard Service' AS salon_name,
        1 AS salon_id,
        'Main Address' AS salon_address,
        'Mumbai' AS salon_city,
        '+91-9999999999' AS salon_phone
      FROM dashboard_salon_services s
      WHERE s.id = $1
    `;
    
    const result = await query(serviceQuery, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Service with ID ${id} not found`);
      return res.status(404).json({ error: 'Service not found' });
    }
    
    console.log(`Successfully fetched service with ID ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching service with ID ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Search services
 * GET /api/services/search/:term
 */
router.get('/search/:term', async (req, res, next) => {
  try {
    const { term } = req.params;
    console.log(`Searching services with term: ${term}`);
    
    if (!term || term.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }
    
    const searchQuery = `
      SELECT 
        s.id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        'Dashboard Service' AS salon_name,
        1 AS salon_id
      FROM dashboard_salon_services s
      WHERE s.service_name ILIKE $1 
         OR s.service_description ILIKE $1
         OR s.service_category ILIKE $1
      ORDER BY 
        CASE WHEN s.service_name ILIKE $2 THEN 0 ELSE 1 END,
        s.service_name
      LIMIT 30
    `;
    
    // Use ILIKE for case-insensitive matching with % for partial matches
    const searchPattern = `%${term}%`;
    const exactPattern = `${term}%`; // Prioritize matches that start with the term
    const result = await query(searchQuery, [searchPattern, exactPattern]);
    
    console.log(`Found ${result.rows.length} services matching: ${term}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error searching services with term ${req.params.term}:`, error);
    next(error);
  }
});

/**
 * Get all service icons
 * GET /api/services/icons
 */
router.get('/icons', async (req, res, next) => {
  try {
    console.log('Fetching all service icons');
    
    const iconsQuery = `
      SELECT *
      FROM our_services_icons
      LIMIT 100
    `;
    
    const result = await query(iconsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service icons found');
      return res.status(200).json([]);
    }
    
    // Log all columns/fields
    console.log('our_services_icons columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service icons`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching service icons:', error);
    if (error.code === '42P01') { // Relation does not exist error code
      console.log('Table does not exist, returning mock data');
      
      // Return mock service icons data
      const mockIcons = [
        {
          id: 1,
          name: 'Haircut',
          icon_name: 'Haircut',
          url: 'http://192.168.0.102:3000/static/images/haircut.jpeg',
          icon_url: 'http://192.168.0.102:3000/static/images/haircut.jpeg',
          category: 'Hair',
          icon_category: 'Hair',
          description: 'Professional haircut services',
          icon_description: 'Professional haircut services',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Hair Coloring',
          icon_name: 'Hair Coloring',
          url: 'http://192.168.0.102:3000/static/images/fullcolor.png',
          icon_url: 'http://192.168.0.102:3000/static/images/fullcolor.png',
          category: 'Hair',
          icon_category: 'Hair',
          description: 'Professional hair coloring services',
          icon_description: 'Professional hair coloring services',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Facial',
          icon_name: 'Facial',
          url: 'http://192.168.0.102:3000/static/images/facial.png',
          icon_url: 'http://192.168.0.102:3000/static/images/facial.png',
          category: 'Skin',
          icon_category: 'Skin',
          description: 'Relaxing facial treatments',
          icon_description: 'Relaxing facial treatments',
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Manicure',
          icon_name: 'Manicure',
          url: 'http://192.168.0.102:3000/static/images/manicure.png',
          icon_url: 'http://192.168.0.102:3000/static/images/manicure.png',
          category: 'Nails',
          icon_category: 'Nails',
          description: 'Professional nail care',
          icon_description: 'Professional nail care',
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Makeup',
          icon_name: 'Makeup',
          url: 'http://192.168.0.102:3000/static/images/bridal1.png',
          icon_url: 'http://192.168.0.102:3000/static/images/bridal1.png',
          category: 'Makeup',
          icon_category: 'Makeup',
          description: 'Professional makeup services',
          icon_description: 'Professional makeup services',
          created_at: new Date().toISOString()
        }
      ];
      
      return res.status(200).json(mockIcons);
    }
    next(error);
  }
});

/**
 * Get all service icons (public, no ID required)
 * GET /api/services/icons/all
 */
router.get('/icons/all', async (req, res, next) => {
  try {
    console.log('Fetching all service icons without ID param');
    
    const iconsQuery = `
      SELECT *
      FROM our_services_icons
      LIMIT 100
    `;
    
    const result = await query(iconsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service icons found');
      return res.status(200).json([]);
    }
    
    // Log all columns/fields
    console.log('our_services_icons columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service icons`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching service icons:', error);
    if (error.code === '42P01') { // Relation does not exist error code
      console.log('Table does not exist, returning mock data');
      
      // Return mock service icons data
      const mockIcons = [
        {
          id: 1,
          name: 'Haircut',
          icon_name: 'Haircut',
          url: 'http://192.168.0.102:3000/static/images/haircut.jpeg',
          icon_url: 'http://192.168.0.102:3000/static/images/haircut.jpeg',
          category: 'Hair',
          icon_category: 'Hair',
          description: 'Professional haircut services',
          icon_description: 'Professional haircut services',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Hair Coloring',
          icon_name: 'Hair Coloring',
          url: 'http://192.168.0.102:3000/static/images/fullcolor.png',
          icon_url: 'http://192.168.0.102:3000/static/images/fullcolor.png',
          category: 'Hair',
          icon_category: 'Hair',
          description: 'Professional hair coloring services',
          icon_description: 'Professional hair coloring services',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Facial',
          icon_name: 'Facial',
          url: 'http://192.168.0.102:3000/static/images/facial.png',
          icon_url: 'http://192.168.0.102:3000/static/images/facial.png',
          category: 'Skin',
          icon_category: 'Skin',
          description: 'Relaxing facial treatments',
          icon_description: 'Relaxing facial treatments',
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Manicure',
          icon_name: 'Manicure',
          url: 'http://192.168.0.102:3000/static/images/manicure.png',
          icon_url: 'http://192.168.0.102:3000/static/images/manicure.png',
          category: 'Nails',
          icon_category: 'Nails',
          description: 'Professional nail care',
          icon_description: 'Professional nail care',
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Makeup',
          icon_name: 'Makeup',
          url: 'http://192.168.0.102:3000/static/images/bridal1.png',
          icon_url: 'http://192.168.0.102:3000/static/images/bridal1.png',
          category: 'Makeup',
          icon_category: 'Makeup',
          description: 'Professional makeup services',
          icon_description: 'Professional makeup services',
          created_at: new Date().toISOString()
        }
      ];
      
      return res.status(200).json(mockIcons);
    }
    next(error);
  }
});

/**
 * Get all service products
 * GET /api/services/products
 */
router.get('/products', async (req, res, next) => {
  try {
    console.log('Fetching all service products');
    
    const productsQuery = `
      SELECT *
      FROM our_services_product
      LIMIT 100
    `;
    
    const result = await query(productsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service products found');
      return res.status(200).json([]);
    }
    
    // Log all columns/fields
    console.log('our_services_product columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service products`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching service products:', error);
    if (error.code === '42P01') { // Relation does not exist error code
      return res.status(404).json({ error: 'The our_services_product table does not exist' });
    }
    next(error);
  }
});

/**
 * Get all service sections
 * GET /api/services/sections
 */
router.get('/sections', async (req, res, next) => {
  try {
    console.log('Fetching all service sections');
    
    const sectionsQuery = `
      SELECT *
      FROM our_services_section
      LIMIT 100
    `;
    
    const result = await query(sectionsQuery);
    
    if (result.rows.length === 0) {
      console.log('No service sections found');
      return res.status(200).json([]);
    }
    
    // Log all columns/fields
    console.log('our_services_section columns:', Object.keys(result.rows[0]));
    console.log(`Found ${result.rows.length} service sections`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching service sections:', error);
    if (error.code === '42P01') { // Relation does not exist error code
      return res.status(404).json({ error: 'The our_services_section table does not exist' });
    }
    next(error);
  }
});

module.exports = router; 