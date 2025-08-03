const express = require('express');
const multer = require('multer');
const { query } = require('../db');
const imagekitService = require('../src/utils/imagekitService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload gallery images (multiple files)
router.post('/upload/gallery', upload.array('images', 20), async (req, res) => {
  try {
    const { vendor_id, service_id, service_type, image_title, image_description, is_featured } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const uploadResults = [];

    for (const file of req.files) {
      try {
        // Upload to ImageKit
        const uploadResult = await imagekitService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          'GALLERY_IMAGES'
        );

        // Save to database
        const dbResult = await query(`
          INSERT INTO random_images_gallery_and_transformation 
          (image_url, image_type, vendor_id, service_id, service_type, image_title, image_description, is_featured)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          uploadResult.publicLink,
          'gallery',
          vendor_id || null,
          service_id || null,
          service_type || null,
          image_title || null,
          image_description || null,
          is_featured === 'true' || false
        ]);

        uploadResults.push({
          id: dbResult.rows[0].id,
          image_url: dbResult.rows[0].image_url,
          image_type: dbResult.rows[0].image_type,
          imagekit_file_id: uploadResult.fileId,
          file_name: file.originalname
        });

      } catch (uploadError) {
        console.error('Error uploading file:', file.originalname, uploadError);
        uploadResults.push({
          file_name: file.originalname,
          error: uploadError.message
        });
      }
    }

    res.json({
      message: 'Gallery images upload completed',
      results: uploadResults,
      success_count: uploadResults.filter(r => !r.error).length,
      error_count: uploadResults.filter(r => r.error).length
    });

  } catch (error) {
    console.error('Error in gallery upload:', error);
    res.status(500).json({ error: 'Failed to upload gallery images', details: error.message });
  }
});

// Upload transformation images (before/after pairs)
router.post('/upload/transformation', upload.fields([
  { name: 'before_image', maxCount: 1 },
  { name: 'after_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { vendor_id, service_id, service_type, image_title, image_description, is_featured } = req.body;
    
    if (!req.files || (!req.files.before_image && !req.files.after_image)) {
      return res.status(400).json({ error: 'At least one transformation image (before or after) is required' });
    }

    let beforeImageUrl = null;
    let afterImageUrl = null;

    // Upload before image if provided
    if (req.files.before_image && req.files.before_image[0]) {
      const beforeFile = req.files.before_image[0];
      const beforeUploadResult = await imagekitService.uploadFile(
        beforeFile.buffer,
        `before_${beforeFile.originalname}`,
        beforeFile.mimetype,
        'TRANSFORMATION_IMAGES'
      );
      beforeImageUrl = beforeUploadResult.publicLink;
    }

    // Upload after image if provided
    if (req.files.after_image && req.files.after_image[0]) {
      const afterFile = req.files.after_image[0];
      const afterUploadResult = await imagekitService.uploadFile(
        afterFile.buffer,
        `after_${afterFile.originalname}`,
        afterFile.mimetype,
        'TRANSFORMATION_IMAGES'
      );
      afterImageUrl = afterUploadResult.publicLink;
    }

    // Save to database
    const dbResult = await query(`
      INSERT INTO random_images_gallery_and_transformation 
      (image_url, image_type, vendor_id, service_id, service_type, image_title, image_description, 
       before_image_url, after_image_url, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      afterImageUrl || beforeImageUrl, // Use after image as primary, fallback to before
      'transformation',
      vendor_id || null,
      service_id || null,
      service_type || null,
      image_title || null,
      image_description || null,
      beforeImageUrl,
      afterImageUrl,
      is_featured === 'true' || false
    ]);

    res.json({
      message: 'Transformation images uploaded successfully',
      id: dbResult.rows[0].id,
      image_url: dbResult.rows[0].image_url,
      before_image_url: dbResult.rows[0].before_image_url,
      after_image_url: dbResult.rows[0].after_image_url,
      image_type: dbResult.rows[0].image_type
    });

  } catch (error) {
    console.error('Error in transformation upload:', error);
    res.status(500).json({ error: 'Failed to upload transformation images', details: error.message });
  }
});

// Get all gallery images
router.get('/gallery', async (req, res) => {
  try {
    const { vendor_id, service_id, service_type, is_featured, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = ["image_type = 'gallery'"];
    let queryParams = [];
    let paramIndex = 1;

    if (vendor_id) {
      whereConditions.push(`vendor_id = $${paramIndex}`);
      queryParams.push(vendor_id);
      paramIndex++;
    }

    if (service_id) {
      whereConditions.push(`service_id = $${paramIndex}`);
      queryParams.push(service_id);
      paramIndex++;
    }

    if (service_type) {
      whereConditions.push(`service_type = $${paramIndex}`);
      queryParams.push(service_type);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      whereConditions.push(`is_featured = $${paramIndex}`);
      queryParams.push(is_featured === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const result = await query(`
      SELECT * FROM random_images_gallery_and_transformation 
      ${whereClause}
      ORDER BY is_featured DESC, upload_timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM random_images_gallery_and_transformation 
      ${whereClause}
    `, queryParams);

    res.json({
      images: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images', details: error.message });
  }
});

// Get all transformation images
router.get('/transformations', async (req, res) => {
  try {
    const { vendor_id, service_id, service_type, is_featured, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = ["image_type = 'transformation'"];
    let queryParams = [];
    let paramIndex = 1;

    if (vendor_id) {
      whereConditions.push(`vendor_id = $${paramIndex}`);
      queryParams.push(vendor_id);
      paramIndex++;
    }

    if (service_id) {
      whereConditions.push(`service_id = $${paramIndex}`);
      queryParams.push(service_id);
      paramIndex++;
    }

    if (service_type) {
      whereConditions.push(`service_type = $${paramIndex}`);
      queryParams.push(service_type);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      whereConditions.push(`is_featured = $${paramIndex}`);
      queryParams.push(is_featured === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const result = await query(`
      SELECT * FROM random_images_gallery_and_transformation 
      ${whereClause}
      ORDER BY is_featured DESC, upload_timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM random_images_gallery_and_transformation 
      ${whereClause}
    `, queryParams);

    res.json({
      images: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching transformation images:', error);
    res.status(500).json({ error: 'Failed to fetch transformation images', details: error.message });
  }
});

// Delete an image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image details before deletion
    const imageResult = await query(`
      SELECT * FROM random_images_gallery_and_transformation WHERE id = $1
    `, [id]);

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = imageResult.rows[0];

    // Delete from database
    await query(`
      DELETE FROM random_images_gallery_and_transformation WHERE id = $1
    `, [id]);

    // Try to delete from ImageKit (optional, doesn't fail if it errors)
    try {
      if (image.image_url && imagekitService.isImageKitUrl(image.image_url)) {
        const fileId = imagekitService.extractFileIdFromUrl(image.image_url);
        if (fileId) {
          await imagekitService.deleteFile(fileId);
        }
      }
      
      // Delete transformation images if they exist
      if (image.before_image_url && imagekitService.isImageKitUrl(image.before_image_url)) {
        const beforeFileId = imagekitService.extractFileIdFromUrl(image.before_image_url);
        if (beforeFileId) {
          await imagekitService.deleteFile(beforeFileId);
        }
      }
      
      if (image.after_image_url && imagekitService.isImageKitUrl(image.after_image_url)) {
        const afterFileId = imagekitService.extractFileIdFromUrl(image.after_image_url);
        if (afterFileId) {
          await imagekitService.deleteFile(afterFileId);
        }
      }
    } catch (deleteError) {
      console.warn('Failed to delete image from ImageKit, but database record was removed:', deleteError.message);
    }

    res.json({ message: 'Image deleted successfully', deleted_image: image });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image', details: error.message });
  }
});

// Update image details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_title, image_description, is_featured } = req.body;
    
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (image_title !== undefined) {
      updateFields.push(`image_title = $${paramIndex}`);
      queryParams.push(image_title);
      paramIndex++;
    }

    if (image_description !== undefined) {
      updateFields.push(`image_description = $${paramIndex}`);
      queryParams.push(image_description);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex}`);
      queryParams.push(is_featured);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    queryParams.push(new Date());
    paramIndex++;

    queryParams.push(id);

    const result = await query(`
      UPDATE random_images_gallery_and_transformation 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      message: 'Image updated successfully',
      image: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: 'Failed to update image', details: error.message });
  }
});

module.exports = router;