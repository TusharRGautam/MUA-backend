/**
 * Transformation Controller
 * 
 * Handles transformation image uploads, conversions, and management
 */

const { convertToWebP, convertBase64ToWebP, getPublicImageUrl } = require('../utils/imageConverter');
const userService = require('../services/userService');
const transformationService = require('../services/transformationService');
const googleDriveService = require('../utils/googleDriveService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const crypto = require('crypto');

// Transformation-specific Google Drive parent folder ID
const TRANSFORMATION_PARENT_FOLDER_ID = process.env.TRANSFORMATION_PARENT_FOLDER_ID || '1ZzjhEh9CvwW7jbrQ-pxj0Qnv7e4nxmWZ';

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

// Create multer upload middleware with 5MB file size limit
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
 * Find or create a transformation folder for a specific user
 * 
 * @param {string} personName - Name of the person/user
 * @returns {Promise<string>} - ID of the folder
 */
const findOrCreateUserTransformationFolder = async (personName) => {
  try {
    // Sanitize the person name for use in folder name
    const sanitizedName = personName.replace(/[^a-zA-Z0-9_]/g, '_');
    const folderName = `${sanitizedName}_TransformationImage`;
    
    // Try to find the folder using the transformation parent folder ID
    const folderId = await googleDriveService.findFolder(folderName, TRANSFORMATION_PARENT_FOLDER_ID);
    if (folderId) {
      return folderId;
    }
    
    // Create the folder if it doesn't exist
    return await googleDriveService.createFolder(folderName, TRANSFORMATION_PARENT_FOLDER_ID);
  } catch (error) {
    console.error(`Error finding or creating user transformation folder for ${personName}:`, error);
    throw error;
  }
};

/**
 * Upload a transformation image
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadTransformationImageHandler = async (req, res) => {
  try {
    const vendorEmail = req.body.vendorEmail || req.query.vendorEmail;
    const imageType = req.body.imageType || req.query.imageType; // 'before' or 'after'
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email is required'
      });
    }
    
    if (!imageType || !['before', 'after'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid image type (before or after) is required'
      });
    }
    
    // Get optimization parameters from the request
    const shouldOptimize = req.body.optimize === 'true';
    const targetFormat = req.body.target_format || 'webp';
    const quality = parseInt(req.body.quality) || 80;
    const maxWidth = parseInt(req.body.max_width) || 1200;
    
    console.log(`[uploadTransformationImageHandler] Processing ${imageType} image with optimization:`, 
      { optimize: shouldOptimize, format: targetFormat, quality, maxWidth });
    
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
      
      // Validate file size (5MB)
      const fileSizeInMB = req.file.size / (1024 * 1024);
      if (fileSizeInMB > 5) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit'
        });
      }
      
      // Convert the uploaded file to WebP with requested parameters
      webpPath = await convertToWebP(req.file.path, {
        outputDir: path.join(process.cwd(), 'uploads', 'temp'),
        quality: quality,
        resize: true,
        width: maxWidth // Use the specified max width
      });
      
      // Delete the original uploaded file
      fs.unlinkSync(req.file.path);
    }
    // Handle base64 data
    else if (req.body.image) {
      // Check if it's a data URL (base64)
      if (req.body.image.startsWith('data:image/')) {
        originalFilename = req.body.filename || 'image.jpg';
        
        // Validate base64 size
        // Approximate size: (base64 length * 3) / 4
        const base64Data = req.body.image.split(',')[1] || req.body.image;
        const approximateSizeInBytes = (base64Data.length * 3) / 4;
        const approximateSizeInMB = approximateSizeInBytes / (1024 * 1024);
        
        if (approximateSizeInMB > 5) {
          return res.status(400).json({
            success: false,
            message: 'Image size exceeds 5MB limit'
          });
        }
        
        // Convert base64 to WebP file with requested parameters
        webpPath = await convertBase64ToWebP(req.body.image, {
          outputDir: path.join(process.cwd(), 'uploads', 'temp'),
          quality: quality,
          resize: true,
          width: maxWidth // Use the specified max width
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
    
    // Step 2: Find or create the user's transformation folder
    const folderName = await findOrCreateUserTransformationFolder(vendorName);
    
    // Step 3: Upload the WebP image to Google Drive
    const timestamp = Date.now();
    const fileName = `transformation_${imageType}_${timestamp}.webp`;
    
    const uploadedFile = await googleDriveService.uploadFile(
      webpPath,
      fileName,
      'image/webp',
      folderName
    );
    
    // Delete the local WebP file after uploading to Google Drive
    fs.unlinkSync(webpPath);
    
    console.log(`Successfully converted and uploaded ${imageType} image to WebP format: ${uploadedFile.webViewLink}`);
    
    // Return success response with image URL and Drive file ID
    res.status(200).json({
      success: true,
      message: `${imageType} image uploaded to Google Drive successfully`,
      imageUrl: uploadedFile.webViewLink,
      driveFileId: uploadedFile.id,
      originalName: originalFilename,
      format: 'webp',
      optimized: true
    });
  } catch (error) {
    console.error(`Error uploading ${req.body.imageType || 'transformation'} image:`, error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading and processing image'
    });
  }
};

/**
 * Save transformation details
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveTransformationHandler = async (req, res) => {
  try {
    const { id, title, description, beforeUrl, afterUrl, beforeDriveFileId, afterDriveFileId } = req.body;
    const vendorEmail = req.params.vendorEmail;
    
    // Log the request for debugging
    console.log('[saveTransformation] Request received:', { 
      vendorEmail, 
      id: id || 'new', 
      title,
      beforeUrlType: beforeUrl ? (typeof beforeUrl === 'string' ? (beforeUrl.substring(0, 10) + '...') : typeof beforeUrl) : 'none',
      afterUrlType: afterUrl ? (typeof afterUrl === 'string' ? (afterUrl.substring(0, 10) + '...') : typeof afterUrl) : 'none',
      hasBeforeDriveFileId: !!beforeDriveFileId,
      hasAfterDriveFileId: !!afterDriveFileId
    });
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Vendor email is required'
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({
        success: false,
        error: 'Before and after images are required'
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
    
    console.log('[saveTransformation] Found vendor:', { vendorId, personName });
    
    let finalBeforeUrl = beforeUrl;
    let finalAfterUrl = afterUrl;
    let finalBeforeDriveFileId = beforeDriveFileId || null;
    let finalAfterDriveFileId = afterDriveFileId || null;
    
    // Check if before image is base64 and needs to be uploaded
    if (beforeUrl && beforeUrl.startsWith('data:image/')) {
      console.log('[saveTransformation] Processing base64 before image for Google Drive upload');
      
      try {
        // Get the transformation folder
        const folderId = await findOrCreateUserTransformationFolder(personName);
        
        // Convert the base64 image directly to WebP buffer
        const webpBuffer = await require('../utils/imageConverter').convertBase64ToWebPBuffer(beforeUrl, {
          quality: 80,
          resize: true,
          width: 1200 // Resize to max width while preserving aspect ratio
        });
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const fileName = `transformation_before_${timestamp}_${randomString}.webp`;
        
        console.log(`[saveTransformation] Uploading before WebP image to Google Drive: ${fileName} (${webpBuffer.length} bytes)`);
        
        // Upload directly to Google Drive
        const uploadResult = await googleDriveService.uploadBufferToDrive(
          webpBuffer,
          fileName,
          'image/webp', // WebP mime type
          folderId
        );
        
        // Update image URL and file ID
        finalBeforeUrl = uploadResult.webViewLink || uploadResult.webContentLink;
        finalBeforeDriveFileId = uploadResult.id;
        
        console.log('[saveTransformation] Before image converted to WebP and uploaded to Drive:', { finalBeforeUrl, finalBeforeDriveFileId });
      } catch (uploadError) {
        console.error('[saveTransformation] Before image Google Drive upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload before image to Google Drive'
        });
      }
    }
    
    // Check if after image is base64 and needs to be uploaded
    if (afterUrl && afterUrl.startsWith('data:image/')) {
      console.log('[saveTransformation] Processing base64 after image for Google Drive upload');
      
      try {
        // Get the transformation folder
        const folderId = await findOrCreateUserTransformationFolder(personName);
        
        // Convert the base64 image directly to WebP buffer
        const webpBuffer = await require('../utils/imageConverter').convertBase64ToWebPBuffer(afterUrl, {
          quality: 80,
          resize: true,
          width: 1200 // Resize to max width while preserving aspect ratio
        });
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const fileName = `transformation_after_${timestamp}_${randomString}.webp`;
        
        console.log(`[saveTransformation] Uploading after WebP image to Google Drive: ${fileName} (${webpBuffer.length} bytes)`);
        
        // Upload directly to Google Drive
        const uploadResult = await googleDriveService.uploadBufferToDrive(
          webpBuffer,
          fileName,
          'image/webp', // WebP mime type
          folderId
        );
        
        // Update image URL and file ID
        finalAfterUrl = uploadResult.webViewLink || uploadResult.webContentLink;
        finalAfterDriveFileId = uploadResult.id;
        
        console.log('[saveTransformation] After image converted to WebP and uploaded to Drive:', { finalAfterUrl, finalAfterDriveFileId });
      } catch (uploadError) {
        console.error('[saveTransformation] After image Google Drive upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload after image to Google Drive'
        });
      }
    }
    
    // Save transformation data using the service
    const transformationData = {
      id: id,
      title: title,
      description: description || '',
      beforeUrl: finalBeforeUrl,
      afterUrl: finalAfterUrl,
      beforeDriveFileId: finalBeforeDriveFileId,
      afterDriveFileId: finalAfterDriveFileId
    };
    
    const savedTransformation = await transformationService.saveTransformation(transformationData, vendorEmail);
    
    return res.json({
      success: true,
      message: id ? 'Transformation updated successfully' : 'Transformation created successfully',
      data: savedTransformation
    });
  } catch (error) {
    console.error('[saveTransformation] Error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
};

/**
 * Get transformations for a vendor
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTransformationsHandler = async (req, res) => {
  try {
    const vendorEmail = req.params.vendorEmail;
    
    if (!vendorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email is required'
      });
    }
    
    const transformations = await transformationService.getTransformations(vendorEmail);
    
    // Format the transformations for the frontend
    const formattedTransformations = transformations.map(transformation => ({
      id: transformation.id,
      title: transformation.title,
      description: transformation.description,
      before_image: transformation.beforeImage,
      after_image: transformation.afterImage,
      before_drive_file_id: transformation.beforeDriveFileId,
      after_drive_file_id: transformation.afterDriveFileId,
      created_at: transformation.createdAt
    }));
    
    res.status(200).json({
      success: true,
      transformations: formattedTransformations
    });
  } catch (error) {
    console.error('Error getting transformations:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting transformations'
    });
  }
};

/**
 * Delete a transformation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTransformationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorEmail } = req.params;
    
    if (!vendorEmail || !id) {
      return res.status(400).json({
        success: false,
        message: 'Vendor email and transformation ID are required'
      });
    }
    
    // Get the transformation details first to check for Google Drive IDs
    const transformation = await transformationService.getTransformationById(id);
    
    // If the transformation has Google Drive file IDs, delete them from Drive
    if (transformation) {
      // Delete before image if it has a Drive file ID
      if (transformation.beforeDriveFileId) {
        try {
          await googleDriveService.deleteFile(transformation.beforeDriveFileId);
          console.log(`Deleted before image from Google Drive: ${transformation.beforeDriveFileId}`);
        } catch (driveError) {
          // Log the error but continue with database deletion
          console.error(`Error deleting before image from Google Drive: ${driveError.message}`);
        }
      }
      
      // Delete after image if it has a Drive file ID
      if (transformation.afterDriveFileId) {
        try {
          await googleDriveService.deleteFile(transformation.afterDriveFileId);
          console.log(`Deleted after image from Google Drive: ${transformation.afterDriveFileId}`);
        } catch (driveError) {
          // Log the error but continue with database deletion
          console.error(`Error deleting after image from Google Drive: ${driveError.message}`);
        }
      }
    }
    
    // Delete the transformation from the database
    const result = await transformationService.deleteTransformation(id, vendorEmail);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found or not associated with the vendor'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Transformation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transformation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting transformation'
    });
  }
};

// Export controller functions
module.exports = {
  uploadTransformationImage: [upload.single('image'), uploadTransformationImageHandler],
  saveTransformation: saveTransformationHandler,
  getTransformations: getTransformationsHandler,
  deleteTransformation: deleteTransformationHandler,
  findOrCreateUserTransformationFolder
}; 