/**
 * User Controller
 * 
 * Handles user-related operations including profile picture uploads
 */

const { convertToWebP, convertBase64ToWebP } = require('../utils/imageConverter');
const googleDriveService = require('../utils/googleDriveService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const crypto = require('crypto');

// Configure multer storage for temporary file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profile_${randomString}${extension}`);
  }
});

// Create the multer upload instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('image');

/**
 * Find or create a profile pictures folder for a specific user
 * 
 * @param {string} personName - Name of the person
 * @param {string} srNo - Serial number of the business
 * @param {string} businessType - Type of business
 * @returns {Promise<string>} - ID of the folder
 */
const findOrCreateProfilePictureFolder = async (personName, srNo, businessType) => {
  try {
    // Sanitize the name for use in folder name
    const sanitizedName = personName.replace(/[^a-zA-Z0-9_]/g, '_');
    const folderName = `${sanitizedName}_${srNo}_${businessType}_profilepictures`;
    
    // Google Drive parent folder ID from the provided URL
    const PROFILE_PARENT_FOLDER_ID = '17TUlUxYe-eqeuc1D_0kVnhPJQiEhBWr0';
    
    // Try to find the folder using the parent folder ID
    const folderId = await googleDriveService.findFolder(folderName, PROFILE_PARENT_FOLDER_ID);
    if (folderId) {
      return folderId;
    }
    
    // Create the folder if it doesn't exist
    return await googleDriveService.createFolder(folderName, PROFILE_PARENT_FOLDER_ID);
  } catch (error) {
    console.error(`Error finding or creating profile picture folder:`, error);
    throw error;
  }
};

/**
 * Upload a profile picture
 * 
 * This function handles:
 * 1. Receiving the uploaded image
 * 2. Converting it to WebP format
 * 3. Creating a vendor-specific folder in Google Drive if it doesn't exist
 * 4. Uploading the WebP image to Google Drive
 * 5. Updating the profile_picture URL in the database
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadProfilePicture = (req, res) => {
  upload(req, res, async (err) => {
    try {
      console.log('[uploadProfilePicture] Starting profile picture upload');
      
      if (err) {
        console.error('[uploadProfilePicture] Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }
      
      const vendorEmail = req.body.vendorEmail;
      
      if (!vendorEmail) {
        return res.status(400).json({
          success: false,
          message: 'Vendor email is required'
        });
      }
      
      console.log(`[uploadProfilePicture] Processing upload for vendor: ${vendorEmail}`);
      
      // Check if we have a file from multer
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }
      
      const uploadedFilePath = req.file.path;
      console.log(`[uploadProfilePicture] Uploaded file path: ${uploadedFilePath}`);
      
      // 1. First get vendor details to create proper folder name
      const vendorResult = await query(
        'SELECT sr_no, person_name, business_type FROM registration_and_other_details WHERE business_email = $1',
        [vendorEmail]
      );
      
      if (vendorResult.rows.length === 0) {
        fs.unlinkSync(uploadedFilePath); // Clean up the uploaded file
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
      
      const vendor = vendorResult.rows[0];
      const folderName = `${vendor.person_name}_${vendor.sr_no}_${vendor.business_type}_profilepictures`;
      
      console.log(`[uploadProfilePicture] Target folder name: ${folderName}`);
      
      // 2. Convert the uploaded image to WebP format
      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'uploads', 'processed');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputWebpPath = path.join(outputDir, `${path.basename(uploadedFilePath, path.extname(uploadedFilePath))}.webp`);
      
      console.log(`[uploadProfilePicture] Converting to WebP: ${outputWebpPath}`);
      
      // Use the same WebP conversion function used in transformations
      await convertToWebP(uploadedFilePath, outputWebpPath, {
        quality: 80,
        width: 800, // Reasonable size for profile pictures
      });
      
      // 3. Check if the Google Drive folder exists, create it if not
      const parentFolderId = '1KtLeEJafUzIOPyST4M3RFn4kn6u-12RU'; // New folder ID
      
      // Find or create the vendor's folder in Google Drive
      // First check if folder exists
      console.log(`[uploadProfilePicture] Checking if folder exists: ${folderName}`);
      let folderId;
      
      // Search for existing folder
      const folderResult = await googleDriveService.findFolder(folderName, parentFolderId);
      
      if (folderResult) {
        // Folder exists
        console.log(`[uploadProfilePicture] Found existing folder: ${folderName}`);
        folderId = folderResult;
      } else {
        // Create new folder
        console.log(`[uploadProfilePicture] Creating new folder: ${folderName}`);
        const createResult = await googleDriveService.createFolder(folderName, parentFolderId);
        
        if (!createResult) {
          throw new Error(`Failed to create Google Drive folder`);
        }
        
        folderId = createResult;
      }
      
      // 4. Upload the WebP file to Google Drive
      const fileName = `profile_${vendor.sr_no}_${Date.now()}.webp`;
      console.log(`[uploadProfilePicture] Uploading file: ${fileName}`);
      
      const uploadResult = await googleDriveService.uploadFile(
        outputWebpPath,
        fileName,
        'image/webp',
        folderId
      );
      
      if (!uploadResult || !uploadResult.webViewLink) {
        throw new Error(`Failed to upload file to Google Drive`);
      }
      
      // 5. Update the profile_picture URL in the database
      console.log(`[uploadProfilePicture] Updating database with file URL: ${uploadResult.webViewLink}`);
      
      const updateResult = await query(
        'UPDATE registration_and_other_details SET profile_picture = $2, updated_at = CURRENT_TIMESTAMP WHERE business_email = $1 RETURNING sr_no, business_email, person_name, business_type, business_name, phone_number, profile_picture, business_address, business_description, specialization, city, latitude, longitude',
        [vendorEmail, uploadResult.webViewLink]
      );
      
      // Clean up temporary files
      try {
        fs.unlinkSync(uploadedFilePath);
        fs.unlinkSync(outputWebpPath);
      } catch (cleanupError) {
        console.warn('[uploadProfilePicture] Error cleaning up temp files:', cleanupError);
      }
      
      // Return success response with the updated profile data
      return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: uploadResult.webViewLink,
        profile: updateResult.rows[0]
      });
      
    } catch (error) {
      console.error('[uploadProfilePicture] Error:', error);
      
      // Clean up any files if they exist
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('[uploadProfilePicture] Error cleaning up temp file:', cleanupError);
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'Server error processing profile picture',
        error: error.message
      });
    }
  });
};

// Export controller functions
module.exports = {
  uploadProfilePicture
}; 