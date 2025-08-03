const express = require('express');
const multer = require('multer');
const hybridImageService = require('../src/utils/hybridImageService');
const router = express.Router();
const imagekitService = require('../src/utils/imagekitService');
const { convertBase64ToWebPBuffer } = require('../utils/imageConverter');
const crypto = require('crypto');
const axios = require('axios');

// Configure multer for memory storage (we'll upload to cloud or local storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize the hybrid service on startup
hybridImageService.initialize().catch(err => {
  console.error('Failed to initialize hybrid image service:', err);
});

// Define the package icon parent folder ID (from the provided Google Drive URL)
const PACKAGES_ICON_PARENT_FOLDER_ID = '1OvhxktOCH7UtNz03Fd0gLbUZQmIZFaGY';

// Define the PRP packages icon parent folder ID
const PRP_PACKAGES_ICON_PARENT_FOLDER_ID = '1OvhxktOCH7UtNz03Fd0gLbUZQmIZFaGY';

/**
 * Find or create the packages_icon_image folder
 * 
 * @returns {Promise<string>} - ID of the folder
 */
const findOrCreatePackageIconFolder = async () => {
  try {
    const folderName = 'packages_icon_image';
    
    // Try to find the folder using the parent folder ID
    const folderId = await googleDriveService.findFolder(folderName, PACKAGES_ICON_PARENT_FOLDER_ID);
    if (folderId) {
      return folderId;
    }
    
    // Create the folder if it doesn't exist
    return await googleDriveService.createFolder(folderName, PACKAGES_ICON_PARENT_FOLDER_ID);
  } catch (error) {
    console.error(`Error finding or creating package icon folder:`, error);
    throw error;
  }
};

/**
 * Find or create the prp_packages_icon_image folder
 * 
 * @returns {Promise<string>} - ID of the folder
 */
const findOrCreatePRPIconFolder = async () => {
  try {
    const folderName = 'prp_packages_icon_image';
    
    // Try to find the folder using the parent folder ID
    const folderId = await googleDriveService.findFolder(folderName, PRP_PACKAGES_ICON_PARENT_FOLDER_ID);
    if (folderId) {
      return folderId;
    }
    
    // Create the folder if it doesn't exist
    return await googleDriveService.createFolder(folderName, PRP_PACKAGES_ICON_PARENT_FOLDER_ID);
  } catch (error) {
    console.error(`Error finding or creating PRP icon folder:`, error);
    throw error;
  }
};

/**
 * @route GET /api/upload/status
 * @desc Get upload service status
 * @access Public
 */
router.get('/status', (req, res) => {
  try {
    const status = hybridImageService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/upload/package-icon
 * @desc Upload package icon, convert to WebP, and store in Google Drive
 * @access Public (for now, can add auth later)
 */
router.post('/package-icon', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    // Check if image is base64
    if (!req.body.image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be base64 data URL.'
      });
    }

    console.log('Processing package icon for upload');

    // Convert the base64 image to WebP buffer
    const webpBuffer = await convertBase64ToWebPBuffer(req.body.image, {
      quality: 80,
      resize: true,
      width: 800 // Reasonable size for package icons
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileName = `package_icon_${timestamp}_${randomString}.webp`;

    console.log(`Uploading WebP package icon to ImageKit: ${fileName}`);

    // Upload directly to ImageKit
    const uploadResult = await imagekitService.uploadFile(
      webpBuffer,
      fileName,
      'image/webp',
      'PACKAGE_ICONS'
    );

    console.log('Package icon uploaded successfully to ImageKit');
    console.log('ImageKit URL:', uploadResult.publicLink);
    
    // Use the ImageKit URL directly
    const directImageUrl = uploadResult.publicLink;

    res.status(200).json({
      success: true,
      message: 'Package icon uploaded successfully',
      data: {
        fileId: uploadResult.fileId,
        fileName: fileName,
        imageUrl: directImageUrl, // Direct image URL for display
        webViewLink: uploadResult.publicLink, // ImageKit public URL
        webContentLink: uploadResult.publicLink // Same as webViewLink for ImageKit
      }
    });
  } catch (error) {
    console.error('Error uploading package icon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload package icon'
    });
  }
});

/**
 * @route POST /api/upload/service-image
 * @desc Upload service image using hybrid storage (Google Drive + Local fallback)
 * @access Public (for now, can add auth later)
 */
