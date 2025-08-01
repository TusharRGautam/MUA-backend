const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');
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

// ImageKit Configuration for Vendor Verification Documents
// Documents will be organized in folders by vendor ID

/**
 * Test endpoint to check vendor existence and ImageKit status
 * GET /api/vendor-identity/test-vendor/:email
 */
router.get('/test-vendor/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Check ImageKit status
    const imagekitStatus = imagekitService.isConfigured();
    
    // Check if vendor exists
    const vendorResult = await query(
      'SELECT sr_no, person_name, business_email FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    const vendorExists = vendorResult.rows.length > 0;
    const vendorData = vendorExists ? vendorResult.rows[0] : null;
    
    res.json({
      success: true,
      imagekit: {
        configured: imagekitStatus,
        ready: imagekitService.isImageKitReady ? imagekitService.isImageKitReady() : false
      },
      vendor: {
        exists: vendorExists,
        data: vendorData
      },
      endpoint: '/api/vendor-identity/upload-document',
      message: imagekitStatus && vendorExists ? 'Ready for upload' : 'Not ready for upload'
    });
    
  } catch (error) {
    console.error('Error in test-vendor endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test vendor status',
      details: error.message
    });
  }
});

/**
 * Upload vendor identity document to ImageKit.io
 * POST /api/vendor-identity/upload-document
 */
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    const { documentType, vendorEmail, vendorName } = req.body;
    
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

    // Check if ImageKit is configured
    if (!imagekitService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'ImageKit service is not configured. Please check environment variables.'
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
    
    console.log(`🚀 Uploading ${documentType} document to ImageKit for vendor ${vendorId}`);
    
    // Upload directly to ImageKit with WebP conversion
    const uploadResult = await imagekitService.uploadVerificationDocument(
      req.file.path, // File path
      documentType,
      vendorId,
      vendorEmail
    );
    
    console.log(`✅ ${documentType} uploaded successfully to ImageKit:`, uploadResult.url);
    
    // Update database with ImageKit CDN URL
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
      // Both documents uploaded, set verification status to pending
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
        cdnUrl: uploadResult.url,
        documentType: documentType,
        storageType: 'imagekit',
        size: uploadResult.size,
        name: uploadResult.name
      }
    });
    
  } catch (error) {
    console.error('Error uploading document to ImageKit:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload document to ImageKit';
    let statusCode = 500;
    
    if (error.message.includes('ImageKit service is not initialized')) {
      errorMessage = 'ImageKit service not configured. Please check environment variables.';
      statusCode = 503;
    } else if (error.message.includes('Vendor not found')) {
      errorMessage = 'Vendor account not found. Please ensure you are registered.';
      statusCode = 404;
    } else if (error.message.includes('ImageKit upload failed')) {
      errorMessage = 'Image upload to ImageKit failed. Please try again.';
      statusCode = 500;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      vendorEmail: req.body.vendorEmail,
      documentType: req.body.documentType
    });
  }
});

/**
 * Update vendor identity documents (Aadhaar and PAN card URLs)
 * PUT /api/vendor-identity/update
 */
router.put('/update', authenticateToken, async (req, res) => {
  const { aadhaarCardUrl, panCardUrl } = req.body;
  const vendorId = req.user.id; // From auth middleware
  
  try {
    // Update the vendor record with the new identity document URLs
    const updateQuery = `
      UPDATE registration_and_other_details
      SET 
        verify_aadharcard_url = $1,
        verify_pancard_url = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE sr_no = $3
      RETURNING sr_no;
    `;
    
    const result = await query(updateQuery, [
      aadhaarCardUrl || null,
      panCardUrl || null,
      vendorId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Identity document URLs updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor identity document URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update identity document URLs'
    });
  }
});

/**
 * Get vendor identity documents
 * GET /api/vendor-identity/documents
 */
