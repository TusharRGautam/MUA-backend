const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route GET /api/packages/services
 * @desc Get all package services with optional gender filter
 * @access Public
 */
router.get('/services', async (req, res) => {
  try {
    const { gender } = req.query;
    
    let query = `
      SELECT 
        id,
        icon_image,
        package_name,
        gender,
        service_names,
        category,
        price,
        duration,
        description,
        product_names,
        things_to_know,
        reason,
        specific_todo,
        vendor_id,
        created_at,
        updated_at,
        additional_images,
        contact_name,
        is_featured,
        booking_requirements
      FROM package_services_from_dashboard
    `;
    
    let params = [];
    
    if (gender && gender !== 'all') {
      query += ` WHERE gender = $1 OR gender = 'both'`;
      params.push(gender);
    }
    
    query += ` ORDER BY is_featured DESC, created_at DESC`;
    
    const result = await db.query(query, params);
    
    // Transform the data to match frontend expectations
    const packages = result.rows.map(row => ({
      id: row.id,
      name: row.package_name,
      gender: row.gender,
      services: Array.isArray(row.service_names) ? row.service_names : [],
      category: row.category,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      duration: row.duration,
      description: row.description,
      products: Array.isArray(row.product_names) ? row.product_names : [],
      thingsToKnow: row.things_to_know,
      reason: row.reason,
      specificTodo: row.specific_todo,
      vendorId: row.vendor_id,
      image: row.icon_image,
      additionalImages: Array.isArray(row.additional_images) ? row.additional_images : [],
      contactName: row.contact_name,
      isPopular: row.is_featured || false,
      isFeatured: row.is_featured || false,
      bookingRequirements: row.booking_requirements,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching package services:', error);
    
    // Get gender filter from request query again since it's in catch block
    const { gender: genderFilter } = req.query;
    
    // Fallback to mock data if database query fails
    const mockPackages = [
      {
        id: 1,
        name: 'Premium Bridal Package',
        gender: 'female',
        services: [
          { id: 'service-1', name: 'HD Bridal Makeup', price: 15000, category: 'Bridal' },
          { id: 'service-2', name: 'Hair Styling', price: 8000, category: 'Bridal' }
        ],
        category: 'Bridal',
        price: 23000,
        duration: 300,
        description: 'Complete bridal transformation package',
        image: 'http://192.168.0.101:3000/static/images/bridal-makeup.webp',
        isPopular: true,
        isFeatured: true
      },
      {
        id: 2,
        name: 'Premium Groom Package',
        gender: 'male',
        services: [
          { id: 'service-10', name: 'HD Makeup for Groom', price: 8000, category: 'Wedding' },
          { id: 'service-11', name: 'Hair Styling', price: 4000, category: 'Wedding' }
        ],
        category: 'Wedding',
        price: 12000,
        duration: 180,
        description: 'Complete groom transformation package',
        image: 'http://192.168.0.101:3000/static/images/grooming-and-hygiene-icon.webp',
        isPopular: true,
        isFeatured: true
      }
    ];
    
    const filteredMockPackages = genderFilter && genderFilter !== 'all' 
      ? mockPackages.filter(pkg => pkg.gender === genderFilter || pkg.gender === 'both')
      : mockPackages;
    
    res.json(filteredMockPackages);
  }
});

/**
 * @route GET /api/packages/services/:id
 * @desc Get a specific package service by ID
 * @access Public
 */
router.get('/services/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    
    const query = `
      SELECT 
        id,
        icon_image,
        package_name,
        gender,
        service_names,
        category,
        price,
        duration,
        description,
        product_names,
        things_to_know,
        reason,
        specific_todo,
        vendor_id,
        created_at,
        updated_at,
        additional_images,
        contact_name,
        is_featured,
        booking_requirements
      FROM package_services_from_dashboard
      WHERE id = $1
    `;
    
    const result = await db.query(query, [packageId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package service not found' });
    }
    
    const row = result.rows[0];
    const packageData = {
      id: row.id,
      name: row.package_name,
      gender: row.gender,
      services: Array.isArray(row.service_names) ? row.service_names : [],
      category: row.category,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      duration: row.duration,
      description: row.description,
      products: Array.isArray(row.product_names) ? row.product_names : [],
      thingsToKnow: row.things_to_know,
      reason: row.reason,
      specificTodo: row.specific_todo,
      vendorId: row.vendor_id,
      image: row.icon_image,
      additionalImages: Array.isArray(row.additional_images) ? row.additional_images : [],
      contactName: row.contact_name,
      isPopular: row.is_featured || false,
      isFeatured: row.is_featured || false,
      bookingRequirements: row.booking_requirements,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(packageData);
  } catch (error) {
    console.error('Error fetching package service:', error);
    res.status(500).json({ error: 'Server error fetching package service' });
  }
});

module.exports = router; 