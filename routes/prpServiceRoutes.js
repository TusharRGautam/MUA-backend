/**
 * PRP Services Routes
 * 
 * API endpoints for PRP services management
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateRequest } = require('../middleware/validationMiddleware');

/**
 * @route GET /api/prp-services
 * @desc Get all PRP services
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    console.log('[prpServiceRoutes] Fetching all PRP services');
    
    const result = await query(`
      SELECT * FROM dashboard_prp_services
      ORDER BY created_at DESC
    `);
    
    console.log(`[prpServiceRoutes] Found ${result.rows.length} PRP services`);
    
    res.status(200).json({
      success: true,
      services: result.rows
    });
  } catch (error) {
    console.error('[prpServiceRoutes] Error fetching PRP services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PRP services',
      error: error.message
    });
  }
});

/**
 * @route GET /api/prp-services/:id
 * @desc Get a specific PRP service by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[prpServiceRoutes] Fetching PRP service with ID ${id}`);
    
    const result = await query(`
      SELECT * FROM dashboard_prp_services
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `PRP service with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      service: result.rows[0]
    });
  } catch (error) {
    console.error(`[prpServiceRoutes] Error fetching PRP service with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PRP service',
      error: error.message
    });
  }
});

/**
 * @route POST /api/prp-services
 * @desc Create a new PRP service
 * @access Public (for now, can add auth later)
 */
router.post('/', validateRequest({
  package_name: 'required|string',
  package_duration: 'required|string',
  number_of_sessions: 'required|integer',
  package_description: 'required|string',
  package_includes: 'required|string',
  package_price: 'required|numeric'
}), async (req, res) => {
  try {
    const {
      icon_image,
      package_name,
      package_duration,
      number_of_sessions,
      package_description,
      package_includes,
      selected_days,
      package_price,
      icon_drive_file_id
    } = req.body;
    
    console.log('[prpServiceRoutes] Creating new PRP service:', package_name);
    
    // Insert the new service into the database
    const result = await query(`
      INSERT INTO dashboard_prp_services (
        icon_image,
        package_name,
        package_duration,
        number_of_sessions,
        package_description,
        package_includes,
        selected_days,
        package_price,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `, [
      icon_image,
      package_name,
      package_duration,
      number_of_sessions,
      package_description,
      package_includes,
      selected_days ? JSON.stringify(selected_days) : null,
      package_price
    ]);
    
    console.log(`[prpServiceRoutes] PRP service created with ID ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'PRP service created successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('[prpServiceRoutes] Error creating PRP service:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PRP service',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/prp-services/:id
 * @desc Update an existing PRP service
 * @access Public (for now, can add auth later)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      icon_image,
      package_name,
      package_duration,
      number_of_sessions,
      package_description,
      package_includes,
      selected_days,
      package_price,
      icon_drive_file_id
    } = req.body;
    
    console.log(`[prpServiceRoutes] Updating PRP service with ID ${id}`);
    
    // Check if the service exists
    const checkResult = await query(`
      SELECT * FROM dashboard_prp_services
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `PRP service with ID ${id} not found`
      });
    }
    
    // Update the service
    const result = await query(`
      UPDATE dashboard_prp_services
      SET
        icon_image = COALESCE($1, icon_image),
        package_name = COALESCE($2, package_name),
        package_duration = COALESCE($3, package_duration),
        number_of_sessions = COALESCE($4, number_of_sessions),
        package_description = COALESCE($5, package_description),
        package_includes = COALESCE($6, package_includes),
        selected_days = COALESCE($7, selected_days),
        package_price = COALESCE($8, package_price),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      icon_image,
      package_name,
      package_duration,
      number_of_sessions,
      package_description,
      package_includes,
      selected_days ? JSON.stringify(selected_days) : null,
      package_price,
      id
    ]);
    
    console.log(`[prpServiceRoutes] PRP service with ID ${id} updated successfully`);
    
    res.status(200).json({
      success: true,
      message: 'PRP service updated successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error(`[prpServiceRoutes] Error updating PRP service with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating PRP service',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/prp-services/:id
 * @desc Delete a PRP service
 * @access Public (for now, can add auth later)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[prpServiceRoutes] Deleting PRP service with ID ${id}`);
    
    // Check if the service exists
    const checkResult = await query(`
      SELECT * FROM dashboard_prp_services
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `PRP service with ID ${id} not found`
      });
    }
    
    // Delete the service
    await query(`
      DELETE FROM dashboard_prp_services
      WHERE id = $1
    `, [id]);
    
    console.log(`[prpServiceRoutes] PRP service with ID ${id} deleted successfully`);
    
    res.status(200).json({
      success: true,
      message: 'PRP service deleted successfully'
    });
  } catch (error) {
    console.error(`[prpServiceRoutes] Error deleting PRP service with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting PRP service',
      error: error.message
    });
  }
});

module.exports = router;