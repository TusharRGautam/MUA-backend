const express = require('express');
const router = express.Router();
const { pool, query } = require('../db');

/**
 * Get all services
 * GET /api/services
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching all services');
    
    const servicesQuery = `
      SELECT 
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        b.business_name AS salon_name,
        b.sr_no AS salon_id
      FROM services s
      JOIN business_details b ON s.business_id = b.sr_no
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
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        b.business_name AS salon_name,
        b.sr_no AS salon_id
      FROM services s
      JOIN business_details b ON s.business_id = b.sr_no
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
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        b.business_name AS salon_name,
        b.sr_no AS salon_id,
        b.business_address AS salon_address,
        b.business_city AS salon_city,
        b.business_phone AS salon_phone
      FROM services s
      JOIN business_details b ON s.business_id = b.sr_no
      WHERE s.service_id = $1
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
        s.service_id AS id,
        s.service_name AS name,
        s.service_price AS price,
        s.service_description AS description,
        s.service_category AS category,
        s.service_image AS image,
        s.service_duration AS duration,
        b.business_name AS salon_name,
        b.sr_no AS salon_id
      FROM services s
      JOIN business_details b ON s.business_id = b.sr_no
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

module.exports = router; 