router.post('/service-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Uploading service image:', req.file.originalname);

    // Upload using hybrid service
    const result = await hybridImageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      hybridImageService.constructor.getFolderType('service')
    );

    res.json({
      success: true,
      message: `Service image uploaded successfully to ${result.storageType}`,
      data: {
        fileId: result.fileId,
        fileName: result.fileName,
        publicLink: result.publicLink,
        webViewLink: result.webViewLink,
        storageType: result.storageType
      }
    });

  } catch (error) {
    console.error('Error uploading service image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload service image'
    });
  }
});

/**
 * @route POST /api/upload/icon-image
 * @desc Upload icon image using hybrid storage (Google Drive + Local fallback)
 * @access Public (for now, can add auth later)
 */
router.post('/icon-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Uploading icon image:', req.file.originalname);

    // Upload using hybrid service
    const result = await hybridImageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      hybridImageService.constructor.getFolderType('icon')
    );

    res.json({
      success: true,
      message: `Icon image uploaded successfully to ${result.storageType}`,
      data: {
        fileId: result.fileId,
        fileName: result.fileName,
        publicLink: result.publicLink,
        webViewLink: result.webViewLink,
        storageType: result.storageType
      }
    });

  } catch (error) {
    console.error('Error uploading icon image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload icon image'
    });
  }
});

/**
 * @route POST /api/upload/product-image
 * @desc Upload product image using hybrid storage (Google Drive + Local fallback)
 * @access Public (for now, can add auth later)
 */
router.post('/product-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Uploading product image:', req.file.originalname);

    // Upload using hybrid service
    const result = await hybridImageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      hybridImageService.constructor.getFolderType('product')
    );

    res.json({
      success: true,
      message: `Product image uploaded successfully to ${result.storageType}`,
      data: {
        fileId: result.fileId,
        fileName: result.fileName,
        publicLink: result.publicLink,
        webViewLink: result.webViewLink,
        storageType: result.storageType
      }
    });

  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload product image'
    });
  }
});

/**
 * @route POST /api/upload/prp-icon
 * @desc Upload PRP service icon, convert to WebP, and store in Google Drive
 * @access Public (for now, can add auth later)
 */
router.post('/prp-icon', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    // Check if image is base64
    if (!req.body.image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be base64 data URL.'
      });
    }

    console.log('Processing PRP service icon for upload');

    // Convert the base64 image to WebP buffer
    const webpBuffer = await convertBase64ToWebPBuffer(req.body.image, {
      quality: 80,
      resize: true,
      width: 800 // Reasonable size for service icons
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileName = `prp_service_icon_${timestamp}_${randomString}.webp`;

    console.log(`Uploading WebP PRP service icon to ImageKit: ${fileName}`);

    // Upload directly to ImageKit
    const uploadResult = await imagekitService.uploadFile(
      webpBuffer,
      fileName,
      'image/webp',
      'PRP_ICONS'
    );

    console.log('PRP service icon uploaded successfully to ImageKit');
    console.log('ImageKit URL:', uploadResult.publicLink);
    
    // Use the ImageKit URL directly
    const directImageUrl = uploadResult.publicLink;

    // Return the file information
    res.status(200).json({
      success: true,
      message: 'PRP service icon uploaded successfully',
      imageUrl: directImageUrl,
      driveFileId: uploadResult.fileId,
      driveUrl: uploadResult.publicLink,
      originalName: req.body.filename || 'image.jpg',
      format: 'webp'
    });
  } catch (error) {
    console.error('Error uploading PRP service icon:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading and processing icon'
    });
  }
});

/**
 * @route DELETE /api/upload/delete/:fileId
 * @desc Delete file from storage (auto-detects Google Drive vs Local)
 * @access Public (for now, can add auth later)
 */
router.delete('/delete/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { storageType } = req.query; // Optional hint about storage type

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
    }

    console.log('Deleting file:', fileId, storageType ? `(${storageType})` : '(auto-detect)');

    // Delete using hybrid service
    await hybridImageService.deleteFile(fileId, storageType);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file'
    });
  }
});

/**
 * @route GET /api/upload/proxy-image
 * @desc Proxy an image from Google Drive to avoid CORS issues
 * @access Public
 */
