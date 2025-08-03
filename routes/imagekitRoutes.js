const express = require('express');
const router = express.Router();
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imagekitService = require('../utils/imagekitService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * Get ImageKit authentication parameters for client-side upload
 * GET /api/imagekit/auth
 */
router.get('/auth', (req, res) => {
  try {
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please check environment variables.'
      });
    }

    const authParams = imagekitService.getAuthenticationParameters();
    res.json({
      success: true,
      ...authParams
    });
  } catch (error) {
    console.error('Error getting ImageKit auth parameters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication parameters'
    });
  }
});

/**
 * Upload verification document to ImageKit.io
 * POST /api/imagekit/upload-verification
 */
router.post('/upload-verification', upload.single('document'), async (req, res) => {
  try {
    const { documentType, vendorEmail, vendorName } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    if (!documentType || !vendorEmail || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentType, vendorEmail, vendorName'
      });
    }
    
    if (!['aadhaar', 'pan'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type. Must be "aadhaar" or "pan"'
      });
    }
    
    // Get vendor details from database
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
    
    const vendor = vendorResult.rows[0];
    const vendorId = vendor.sr_no;
    
    console.log(`[ImageKit API] Uploading ${documentType} for vendor ${vendorId}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadVerificationDocument(
      req.file.path, // File path
      documentType,
      vendorId,
      vendorEmail
    );
    
    // Update database with the ImageKit CDN URL
    const columnName = documentType === 'aadhaar' ? 'verify_aadharcard_url' : 'verify_pancard_url';
    const updateQuery = `
      UPDATE registration_and_other_details 
      SET ${columnName} = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE business_email = $2 
      RETURNING sr_no, verify_aadharcard_url, verify_pancard_url
    `;
    
    const updateResult = await query(updateQuery, [uploadResult.url, vendorEmail]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update vendor record'
      });
    }

    // Check if both documents are now uploaded and update verification status
    const vendorData = updateResult.rows[0];
    const hasAadhaar = vendorData.verify_aadharcard_url && vendorData.verify_aadharcard_url.trim() !== '';
    const hasPan = vendorData.verify_pancard_url && vendorData.verify_pancard_url.trim() !== '';
    
    if (hasAadhaar && hasPan) {
      // Both documents uploaded, set verification status to pending and vendor status to pending
      console.log(`Both documents uploaded for ${vendorEmail}, updating verification status to pending`);
      await query(
        `UPDATE registration_and_other_details 
         SET verification_status = 'pending', vendor_status = 'pending', status_updated_at = CURRENT_TIMESTAMP 
         WHERE business_email = $1`,
        [vendorEmail]
      );
    }
    
    // Clean up temporary file
    fs.unlinkSync(req.file.path);
    
    console.log(`Successfully uploaded ${documentType} to ImageKit for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully to ImageKit`,
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        documentType: documentType,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error('Error uploading document to ImageKit:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document to ImageKit',
      details: error.message
    });
  }
});

/**
 * Upload verification document via base64 data to ImageKit.io
 * POST /api/imagekit/upload-verification-base64
 */
router.post('/upload-verification-base64', async (req, res) => {
  try {
    const { documentType, vendorEmail, vendorName, imageData } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }
    
    if (!documentType || !vendorEmail || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentType, vendorEmail, vendorName'
      });
    }
    
    if (!['aadhaar', 'pan'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type. Must be "aadhaar" or "pan"'
      });
    }
    
    // Get vendor details from database
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
    
    const vendor = vendorResult.rows[0];
    const vendorId = vendor.sr_no;
    
    console.log(`[ImageKit API] Uploading ${documentType} via base64 for vendor ${vendorId}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadVerificationDocument(
      imageData, // Base64 data
      documentType,
      vendorId,
      vendorEmail
    );
    
    // Update database with the ImageKit CDN URL
    const columnName = documentType === 'aadhaar' ? 'verify_aadharcard_url' : 'verify_pancard_url';
    const updateQuery = `
      UPDATE registration_and_other_details 
      SET ${columnName} = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE business_email = $2 
      RETURNING sr_no, verify_aadharcard_url, verify_pancard_url
    `;
    
    const updateResult = await query(updateQuery, [uploadResult.url, vendorEmail]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update vendor record'
      });
    }

    // Check if both documents are now uploaded and update verification status
    const vendorData = updateResult.rows[0];
    const hasAadhaar = vendorData.verify_aadharcard_url && vendorData.verify_aadharcard_url.trim() !== '';
    const hasPan = vendorData.verify_pancard_url && vendorData.verify_pancard_url.trim() !== '';
    
    if (hasAadhaar && hasPan) {
      // Both documents uploaded, set verification status to pending and vendor status to pending
      console.log(`Both documents uploaded for ${vendorEmail}, updating verification status to pending`);
      await query(
        `UPDATE registration_and_other_details 
         SET verification_status = 'pending', vendor_status = 'pending', status_updated_at = CURRENT_TIMESTAMP 
         WHERE business_email = $1`,
        [vendorEmail]
      );
    }
    
    console.log(`Successfully uploaded ${documentType} to ImageKit for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully to ImageKit`,
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        documentType: documentType,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error('Error uploading base64 document to ImageKit:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document to ImageKit',
      details: error.message
    });
  }
});

