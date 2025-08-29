/**
 * Transformation Service
 * 
 * Provides functions for managing transformation images in the database
 */

const { query } = require('../db'); // PostgreSQL database connection

/**
 * Save transformation image details to the database
 * 
 * @param {Object} transformationData - Transformation data
 * @param {string} transformationData.id - Transformation ID (for updates)
 * @param {string} transformationData.title - Title of the transformation
 * @param {string} transformationData.description - Description of the transformation (optional)
 * @param {string} transformationData.beforeUrl - URL of the before image (Google Drive public URL)
 * @param {string} transformationData.afterUrl - URL of the after image (Google Drive public URL)
 * @param {string} vendorEmail - Email of the vendor
 * @returns {Promise<Object>} - Saved transformation record
 */
const saveTransformation = async (transformationData, vendorEmail) => {
  try {
    console.log(`[transformationService] Saving transformation for vendor: ${vendorEmail}`);
    
    if (!transformationData || !vendorEmail) {
      throw new Error('Transformation data and vendor email are required');
    }
    
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error(`Vendor not found for email: ${vendorEmail}`);
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Log transformation data for debugging
    console.log(`[transformationService] Title: "${transformationData.title}"`);
    console.log(`[transformationService] Before image type: ${transformationData.beforeUrl ? 'url' : 'missing'}`);
    console.log(`[transformationService] After image type: ${transformationData.afterUrl ? 'url' : 'missing'}`);
    
    // If we have an existing ID, update the record
    if (transformationData.id) {
      console.log(`[transformationService] Updating existing transformation: ${transformationData.id}`);
      
      // Update with the new data
      const updateResult = await query(
        `UPDATE vendor_transformations 
         SET title = $1, description = $2, before_image = $3, after_image = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 AND vendor_id = $6 
         RETURNING id, title, description, before_image, after_image, created_at, updated_at`,
        [
          transformationData.title,
          transformationData.description || '',
          transformationData.beforeUrl,
          transformationData.afterUrl,
          transformationData.id,
          vendorId
        ]
      );
      
      if (updateResult.rows.length === 0) {
        throw new Error(`Failed to update transformation with ID: ${transformationData.id}`);
      }
      
      return {
        id: updateResult.rows[0].id,
        title: updateResult.rows[0].title,
        description: updateResult.rows[0].description,
        beforeImage: updateResult.rows[0].before_image,
        afterImage: updateResult.rows[0].after_image,
        createdAt: updateResult.rows[0].created_at,
        updatedAt: updateResult.rows[0].updated_at
      };
    } else {
      // Create a new record
      console.log(`[transformationService] Creating new transformation`);
      
      const insertResult = await query(
        `INSERT INTO vendor_transformations 
         (vendor_id, title, description, before_image, after_image, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, title, description, before_image, after_image, created_at, updated_at`,
        [
          vendorId,
          transformationData.title,
          transformationData.description || '',
          transformationData.beforeUrl,
          transformationData.afterUrl
        ]
      );
      
      return {
        id: insertResult.rows[0].id,
        title: insertResult.rows[0].title,
        description: insertResult.rows[0].description,
        beforeImage: insertResult.rows[0].before_image,
        afterImage: insertResult.rows[0].after_image,
        createdAt: insertResult.rows[0].created_at,
        updatedAt: insertResult.rows[0].updated_at
      };
    }
  } catch (error) {
    console.error('[transformationService] Error saving/updating transformation:', error);
    throw error;
  }
};

/**
 * Get all transformations for a vendor
 * 
 * @param {string} vendorEmail - Email of the vendor
 * @returns {Promise<Array>} - Array of transformations
 */
const getTransformations = async (vendorEmail) => {
  try {
    if (!vendorEmail) {
      throw new Error('Vendor email is required');
    }
    
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error(`Vendor not found for email: ${vendorEmail}`);
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Get all transformations for the vendor
    const transformationsResult = await query(
      `SELECT id, title, description, before_image, after_image, created_at, updated_at 
       FROM vendor_transformations 
       WHERE vendor_id = $1 
       ORDER BY created_at DESC`,
      [vendorId]
    );
    
    // Map the results to a consistent format
    return transformationsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      beforeImage: row.before_image,
      afterImage: row.after_image,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error(`[transformationService] Error getting transformations for vendor ${vendorEmail}:`, error);
    throw error;
  }
};

/**
 * Get a transformation by ID
 * 
 * @param {string} id - ID of the transformation to retrieve
 * @returns {Promise<Object|null>} - Transformation or null if not found
 */
const getTransformationById = async (id) => {
  try {
    if (!id) {
      throw new Error('Transformation ID is required');
    }
    
    // Get the transformation by ID
    const transformationResult = await query(
      `SELECT id, title, description, before_image, after_image, vendor_id, created_at, updated_at 
       FROM vendor_transformations 
       WHERE id = $1`,
      [id]
    );
    
    if (transformationResult.rows.length === 0) {
      return null;
    }
    
    return {
      id: transformationResult.rows[0].id,
      title: transformationResult.rows[0].title,
      description: transformationResult.rows[0].description,
      beforeImage: transformationResult.rows[0].before_image,
      afterImage: transformationResult.rows[0].after_image,
      vendorId: transformationResult.rows[0].vendor_id,
      createdAt: transformationResult.rows[0].created_at,
      updatedAt: transformationResult.rows[0].updated_at
    };
  } catch (error) {
    console.error(`[transformationService] Error getting transformation with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a transformation
 * 
 * @param {string} id - ID of the transformation to delete
 * @param {string} vendorEmail - Email of the vendor (for security verification)
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteTransformation = async (id, vendorEmail) => {
  try {
    if (!id) {
      throw new Error('Transformation ID is required for deletion');
    }
    
    if (!vendorEmail) {
      throw new Error('Vendor email is required for security verification');
    }
    
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error(`Vendor not found for email: ${vendorEmail}`);
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    
    // Delete the transformation (ensuring it belongs to this vendor)
    const deleteResult = await query(
      'DELETE FROM vendor_transformations WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendorId]
    );
    
    // Return true if a row was deleted, false otherwise
    return deleteResult.rows.length > 0;
  } catch (error) {
    console.error(`[transformationService] Error deleting transformation with ID ${id}:`, error);
    throw error;
  }
};

module.exports = {
  saveTransformation,
  getTransformations,
  getTransformationById,
  deleteTransformation
}; 