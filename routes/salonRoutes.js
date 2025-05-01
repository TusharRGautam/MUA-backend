const express = require('express');
const router = express.Router();
const { pool, query } = require('../db');
const authMiddleware = require('../middleware/auth');

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

module.exports = router; 