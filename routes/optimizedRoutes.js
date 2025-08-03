/**
 * Optimized Routes with Caching and Performance Improvements
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const NodeCache = require('node-cache');

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Optimized vendors endpoint with caching and parallel queries
 * GET /api/optimized/vendors
 */
router.get('/vendors', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const cacheKey = `vendors_${status || 'all'}_${search || 'none'}_${page}_${limit}`;
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Use the optimized stored function
    const result = await query(
      'SELECT * FROM get_vendors_paginated($1, $2, $3, $4)',
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit), status || null, search || null]
    );

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    
    const response = {
      success: true,
      data: result.rows.map(row => ({
        sr_no: row.sr_no,
        business_name: row.business_name,
        person_name: row.person_name,
        business_email: row.business_email,
        verification_status: row.verification_status,
        created_at: row.created_at,
        total_services: row.total_services,
        total_gallery_images: row.total_gallery_images,
        total_transformations: row.total_transformations
      })),
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    // Cache the result
    cache.set(cacheKey, response, 300); // Cache for 5 minutes
    
    res.json(response);
  } catch (error) {
    console.error('Error in optimized vendors endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Optimized combined data endpoint with parallel fetching
 * GET /api/optimized/dashboard-data
 */
router.get('/dashboard-data', async (req, res) => {
  try {
    const cacheKey = 'dashboard_combined_data';
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Parallel data fetching
    const [vendorsResult, customersResult, statsResult] = await Promise.all([
      // Get vendor summary
      query(`
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_vendors,
          COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_vendors
        FROM registration_and_other_details
      `),
      
      // Get customer summary
      query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN user_status = 'active' THEN 1 END) as active_customers
        FROM customer_table_details
      `),
      
      // Get service statistics
      query(`
        SELECT 
          COUNT(*) as total_services,
          COUNT(DISTINCT vendor_id) as vendors_with_services
        FROM vendor_single_services
      `)
    ]);

    const response = {
      success: true,
      data: {
        vendors: {
          total: parseInt(vendorsResult.rows[0].total_vendors),
          approved: parseInt(vendorsResult.rows[0].approved_vendors),
          pending: parseInt(vendorsResult.rows[0].pending_vendors)
        },
        customers: {
          total: parseInt(customersResult.rows[0].total_customers),
          active: parseInt(customersResult.rows[0].active_customers)
        },
        services: {
          total: parseInt(statsResult.rows[0].total_services),
          vendors_with_services: parseInt(statsResult.rows[0].vendors_with_services)
        }
      },
      generated_at: new Date().toISOString()
    };

    // Cache for 2 minutes
    cache.set(cacheKey, response, 120);
    
    res.json(response);
  } catch (error) {
    console.error('Error in dashboard data endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Cache management endpoints
 */
router.delete('/cache/:key?', (req, res) => {
  try {
    if (req.params.key) {
      cache.del(req.params.key);
      res.json({ success: true, message: `Cache key '${req.params.key}' cleared` });
    } else {
      cache.flushAll();
      res.json({ success: true, message: 'All cache cleared' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cache/stats', (req, res) => {
  try {
    const stats = cache.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 