router.get('/documents', authenticateToken, async (req, res) => {
  const vendorId = req.user.id; // From auth middleware
  
  try {
    const documentQuery = `
      SELECT 
        verify_aadharcard_url,
        verify_pancard_url
      FROM registration_and_other_details
      WHERE sr_no = $1;
    `;
    
    const result = await query(documentQuery, [vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const documents = result.rows[0];
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error retrieving vendor identity documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve identity documents'
    });
  }
});

/**
 * Get vendor identity documents by email
 * GET /api/vendor-identity/documents-by-email
 */
router.get('/documents-by-email', async (req, res) => {
  const { email } = req.query;
  
  console.log(`[DOCS API] Checking documents for email: ${email}`);
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }
  
  try {
    const documentQuery = `
      SELECT 
        verify_aadharcard_url,
        verify_pancard_url,
        person_name,
        sr_no,
        verification_status,
        vendor_status
      FROM registration_and_other_details
      WHERE business_email = $1;
    `;
    
    const result = await query(documentQuery, [email]);
    
    console.log(`[DOCS API] Query result for ${email}:`, result.rows);
    
    if (result.rows.length === 0) {
      console.log(`[DOCS API] No vendor found for email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const documents = result.rows[0];
    
    console.log(`[DOCS API] Documents found:`, {
      aadhaar: !!documents.verify_aadharcard_url,
      pan: !!documents.verify_pancard_url,
      name: documents.person_name,
      verification_status: documents.verification_status,
      vendor_status: documents.vendor_status
    });
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('[DOCS API] Error retrieving vendor identity documents by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve identity documents'
    });
  }
});

/**
 * Get vendor verification status by email
 * GET /api/vendor-identity/verification-status
 */
router.get('/verification-status', async (req, res) => {
  const { email } = req.query;
  
  console.log(`[VERIFICATION API] Checking verification status for email: ${email}`);
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }
  
  try {
    const statusQuery = `
      SELECT 
        verification_status,
        vendor_status,
        status_updated_at,
        aadhaar_card,
        pan_card
      FROM registration_and_other_details
      WHERE business_email = $1;
    `;
    
    const result = await query(statusQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log(`[VERIFICATION API] No vendor found for email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const status = result.rows[0];
    const hasDocuments = !!(status.aadhaar_card && status.pan_card);
    
    console.log(`[VERIFICATION API] Status for ${email}:`, {
      verification_status: status.verification_status,
      vendor_status: status.vendor_status,
      has_documents: hasDocuments,
      status_updated_at: status.status_updated_at
    });
    
    res.json({
      success: true,
      data: {
        verification_status: status.verification_status || 'pending',
        vendor_status: status.vendor_status || 'inactive',
        has_documents: hasDocuments,
        status_updated_at: status.status_updated_at
      }
    });
  } catch (error) {
    console.error('[VERIFICATION API] Error retrieving verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve verification status'
    });
  }
});

/**
 * Test endpoint to check if routes are working
 * GET /api/vendor-identity/test
 */
router.get('/test', (req, res) => {
  console.log('[TEST] Vendor identity routes are working');
  res.json({
    success: true,
    message: 'Vendor identity routes are working',
    timestamp: new Date().toISOString()
  });
});

/**
 * Validate identity document format
 * POST /api/vendor-identity/validate
 */
router.post('/validate', async (req, res) => {
  const { aadhaarCard, panCard } = req.body;
  
  const errors = {};
  
  // Validate Aadhaar card (if provided)
  if (aadhaarCard !== undefined) {
    // Aadhaar should be 12 digits
    if (!aadhaarCard) {
      errors.aadhaarCard = 'Aadhaar card number cannot be empty';
    } else if (!/^\d{12}$/.test(aadhaarCard)) {
      errors.aadhaarCard = 'Aadhaar card number must be exactly 12 digits';
    }
  }
  
  // Validate PAN card (if provided)
  if (panCard !== undefined) {
    // PAN should be 10 characters: 5 letters, 4 digits, 1 letter
    if (!panCard) {
      errors.panCard = 'PAN card number cannot be empty';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard)) {
      errors.panCard = 'PAN card number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)';
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }
  
  res.json({
    success: true,
    message: 'Identity documents are valid'
  });
});

module.exports = router; 