router.get('/proxy-image', async (req, res) => {
  try {
    const { url, id } = req.query;
    
    if (!url && !id) {
      return res.status(400).json({
        success: false,
        error: 'Either url or id parameter is required'
      });
    }
    
    let imageUrl = url;
    
    // If ID is provided, build Google Drive URL
    if (id) {
      // Validate Google Drive file ID format
      const validGoogleDriveIdPattern = /^[a-zA-Z0-9_-]{25,}$/;
      
      if (!validGoogleDriveIdPattern.test(id)) {
        console.warn(`Invalid Google Drive file ID format: ${id}`);
        // Return a placeholder image for invalid IDs
        return res.redirect('https://via.placeholder.com/200x200/e3f2fd/1976d2?text=No+Image');
      }
      
      imageUrl = `https://drive.google.com/uc?export=view&id=${id}`;
    }
    
    // Validate the imageUrl
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      console.warn(`Invalid image URL: ${imageUrl}`);
      return res.redirect('https://via.placeholder.com/200x200/e3f2fd/1976d2?text=Invalid+URL');
    }
    
    console.log(`Proxying image from: ${imageUrl}`);
    
    // Check if this is a problematic domain that needs SSL validation disabled
    const isProblematicDomain = imageUrl.includes('corsproxy.io');
    
    // Use axios to fetch the image
    const axiosConfig = {
      method: 'get',
      url: imageUrl,
      responseType: 'stream',
      timeout: 10000, // 10 second timeout
      maxRedirects: 5
    };
    
    // Only disable SSL validation for known problematic domains
    if (isProblematicDomain) {
      axiosConfig.httpsAgent = new (require('https')).Agent({
        rejectUnauthorized: false // Only for problematic domains
      });
    }
    
    const response = await axios(axiosConfig);
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS headers
    
    // Pipe the image stream directly to the response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // Return a styled placeholder image if the original fails
    const placeholderColor = 'e3f2fd'; // Light blue
    const textColor = '1976d2'; // Dark blue
    const placeholderUrl = `https://via.placeholder.com/200x200/${placeholderColor}/${textColor}?text=Image+Not+Found`;
    
    res.redirect(placeholderUrl);
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed!'
    });
  }

  res.status(500).json({
    success: false,
    error: error.message || 'Upload failed'
  });
});

/**
 * @route POST /api/upload/salon-service-image
 * @desc Upload salon service image with category-based folder structure
 * @access Public (for now, can add auth later)
 */
router.post('/salon-service-image', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    // Check if image is base64
    if (!req.body.image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be base64 data URL.'
      });
    }

    const { folderPath, serviceType, imageType, filename } = req.body;
    
    console.log(`Processing salon service image for upload: ${imageType} (${serviceType})`);
    console.log(`Folder path: ${folderPath}`);

    // Convert the base64 image to WebP buffer
    const webpBuffer = await convertBase64ToWebPBuffer(req.body.image, {
      quality: 80,
      resize: true,
      width: 800 // Reasonable size for service images
    });

    // Generate unique filename with category and service type info
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const cleanImageType = imageType.replace(/[^a-z0-9]/gi, '_');
    const fileName = `${serviceType.toLowerCase()}_${cleanImageType}_${timestamp}_${randomString}.webp`;

    console.log(`Uploading WebP salon service image to ImageKit: ${fileName}`);

    // Upload to ImageKit with custom folder structure
    let uploadResult;
    if (folderPath && folderPath.startsWith('salon/')) {
      // Use custom path method for salon services
      uploadResult = await imagekitService.uploadFileToCustomPath(
        webpBuffer,
        fileName,
        'image/webp',
        folderPath
      );
    } else {
      // Use standard predefined folder types
      uploadResult = await imagekitService.uploadFile(
        webpBuffer,
        fileName,
        'image/webp',
        folderPath || 'SALON_SERVICES'
      );
    }

    console.log('Salon service image uploaded successfully to ImageKit');
    console.log('ImageKit URL:', uploadResult.publicLink);
    
    // Use the ImageKit URL directly
    const directImageUrl = uploadResult.publicLink;

    res.status(200).json({
      success: true,
      message: 'Salon service image uploaded successfully',
      imageUrl: directImageUrl,
      fileId: uploadResult.fileId,
      fileName: fileName,
      folderPath: folderPath,
      serviceType: serviceType,
      imageType: imageType
    });
  } catch (error) {
    console.error('Error uploading salon service image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload salon service image'
    });
  }
});

module.exports = router; 