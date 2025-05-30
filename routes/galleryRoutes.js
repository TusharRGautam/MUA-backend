/**
 * Gallery Routes
 * 
 * Defines API routes for gallery image management
 */

const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { createTestGalleryFolder, findOrCreateUserGalleryFolder } = require('../utils/googleDriveService');

// Route for uploading a new gallery image
// This endpoint accepts multipart/form-data with an image file or base64 data
router.post('/upload', galleryController.uploadGalleryImage);

// Route for getting all gallery images for a vendor
router.get('/vendor/:vendorEmail/gallery', galleryController.getGalleryImages);

// Route for saving gallery image metadata
router.post('/vendor/:vendorEmail/gallery', galleryController.saveGalleryImage);

// Route for updating a gallery image
router.put('/vendor/:vendorEmail/gallery/:id', galleryController.saveGalleryImage);

// Route for deleting a gallery image
router.delete('/vendor/:vendorEmail/gallery/:id', galleryController.deleteGalleryImage);

// Test route for creating a test gallery folder
router.get('/test-drive', async (req, res) => {
  try {
    // Create a test gallery folder
    const folderId = await createTestGalleryFolder();
    
    // If a name parameter is provided, create a folder for that name too
    let customFolderId = null;
    if (req.query.name) {
      customFolderId = await findOrCreateUserGalleryFolder(req.query.name);
    }
    
    res.status(200).json({
      success: true,
      message: 'Test gallery folder created successfully',
      data: {
        testFolder: {
          id: folderId,
          name: 'testgallery_GalleryImage'
        },
        customFolder: req.query.name ? {
          id: customFolderId,
          name: `${req.query.name.replace(/[^a-zA-Z0-9_]/g, '_')}_GalleryImage`
        } : null
      }
    });
  } catch (error) {
    console.error('Error creating test gallery folder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test gallery folder',
      error: error.message
    });
  }
});

module.exports = router; 