/**
 * Upload gallery image to ImageKit.io
 * POST /api/imagekit/upload-gallery
 */
router.post('/upload-gallery', async (req, res) => {
  try {
    const { vendorEmail, imageData } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!imageData || !vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorEmail, imageData'
      });
    }
    
    console.log(`[ImageKit API] Uploading gallery image for vendor ${vendorEmail}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadGalleryImage(imageData, vendorEmail);
    
    console.log(`Successfully uploaded gallery image to ImageKit for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: 'Gallery image uploaded successfully to ImageKit',
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        vendorId: uploadResult.vendorId,
        folderName: uploadResult.folderName,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error('Error uploading gallery image to ImageKit:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload gallery image to ImageKit',
      details: error.message
    });
  }
});

/**
 * Upload transformation image to ImageKit.io
 * POST /api/imagekit/upload-transformation
 */
router.post('/upload-transformation', async (req, res) => {
  try {
    const { vendorEmail, imageData, imageType } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!imageData || !vendorEmail || !imageType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorEmail, imageData, imageType'
      });
    }
    
    if (!['before', 'after'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid imageType. Must be "before" or "after"'
      });
    }
    
    console.log(`[ImageKit API] Uploading ${imageType} transformation image for vendor ${vendorEmail}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadTransformationImage(imageData, vendorEmail, imageType);
    
    console.log(`Successfully uploaded ${imageType} transformation image to ImageKit for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: `${imageType} transformation image uploaded successfully to ImageKit`,
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        imageType: uploadResult.imageType,
        vendorId: uploadResult.vendorId,
        folderName: uploadResult.folderName,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error(`Error uploading ${req.body.imageType || 'transformation'} image to ImageKit:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload transformation image to ImageKit',
      details: error.message
    });
  }
});

/**
 * Upload profile picture to ImageKit.io
 * POST /api/imagekit/upload-profile
 */
router.post('/upload-profile', async (req, res) => {
  try {
    const { vendorEmail, imageData } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!imageData || !vendorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorEmail, imageData'
      });
    }
    
    console.log(`[ImageKit API] Uploading profile picture for vendor ${vendorEmail}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadProfilePicture(imageData, vendorEmail);
    
    console.log(`Successfully uploaded profile picture to ImageKit for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully to ImageKit',
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        vendorId: uploadResult.vendorId,
        folderName: uploadResult.folderName,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error('Error uploading profile picture to ImageKit:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture to ImageKit',
      details: error.message
    });
  }
});

/**
 * Upload staff profile image to ImageKit.io
 * POST /api/imagekit/upload-staff
 */
router.post('/upload-staff', async (req, res) => {
  try {
    const { vendorEmail, imageData, staffId } = req.body;
    
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not properly configured. Please add IMAGEKIT_PRIVATE_KEY to environment variables.'
      });
    }
    
    if (!imageData || !vendorEmail || !staffId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorEmail, imageData, staffId'
      });
    }
    
    console.log(`[ImageKit API] Uploading staff image for vendor ${vendorEmail}, staff ID ${staffId}`);
    
    // Upload to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadStaffImage(imageData, vendorEmail, staffId);
    
    console.log(`Successfully uploaded staff image to ImageKit for vendor ${vendorEmail}, staff ID ${staffId}`);
    
    res.json({
      success: true,
      message: 'Staff image uploaded successfully to ImageKit',
      data: {
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size,
        staffId: uploadResult.staffId,
        vendorId: uploadResult.vendorId,
        folderName: uploadResult.folderName,
        storageType: 'imagekit',
        cdnUrl: uploadResult.url
      }
    });
    
  } catch (error) {
    console.error('Error uploading staff image to ImageKit:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload staff image to ImageKit',
      details: error.message
    });
  }
});

/**
 * Get ImageKit service status
 * GET /api/imagekit/status
 */
router.get('/status', (req, res) => {
  try {
    const configured = imagekitService.isConfigured();
    
    res.json({
      success: true,
      configured: configured,
      message: configured 
        ? 'ImageKit service is properly configured'
        : 'ImageKit service requires IMAGEKIT_PRIVATE_KEY environment variable'
    });
  } catch (error) {
    console.error('Error checking ImageKit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check ImageKit status'
    });
  }
});

module.exports = router; 