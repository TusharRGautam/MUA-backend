/**
 * Dashboard Service Routes
 * Handles CRUD operations for dashboard service tables
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Salon Services Routes

// Create salon service
router.post('/salon-services', async (req, res) => {
  try {
    const {
      service_name,
      service_category,
      service_price,
      service_duration,
      service_description,
      vendor_id,
      package_name,
      service_image,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      service_type,
      selected_services,
      service_images
    } = req.body;

    // Validate required fields
    if (!service_name || !service_category || !service_price || !service_duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_category, service_price, service_duration'
      });
    }

    const result = await query(
      `INSERT INTO dashboard_salon_services 
       (service_name, service_category, service_price, service_duration, service_description, vendor_id, 
        package_name, service_image, things_to_know, what_packages_include, precautions, products_used, service_type, selected_services, service_images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [service_name, service_category, parseFloat(service_price), parseInt(service_duration), service_description, vendor_id,
       package_name, service_image, things_to_know, what_packages_include, precautions, products_used, service_type || 'Single', selected_services || '', service_images || '{}']
    );

    res.status(201).json({
      success: true,
      message: 'Salon service created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating salon service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create salon service',
      error: error.message
    });
  }
});

// Get all salon services
router.get('/salon-services', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboard_salon_services ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching salon services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon services',
      error: error.message
    });
  }
});

// Update salon service
router.put('/salon-services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_name,
      service_category,
      service_price,
      service_duration,
      service_description,
      vendor_id,
      package_name,
      service_image,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      service_type,
      selected_services,
      service_images
    } = req.body;

    // Validate required fields
    if (!service_name || !service_category || !service_price || !service_duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_category, service_price, service_duration'
      });
    }

    const result = await query(
      `UPDATE dashboard_salon_services 
       SET service_name = $1, service_category = $2, service_price = $3, service_duration = $4, 
           service_description = $5, vendor_id = $6, package_name = $7, service_image = $8, 
           things_to_know = $9, what_packages_include = $10, precautions = $11, products_used = $12,
           service_type = $13, selected_services = $14, service_images = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [service_name, service_category, parseFloat(service_price), parseInt(service_duration), service_description, vendor_id,
       package_name, service_image, things_to_know, what_packages_include, precautions, products_used, service_type || 'Single', selected_services || '', service_images || '{}', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salon service not found'
      });
    }

    res.json({
      success: true,
      message: 'Salon service updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating salon service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salon service',
      error: error.message
    });
  }
});

// Delete salon service
router.delete('/salon-services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM dashboard_salon_services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salon service not found'
      });
    }

    res.json({
      success: true,
      message: 'Salon service deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting salon service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salon service',
      error: error.message
    });
  }
});

// PRP Services Routes

// Create PRP service
router.post('/prp-services', async (req, res) => {
  try {
    const {
      service_name,
      service_category,
      service_price,
      service_duration,
      service_sessions,
      service_description,
      included_services,
      vendor_id,
      icon_image,
      package_name
    } = req.body;

    // Validate required fields
    if (!service_name || !service_category || !service_price || !service_duration || !service_sessions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_category, service_price, service_duration, service_sessions'
      });
    }

    // Convert included_services to JSONB format if it's a string
    let processedIncludedServices = included_services;
    if (typeof included_services === 'string') {
      // Split comma-separated string into array
      processedIncludedServices = included_services.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    const result = await query(
      `INSERT INTO dashboard_prp_services 
       (service_name, service_category, service_price, service_duration, service_sessions, service_description, included_services, vendor_id, icon_image, package_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [service_name, service_category, parseFloat(service_price), parseInt(service_duration), parseInt(service_sessions), service_description, JSON.stringify(processedIncludedServices), vendor_id, icon_image, package_name]
    );

    res.status(201).json({
      success: true,
      message: 'PRP service created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating PRP service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PRP service',
      error: error.message
    });
  }
});

// Get all PRP services
router.get('/prp-services', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboard_prp_services ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching PRP services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PRP services',
      error: error.message
    });
  }
});

// Update PRP service
router.put('/prp-services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_name,
      service_category,
      service_price,
      service_duration,
      service_sessions,
      service_description,
      included_services,
      vendor_id,
      icon_image,
      package_name
    } = req.body;

    // Validate required fields
    if (!service_name || !service_category || !service_price || !service_duration || !service_sessions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_category, service_price, service_duration, service_sessions'
      });
    }

    // Convert included_services to JSONB format if it's a string
    let processedIncludedServices = included_services;
    if (typeof included_services === 'string') {
      // Split comma-separated string into array
      processedIncludedServices = included_services.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    const result = await query(
      `UPDATE dashboard_prp_services 
       SET service_name = $1, service_category = $2, service_price = $3, service_duration = $4, 
           service_sessions = $5, service_description = $6, included_services = $7, 
           vendor_id = $8, icon_image = $9, package_name = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [service_name, service_category, parseFloat(service_price), parseInt(service_duration), parseInt(service_sessions), service_description, JSON.stringify(processedIncludedServices), vendor_id, icon_image, package_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PRP service not found'
      });
    }

    res.json({
      success: true,
      message: 'PRP service updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating PRP service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update PRP service',
      error: error.message
    });
  }
});

// Delete PRP service
router.delete('/prp-services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM dashboard_prp_services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PRP service not found'
      });
    }

    res.json({
      success: true,
      message: 'PRP service deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting PRP service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PRP service',
      error: error.message
    });
  }
});

// Diagnostics Services Routes

// Create diagnostics service
router.post('/diagnostics-services', async (req, res) => {
  try {
    const {
      service_name,
      service_category,
      service_price,
      service_duration,
      service_description,
      preparation_requirements,
      home_collection,
      report_delivery_time,
      included_services,
      vendor_id
    } = req.body;

    // Validate required fields
    if (!service_name || !service_category || !service_price || !service_duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: service_name, service_category, service_price, service_duration'
      });
    }

    // Convert included_services to JSONB format if it's a string
    let processedIncludedServices = included_services;
    if (typeof included_services === 'string') {
      // Split comma-separated string into array
      processedIncludedServices = included_services.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    const result = await query(
      `INSERT INTO dashboard_diagnostics_services 
       (service_name, service_category, service_price, service_duration, service_description, 
        preparation_requirements, home_collection, report_delivery_time, included_services, vendor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [service_name, service_category, parseFloat(service_price), parseInt(service_duration), 
       service_description, preparation_requirements, home_collection || 'no', 
       report_delivery_time, JSON.stringify(processedIncludedServices), vendor_id]
    );

    res.status(201).json({
      success: true,
      message: 'Diagnostics service created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating diagnostics service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create diagnostics service',
      error: error.message
    });
  }
});

// Get all diagnostics services
router.get('/diagnostics-services', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboard_diagnostics_services ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching diagnostics services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diagnostics services',
      error: error.message
    });
  }
});

// Generic routes for getting service by ID and updating/deleting

// Get service by ID (works for all service types)
router.get('/:serviceType/:id', async (req, res) => {
  try {
    const { serviceType, id } = req.params;
    
    // Map service types to table names
    const tableMap = {
      'salon': 'dashboard_salon_services',
      'prp': 'dashboard_prp_services',
      'diagnostics': 'dashboard_diagnostics_services'
    };
    
    const tableName = tableMap[serviceType];
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type. Must be salon, prp, or diagnostics'
      });
    }

    const result = await query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

module.exports = router;