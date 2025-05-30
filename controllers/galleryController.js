/**
 * Gallery Controller
 * 
 * Handles gallery image uploads, conversions, and management
 */

const { convertToWebP, convertBase64ToWebP, getPublicImageUrl } = require('../utils/imageConverter');
const { uploadGalleryImage } = require('../utils/googleDriveService');
const userService = require('../services/userService');
const galleryService = require('../services/galleryService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const googleDriveService = require('../utils/googleDriveService');
const crypto = require('crypto');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB in bytes
  },
  fileFilter: function (req, file, cb) {
    // Accept only jpg and png files
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only JPG and PNG image files are allowed'));
  }
});

/**
 * Upload a gallery image
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadGalleryImageHandler = async (req, res) => {
  try {
    const vendorEmail = req.body.vendorEmail || req.query.vendorEmail;
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email is required'
      });
    }
    
    // Step 1: Get the vendor's full name for Google Drive folder
    const vendorName = await userService.getUserFullNameByEmail(vendorEmail);
    
    if (!vendorName) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with email: ${vendorEmail}`
      });
    }
    
    // Process the uploaded file or base64 data
    let webpPath;
    let originalFilename;
    
    // Handle file upload (multipart/form-data)
    if (req.file) {
      originalFilename = req.file.originalname;
      
      // Convert the uploaded file to WebP
      webpPath = await convertToWebP(req.file.path, {
        outputDir: path.join(process.cwd(), 'uploads', 'temp'),
        quality: 80,
        resize: true,
        width: 1200 // Set maximum width, maintain aspect ratio
      });
      
      // Delete the original uploaded file
      fs.unlinkSync(req.file.path);
    }
    // Handle base64 data
    else if (req.body.image) {
      // Check if it's a data URL (base64)
      if (req.body.image.startsWith('data:image/')) {
        originalFilename = req.body.filename || 'image.jpg';
        
        // Convert base64 to WebP file
        webpPath = await convertBase64ToWebP(req.body.image, {
          outputDir: path.join(process.cwd(), 'uploads', 'temp'),
          quality: 80,
          resize: true,
          width: 1200 // Set maximum width, maintain aspect ratio
        });
      }
      // Handle placeholder URL from frontend
      else if (req.body.image === 'https://placeholder-image.jpg') {
        // If we receive a placeholder, return success but indicate it's a placeholder
        return res.status(200).json({
          success: true,
          message: 'Using placeholder image. No conversion needed.',
          imageUrl: req.body.image,
          isPlaceholder: true
        });
      }
      else {
        return res.status(400).json({
          success: false,
          message: 'Invalid image data. Must be base64 data URL or file upload.'
        });
      }
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No image file or base64 data provided'
      });
    }
    
    // Step 2: Upload the WebP image to Google Drive
    const driveImageUrl = await uploadGalleryImage(webpPath, vendorName);
    
    // Delete the local WebP file after uploading to Google Drive
    fs.unlinkSync(webpPath);
    
    console.log(`Successfully converted and uploaded image to WebP format: ${driveImageUrl}`);
    
    // Step 3: Save the image URL to the database
    if (req.body.caption !== undefined) {
      // Save the image with metadata
      await galleryService.saveGalleryImage({
        url: driveImageUrl,
        caption: req.body.caption,
        featured: req.body.featured === 'true' || req.body.featured === true
      }, vendorEmail);
    }
    
    // Return success response with image URL
    res.status(200).json({
      success: true,
      message: 'Image uploaded to Google Drive successfully',
      imageUrl: driveImageUrl,
      originalName: originalFilename,
      format: 'webp'
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading and processing image'
    });
  }
};

/**
 * Save gallery image metadata
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveGalleryImageHandler = async (req, res) => {
  try {
    const { id, url, caption, featured, driveFileId } = req.body;
    const vendorEmail = req.params.vendorEmail;
    
    // Log the request for debugging
    console.log('[saveGalleryImage] Request received:', { 
      vendorEmail, 
      id: id || 'new', 
      caption, 
      featured, 
      urlType: url ? (typeof url === 'string' ? (url.substring(0, 10) + '...') : typeof url) : 'none',
      hasDriveFileId: !!driveFileId
    });
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Vendor email is required'
      });
    }
    
    // Get vendor ID from email
    const vendorResult = await query(
      'SELECT sr_no, person_name FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const vendorId = vendorResult.rows[0].sr_no;
    const personName = vendorResult.rows[0].person_name;
    
    console.log('[saveGalleryImage] Found vendor:', { vendorId, personName });
    
    let imageUrl = url;
    let imageFileId = driveFileId || null;
    
    // Check if this is a base64 image that needs to be uploaded to Google Drive
    if (url && url.startsWith('data:image/')) {
      console.log('[saveGalleryImage] Processing base64 image for Google Drive upload');
      
      try {
        // Convert the base64 image directly to WebP buffer for better performance
        const webpBuffer = await require('../utils/imageConverter').convertBase64ToWebPBuffer(url, {
          quality: 80,
          resize: true,
          width: 1200 // Resize to max width while preserving aspect ratio
        });
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const fileName = `gallery_${timestamp}_${randomString}.webp`;
        
        console.log(`[saveGalleryImage] Uploading WebP image to Google Drive: ${fileName} (${webpBuffer.length} bytes)`);
        
        // Upload directly to Google Drive
        const uploadResult = await googleDriveService.uploadBufferToDrive(
          webpBuffer,
          fileName,
          'image/webp', // WebP mime type
          await googleDriveService.findOrCreateUserGalleryFolder(personName)
        );
        
        console.log('[saveGalleryImage] Google Drive upload result:', uploadResult);
        
        // Update image URL and file ID
        imageUrl = uploadResult.webViewLink || uploadResult.webContentLink;
        imageFileId = uploadResult.id;
        
        console.log('[saveGalleryImage] Image converted to WebP and uploaded to Drive:', { imageUrl, imageFileId });
      } catch (uploadError) {
        console.error('[saveGalleryImage] Google Drive upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image to Google Drive'
        });
      }
    } else if (url && url.startsWith('file://')) {
      return res.status(400).json({
        success: false,
        error: 'Direct file uploads from frontend not supported. Please convert to base64 first.'
      });
    }
    
    if (id) {
      // Update existing image
      console.log(`[saveGalleryImage] Updating existing gallery image: ${id}`);
      
      // Get existing image to check for Drive file ID
      const existingImage = await query(
        'SELECT drive_file_id FROM vendor_gallery_images WHERE id = $1 AND vendor_id = $2',
        [id, vendorId]
      );
      
      if (existingImage.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Gallery image not found or not owned by this vendor'
        });
      }
      
      // If we have a new Drive file ID and there was an old one, delete the old file from Drive
      if (imageFileId && existingImage.rows[0].drive_file_id && imageFileId !== existingImage.rows[0].drive_file_id) {
        try {
          await googleDriveService.deleteFile(existingImage.rows[0].drive_file_id);
          console.log(`[saveGalleryImage] Deleted old Drive file: ${existingImage.rows[0].drive_file_id}`);
        } catch (deleteError) {
          console.warn(`[saveGalleryImage] Error deleting old Drive file: ${deleteError.message}`);
          // Continue with update even if delete fails
        }
      }
      
      // Update the image in the database - REMOVE updated_at
      const updateResult = await query(
        `UPDATE vendor_gallery_images 
         SET url = $1, caption = $2, featured = $3, drive_file_id = $4
         WHERE id = $5 AND vendor_id = $6 
         RETURNING id, url, caption, featured, drive_file_id, created_at`,
        [imageUrl, caption || '', featured || false, imageFileId, id, vendorId]
      );
      
      return res.json({
        success: true,
        message: 'Gallery image updated successfully',
        data: updateResult.rows[0]
      });
    } else {
      // Insert new image - REMOVE updated_at
      console.log('[saveGalleryImage] Creating new gallery image');
      
      const insertResult = await query(
        `INSERT INTO vendor_gallery_images 
         (vendor_id, url, caption, featured, drive_file_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING id, url, caption, featured, drive_file_id, created_at`,
        [vendorId, imageUrl, caption || '', featured || false, imageFileId]
      );
      
      return res.status(201).json({
        success: true,
        message: 'Gallery image created successfully',
        data: insertResult.rows[0]
      });
    }
  } catch (error) {
    console.error('[saveGalleryImage] Error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

/**
 * Get gallery images for a vendor
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGalleryImagesHandler = async (req, res) => {
  try {
    const vendorEmail = req.params.vendorEmail;
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email is required'
      });
    }
    
    const images = await galleryService.getGalleryImages(vendorEmail);
    
    // Format the images for the frontend
    const formattedImages = images.map(image => ({
      id: image.id,
      url: image.url,
      caption: image.caption,
      featured: image.featured,
      created_at: image.created_at
    }));
    
    res.status(200).json({
      success: true,
      images: formattedImages
    });
  } catch (error) {
    console.error('Error getting gallery images:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting gallery images'
    });
  }
};

/**
 * Delete a gallery image
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteGalleryImageHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorEmail } = req.params;
    
    if (!vendorEmail || !id) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email and image ID are required'
      });
    }
    
    // Get the image details first to check for Google Drive ID
    const image = await galleryService.getGalleryImageById(id);
    
    // If the image has a Google Drive file ID, delete it from Drive
    if (image && image.driveFileId) {
      try {
        await googleDriveService.deleteFile(image.driveFileId);
        console.log(`Deleted image from Google Drive: ${image.driveFileId}`);
      } catch (driveError) {
        // Log the error but continue with database deletion
        console.error(`Error deleting image from Google Drive: ${driveError.message}`);
      }
    }
    
    // Delete the image from the database
    const result = await galleryService.deleteGalleryImage(id, vendorEmail);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found or not associated with the vendor'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting gallery image'
    });
  }
};

// Export controller functions
module.exports = {
  uploadGalleryImage: [upload.single('image'), uploadGalleryImageHandler],
  saveGalleryImage: saveGalleryImageHandler,
  getGalleryImages: getGalleryImagesHandler,
  deleteGalleryImage: deleteGalleryImageHandler
}; 