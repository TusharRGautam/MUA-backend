const express = require('express');
const multer = require('multer');
const hybridImageService = require('../src/utils/hybridImageService');
const router = express.Router();

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

module.exports = router; 