/**
 * Transformation Routes
 * 
 * Defines API routes for transformation image management
 */

const express = require('express');
const router = express.Router();
const transformationController = require('../controllers/transformationController');

// Route for uploading a transformation image (before or after)
// This endpoint accepts multipart/form-data with an image file or base64 data
router.post('/upload', transformationController.uploadTransformationImage);

// Route for getting all transformations for a vendor
router.get('/vendor/:vendorEmail/transformations', transformationController.getTransformations);

// Route for saving transformation data
router.post('/vendor/:vendorEmail/transformations', transformationController.saveTransformation);

// Route for updating a transformation
router.put('/vendor/:vendorEmail/transformations/:id', transformationController.saveTransformation);

// Route for deleting a transformation
router.delete('/vendor/:vendorEmail/transformations/:id', transformationController.deleteTransformation);

// Test route for creating a test transformation folder
router.get('/test-drive', async (req, res) => {
  try {
    // Create a test transformation folder
    const folderId = await transformationController.findOrCreateUserTransformationFolder('TestUser');
    
    res.status(200).json({
      success: true,
      message: 'Test transformation folder created successfully',
      data: {
        testFolder: {
          id: folderId,
          name: 'TestUser_TransformationImage'
        }
      }
    });
  } catch (error) {
    console.error('Error creating test transformation folder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test transformation folder',
      error: error.message
    });
  }
});

module.exports = router; 