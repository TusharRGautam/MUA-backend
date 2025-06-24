const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const { initializeDriveClient, findOrCreateUserGalleryFolder, findOrCreateVendorFolder, uploadFile } = require('../utils/googleDriveService');
const hybridStorageService = require('../utils/hybridStorageService');

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

// Google Drive Configuration
const VENDOR_VERIFICATION_PARENT_FOLDER_ID = '138_pMybW5nDv-JLiveyoMAtleRa6-E8t'; // From the provided URL

// Using the imported initializeDriveClient from googleDriveService.js

// Using the imported findOrCreateVendorFolder from googleDriveService.js

// Using the imported uploadFile from googleDriveService.js

/**
 * Upload vendor identity document
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
    
    // Create or find vendor folder in Google Drive
    const sanitizedName = vendorName.replace(/[^a-zA-Z0-9_\s]/g, '').replace(/\s+/g, '_');
    const folderName = `${sanitizedName}_${vendorId}_VerificationDocs`;
    const folderId = await findOrCreateVendorFolder(folderName, vendorId);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${documentType}_${vendorId}_${timestamp}${fileExtension}`;
    
    // Upload file using hybrid storage service (handles quota issues automatically)
    console.log(`🔄 Uploading ${documentType} document using hybrid storage...`);
    
    // Read file buffer for hybrid upload
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Initialize hybrid storage if not already done
    await hybridStorageService.initialize();
    
    // Upload using hybrid service (will fallback to local if Google Drive quota exceeded)
    const uploadResult = await hybridStorageService.uploadFile(
      fileBuffer,
      fileName,
      req.file.mimetype,
      'VENDOR_DOCUMENTS'
    );
    
    console.log(`✅ ${documentType} uploaded successfully via ${uploadResult.storageType} storage`);
    
    // For compatibility, ensure we have the required fields
    const finalUploadResult = {
      id: uploadResult.fileId || uploadResult.id,
      webViewLink: uploadResult.publicUrl || uploadResult.webViewLink || uploadResult.url,
      fileId: uploadResult.fileId || uploadResult.id,
      storageType: uploadResult.storageType
    };
    
    // Update database with the uploaded file link and check if both documents are uploaded
    const columnName = documentType === 'aadhaar' ? 'aadhaar_card' : 'pan_card';
    const updateQuery = `
      UPDATE registration_and_other_details 
      SET ${columnName} = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE business_email = $2 
      RETURNING sr_no, aadhaar_card, pan_card
    `;
    
    const updateResult = await query(updateQuery, [finalUploadResult.webViewLink, vendorEmail]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update vendor record'
      });
    }

    // Check if both documents are now uploaded and update verification status
    const vendorData = updateResult.rows[0];
    const hasAadhaar = vendorData.aadhaar_card && vendorData.aadhaar_card.trim() !== '';
    const hasPan = vendorData.pan_card && vendorData.pan_card.trim() !== '';
    
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
    
    console.log(`Successfully uploaded ${documentType} for vendor ${vendorEmail}`);
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully via ${finalUploadResult.storageType} storage`,
      data: {
        fileId: finalUploadResult.fileId,
        webViewLink: finalUploadResult.webViewLink,
        documentType: documentType,
        storageType: finalUploadResult.storageType
      }
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
});

/**
 * Update vendor identity documents (Aadhaar and PAN card)
 * PUT /api/vendor-identity/update
 */
router.put('/update', authenticateToken, async (req, res) => {
  const { aadhaarCard, panCard } = req.body;
  const vendorId = req.user.id; // From auth middleware
  
  try {
    // Update the vendor record with the new identity document information
    const updateQuery = `
      UPDATE registration_and_other_details
      SET 
        aadhaar_card = $1,
        pan_card = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE sr_no = $3
      RETURNING sr_no;
    `;
    
    const result = await query(updateQuery, [
      aadhaarCard || null,
      panCard || null,
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
      message: 'Identity documents updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor identity documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update identity documents'
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
        aadhaar_card,
        pan_card
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
        aadhaar_card,
        pan_card,
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
      aadhaar: !!documents.aadhaar_card,
      pan: !!documents.pan_card,
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