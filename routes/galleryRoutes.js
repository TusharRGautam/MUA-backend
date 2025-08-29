/**
 * Gallery Routes
 * 
 * Defines API routes for gallery image management
 */

const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
// Google Drive service removed - using ImageKit instead

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

// Google Drive test route removed

module.exports = router; 