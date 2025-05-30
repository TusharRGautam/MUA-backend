/**
 * Gallery Service
 * 
 * Provides functions for managing gallery images in the database
 */

const { query } = require('../db'); // PostgreSQL database connection

/**
 * Save gallery image details to the database
 * 
 * @param {Object} imageData - Image data
 * @param {string} imageData.id - Image ID (for updates)
 * @param {string} imageData.url - URL of the image (Google Drive public URL)
 * @param {string} imageData.caption - Caption for the image
 * @param {boolean} imageData.featured - Whether the image is featured
 * @param {string} imageData.driveFileId - Google Drive file ID
 * @param {string} vendorEmail - Email of the vendor
 * @returns {Promise<Object>} - Saved image record
 */
const saveGalleryImage = async (imageData, vendorEmail) => {
  try {
    console.log(`[galleryService] Saving gallery image for vendor: ${vendorEmail}`);
    
    if (!imageData || !vendorEmail) {
      throw new Error('Image data and vendor email are required');
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
    
    // Log image data for debugging
    console.log(`[galleryService] Image data type: ${imageData.url ? 'url' : 'base64'}, length: ${imageData.url ? imageData.url.length : 0}`);
    console.log(`[galleryService] Caption: "${imageData.caption}"`);
    
    // If we have an existing ID, update the record
    if (imageData.id) {
      console.log(`[galleryService] Updating existing gallery image: ${imageData.id}`);
      
      // Update with the new data
      const updateResult = await query(
        `UPDATE vendor_gallery_images 
         SET url = $1, caption = $2, featured = $3, drive_file_id = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 AND vendor_id = $6 
         RETURNING id, url, caption, featured, drive_file_id, created_at, updated_at`,
        [
          imageData.url,
          imageData.caption || '',
          imageData.featured || false,
          imageData.driveFileId || null,
          imageData.id,
          vendorId
        ]
      );
      
      if (updateResult.rows.length === 0) {
        throw new Error(`Failed to update gallery image with ID: ${imageData.id}`);
      }
      
      return {
        id: updateResult.rows[0].id,
        url: updateResult.rows[0].url,
        caption: updateResult.rows[0].caption,
        featured: updateResult.rows[0].featured,
        driveFileId: updateResult.rows[0].drive_file_id,
        createdAt: updateResult.rows[0].created_at,
        updatedAt: updateResult.rows[0].updated_at
      };
    } else {
      // Create a new record
      console.log(`[galleryService] Creating new gallery image`);
      
      const insertResult = await query(
        `INSERT INTO vendor_gallery_images (vendor_id, url, caption, featured, drive_file_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, url, caption, featured, drive_file_id, created_at, updated_at`,
        [
          vendorId,
          imageData.url,
          imageData.caption || '',
          imageData.featured || false,
          imageData.driveFileId || null
        ]
      );
      
      return {
        id: insertResult.rows[0].id,
        url: insertResult.rows[0].url,
        caption: insertResult.rows[0].caption,
        featured: insertResult.rows[0].featured,
        driveFileId: insertResult.rows[0].drive_file_id,
        createdAt: insertResult.rows[0].created_at,
        updatedAt: insertResult.rows[0].updated_at
      };
    }
  } catch (error) {
    console.error('[galleryService] Error saving/updating gallery image:', error);
    throw error;
  }
};

/**
 * Update gallery image details in the database
 * 
 * @param {string} id - ID of the image to update
 * @param {Object} imageData - Updated image data
 * @param {string} imageData.url - URL of the image (optional)
 * @param {string} imageData.caption - Caption for the image (optional)
 * @param {boolean} imageData.featured - Whether the image is featured (optional)
 * @param {string} imageData.driveFileId - Google Drive file ID (optional)
 * @returns {Promise<Object>} - Updated image record
 */
const updateGalleryImage = async (id, imageData) => {
  try {
    if (!id) {
      throw new Error('Image ID is required for update');
    }
    
    console.log(`[galleryService] Updating gallery image: ${id}`);
    
    // Build the SET clause based on provided fields
    const updates = [];
    const values = [id]; // First parameter is the ID
    let paramIndex = 2;
    
    if (imageData.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(imageData.url);
    }
    
    if (imageData.caption !== undefined) {
      updates.push(`caption = $${paramIndex++}`);
      values.push(imageData.caption);
    }
    
    if (imageData.featured !== undefined) {
      updates.push(`featured = $${paramIndex++}`);
      values.push(imageData.featured);
    }
    
    if (imageData.driveFileId !== undefined) {
      updates.push(`drive_file_id = $${paramIndex++}`);
      values.push(imageData.driveFileId);
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Execute the update
    const updateResult = await query(
      `UPDATE vendor_gallery_images 
       SET ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING id, url, caption, featured, drive_file_id, created_at, updated_at`,
      values
    );
    
    if (updateResult.rows.length === 0) {
      throw new Error(`Gallery image not found with ID: ${id}`);
    }
    
    return {
      id: updateResult.rows[0].id,
      url: updateResult.rows[0].url,
      caption: updateResult.rows[0].caption,
      featured: updateResult.rows[0].featured,
      driveFileId: updateResult.rows[0].drive_file_id,
      createdAt: updateResult.rows[0].created_at,
      updatedAt: updateResult.rows[0].updated_at
    };
  } catch (error) {
    console.error(`[galleryService] Error updating gallery image with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get all gallery images for a vendor
 * 
 * @param {string} vendorEmail - Email of the vendor
 * @returns {Promise<Array>} - Array of gallery images
 */
const getGalleryImages = async (vendorEmail) => {
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
    
    // Get all gallery images for the vendor
    const imagesResult = await query(
      `SELECT id, url, caption, featured, drive_file_id, created_at, updated_at 
       FROM vendor_gallery_images 
       WHERE vendor_id = $1 
       ORDER BY created_at DESC`,
      [vendorId]
    );
    
    // Map the results to a consistent format
    return imagesResult.rows.map(row => ({
      id: row.id,
      url: row.url,
      caption: row.caption,
      featured: row.featured,
      driveFileId: row.drive_file_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error(`[galleryService] Error getting gallery images for vendor ${vendorEmail}:`, error);
    throw error;
  }
};

/**
 * Get a gallery image by ID
 * 
 * @param {string} id - ID of the image to retrieve
 * @returns {Promise<Object|null>} - Gallery image or null if not found
 */
const getGalleryImageById = async (id) => {
  try {
    if (!id) {
      throw new Error('Image ID is required');
    }
    
    // Get the image by ID
    const imageResult = await query(
      `SELECT id, url, caption, featured, drive_file_id, vendor_id, created_at, updated_at 
       FROM vendor_gallery_images 
       WHERE id = $1`,
      [id]
    );
    
    if (imageResult.rows.length === 0) {
      return null;
    }
    
    return {
      id: imageResult.rows[0].id,
      url: imageResult.rows[0].url,
      caption: imageResult.rows[0].caption,
      featured: imageResult.rows[0].featured,
      driveFileId: imageResult.rows[0].drive_file_id,
      vendorId: imageResult.rows[0].vendor_id,
      createdAt: imageResult.rows[0].created_at,
      updatedAt: imageResult.rows[0].updated_at
    };
  } catch (error) {
    console.error(`[galleryService] Error getting gallery image with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a gallery image
 * 
 * @param {string} id - ID of the image to delete
 * @param {string} vendorEmail - Email of the vendor (for security verification)
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteGalleryImage = async (id, vendorEmail) => {
  try {
    if (!id) {
      throw new Error('Image ID is required for deletion');
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
    
    // Delete the image (ensuring it belongs to this vendor)
    const deleteResult = await query(
      'DELETE FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [id, vendorId]
    );
    
    // Return true if a row was deleted, false otherwise
    return deleteResult.rows.length > 0;
  } catch (error) {
    console.error(`[galleryService] Error deleting gallery image with ID ${id}:`, error);
    throw error;
  }
};

module.exports = {
  saveGalleryImage,
  updateGalleryImage,
  getGalleryImages,
  getGalleryImageById,
  deleteGalleryImage
}; 