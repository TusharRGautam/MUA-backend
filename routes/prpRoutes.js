const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route GET /api/prp/packages
 * @desc Get all PRP packages/services
 * @access Public
 */
router.get('/packages', async (req, res) => {
  try {
    // Query to fetch PRP services from the database
    // Note: Since the exact table name wasn't found, I'll use a generic query
    // that can be adjusted based on the actual table structure
    const query = `
      SELECT 
        id,
        package_name as name,
        package_description as description,
        package_price as price,
        package_duration as duration,
        number_of_sessions as sessionCount,
        package_includes as features,
        icon_image as image,
        is_featured as isPopular,
        created_at,
        updated_at
      FROM prp_services_from_dashboard_and_app
      ORDER BY is_featured DESC, created_at DESC
    `;
    
    const result = await db.query(query);
    
    // Transform the data to match the expected frontend format
    const packages = result.rows.map(row => {
      let features = [];
      
      // Handle package_includes - it can be a JSON string or plain text
      if (row.features) {
        try {
          // Try to parse as JSON first
          features = JSON.parse(row.features);
        } catch (e) {
          // If not JSON, split by comma or newline
          features = row.features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
        }
      }
      
      return {
        id: row.id,
        name: row.name || 'PRP Package',
        description: row.description || 'Professional PRP treatment package',
        price: typeof row.price === 'string' ? parseFloat(row.price.replace('₹', '').replace(',', '')) : (row.price || 0),
        duration: row.duration || '60 min',
        sessionCount: row.sessioncount || 1,
        features: features,
        image: row.image || 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: row.ispopular || false
      };
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching PRP packages:', error);
    
    // Fallback to mock data if database query fails
    const mockPackages = [
      {
        id: 1,
        name: 'Single PRP Session',
        description: 'One comprehensive PRP treatment session, ideal for first-time patients or those looking to try the treatment.',
        price: 4999,
        duration: '60 min',
        features: [
          'High-quality PRP extraction',
          'Scalp preparation and numbing',
          'Expert application',
          'Post-treatment care',
          'Before & after photos'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 1
      },
      {
        id: 2,
        name: 'Standard PRP Package',
        description: 'Our most popular package includes three PRP sessions spread over 6 months for optimal results.',
        price: 12999,
        duration: '60 min per session',
        features: [
          '3 PRP treatment sessions',
          'Sessions spaced 6-8 weeks apart',
          'High-quality PRP extraction',
          'Customized treatment plan',
          'Scalp preparation and numbing',
          'Expert application',
          'Post-treatment care kit',
          'Progress tracking'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: true,
        sessionCount: 3
      },
      {
        id: 3,
        name: 'Premium PRP Package',
        description: 'Comprehensive 6-session package for maximum results, ideal for those with significant hair loss or thinning.',
        price: 23999,
        duration: '60 min per session',
        features: [
          '6 PRP treatment sessions',
          'Sessions spaced 4-6 weeks apart',
          'Premium PRP extraction',
          'Detailed scalp analysis',
          'Customized treatment protocol',
          'Enhanced platelet concentration',
          'Premium post-treatment care kit',
          'Monthly progress tracking',
          'Dedicated specialist'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 6
      },
      {
        id: 4,
        name: 'PRP + Hair Growth Serum',
        description: 'Combines PRP therapy with our exclusive growth serum for enhanced results.',
        price: 15999,
        duration: '75 min per session',
        features: [
          '3 PRP treatment sessions',
          'Sessions spaced 6-8 weeks apart',
          'Proprietary growth serum application',
          'High-quality PRP extraction',
          'Customized treatment plan',
          'Take-home serum for daily application',
          'Progress tracking',
          'Extended post-treatment care'
        ],
        image: 'http://192.168.0.102:3000/static/images/hair prp.jpg',
        isPopular: false,
        sessionCount: 3
      }
    ];
    
    res.json(mockPackages);
  }
});

/**
 * @route GET /api/prp/packages/:id
 * @desc Get a specific PRP package by ID
 * @access Public
 */
router.get('/packages/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    
    const query = `
      SELECT 
        id,
        package_name as name,
        package_description as description,
        package_price as price,
        package_duration as duration,
        number_of_sessions as sessionCount,
        package_includes as features,
        icon_image as image,
        is_featured as isPopular,
        created_at,
        updated_at
      FROM prp_services_from_dashboard_and_app
      WHERE id = $1
    `;
    
    const result = await db.query(query, [packageId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PRP package not found' });
    }
    
    const row = result.rows[0];
    
    let features = [];
    // Handle package_includes - it can be a JSON string or plain text
    if (row.features) {
      try {
        // Try to parse as JSON first
        features = JSON.parse(row.features);
      } catch (e) {
        // If not JSON, split by comma or newline
        features = row.features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
      }
    }
    
    const packageData = {
      id: row.id,
      name: row.name || 'PRP Package',
      description: row.description || 'Professional PRP treatment package',
      price: typeof row.price === 'string' ? parseFloat(row.price.replace('₹', '').replace(',', '')) : (row.price || 0),
      duration: row.duration || '60 min',
      sessionCount: row.sessioncount || 1,
      features: features,
      image: row.image || 'http://192.168.0.102:3000/static/images/hair prp.jpg',
      isPopular: row.ispopular || false
    };
    
    res.json(packageData);
  } catch (error) {
    console.error('Error fetching PRP package:', error);
    res.status(500).json({ error: 'Server error fetching PRP package' });
  }
});

module.exports = router; 