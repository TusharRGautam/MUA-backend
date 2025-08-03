const ImageKit = require('imagekit');
const { convertBase64ToWebPBuffer, convertBufferToWebP } = require('./imageConverter');
const fs = require('fs');
const path = require('path');

// ImageKit.io configuration
const IMAGEKIT_CONFIG = {
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_WwT6IgX7RU9OIEyR3pGYZ3b/3wA=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // This should be set in environment variables
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/xg6mmpnar",
};

// Initialize ImageKit instance only if private key is available
let imagekit = null;

const initializeImageKit = () => {
  if (!IMAGEKIT_CONFIG.privateKey) {
    console.warn('[ImageKit Service] IMAGEKIT_PRIVATE_KEY not found in environment variables. ImageKit service will be disabled.');
    return null;
  }

  try {
    imagekit = new ImageKit({
      publicKey: IMAGEKIT_CONFIG.publicKey,
      privateKey: IMAGEKIT_CONFIG.privateKey,
      urlEndpoint: IMAGEKIT_CONFIG.urlEndpoint,
    });
    console.log('[ImageKit Service] Initialized successfully');
    return imagekit;
  } catch (error) {
    console.error('[ImageKit Service] Failed to initialize:', error.message);
    return null;
  }
};

// Initialize on module load
const imagekitInstance = initializeImageKit();

// Export initialization status for other modules
const isImageKitReady = () => !!imagekit;

/**
 * Get authentication parameters for client-side upload
 */
const getAuthenticationParameters = () => {
  if (!imagekit) {
    throw new Error('ImageKit service is not initialized. Please check IMAGEKIT_PRIVATE_KEY environment variable.');
  }
  const authenticationParameters = imagekit.getAuthenticationParameters();
  return authenticationParameters;
};

/**
 * Upload image buffer to ImageKit.io
 * @param {Buffer} imageBuffer - Image buffer data
 * @param {string} fileName - File name
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImageBuffer = async (imageBuffer, fileName, options = {}) => {
  try {
    if (!imagekit) {
      throw new Error('ImageKit service is not initialized. Please check IMAGEKIT_PRIVATE_KEY environment variable.');
    }

    console.log('[ImageKit Service] Uploading buffer to ImageKit:', fileName);

    const uploadParams = {
      file: imageBuffer,
      fileName: fileName,
      folder: options.folder || '/verification-documents',
      tags: options.tags || [],
      useUniqueFileName: true,
      responseFields: ['fileId', 'url', 'name', 'size', 'filePath', 'tags'],
    };

    const result = await imagekit.upload(uploadParams);
    
    console.log('[ImageKit Service] Upload successful:', result.url);
    return result;

  } catch (error) {
    console.error('[ImageKit Service] Upload failed:', error);
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

/**
 * Upload verification document with WebP conversion
 * @param {string|Buffer} imageData - Image data (file path, base64, or buffer)
 * @param {string} documentType - Type of document ('aadhaar' or 'pan')
 * @param {string|number} vendorId - Vendor ID
 * @param {string} vendorEmail - Vendor email for identification
 * @returns {Promise<Object>} Upload result with CDN URL
 */
const uploadVerificationDocument = async (imageData, documentType, vendorId, vendorEmail) => {
  try {
    console.log(`[ImageKit Service] Processing ${documentType} document for vendor ${vendorId}`);

    let webpBuffer;

    // Handle different types of input data
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/') || imageData.startsWith('/9j/') || imageData.startsWith('iVBORw0KGgo')) {
        // Base64 data
        console.log('[ImageKit Service] Converting base64 to WebP');
        webpBuffer = await convertBase64ToWebPBuffer(imageData, {
          quality: 85,
          resize: true,
          width: 1600, // High resolution for document clarity
        });
      } else if (fs.existsSync(imageData)) {
        // File path
        console.log('[ImageKit Service] Converting file to WebP');
        const fileBuffer = fs.readFileSync(imageData);
        webpBuffer = await convertBufferToWebP(fileBuffer, {
          quality: 85,
          resize: true,
          width: 1600,
        });
      } else {
        throw new Error('Invalid image data format');
      }
    } else if (Buffer.isBuffer(imageData)) {
      // Buffer data
      console.log('[ImageKit Service] Converting buffer to WebP');
      webpBuffer = await convertBufferToWebP(imageData, {
        quality: 85,
        resize: true,
        width: 1600,
      });
    } else {
      throw new Error('Unsupported image data type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${documentType}_${vendorId}_${timestamp}.webp`;

    // Upload to ImageKit
    const uploadOptions = {
      folder: `/verification-documents/${vendorId}`,
      tags: ['verification', documentType, `vendor_${vendorId}`, vendorEmail],
    };

    const uploadResult = await uploadImageBuffer(webpBuffer, fileName, uploadOptions);

    return {
      success: true,
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      name: uploadResult.name,
      size: uploadResult.size,
      filePath: uploadResult.filePath,
      documentType,
      vendorId,
      storageType: 'imagekit',
    };

  } catch (error) {
    console.error(`[ImageKit Service] Failed to upload ${documentType} document:`, error);
    throw error;
  }
};

/**
 * Delete file from ImageKit
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<boolean>} Success status
 */
const deleteFile = async (fileId) => {
  try {
    if (!imagekit) {
      throw new Error('ImageKit service is not initialized. Please check IMAGEKIT_PRIVATE_KEY environment variable.');
    }

    console.log('[ImageKit Service] Deleting file:', fileId);
    await imagekit.deleteFile(fileId);
    console.log('[ImageKit Service] File deleted successfully');
    return true;
  } catch (error) {
    console.error('[ImageKit Service] Failed to delete file:', error);
    throw error;
  }
};

/**
 * Get optimized URL with transformations
 * @param {string} url - Original ImageKit URL
 * @param {Object} transformations - Transformation parameters
 * @returns {string} Optimized URL
 */
const getOptimizedUrl = (url, transformations = {}) => {
  try {
    if (!imagekit) {
      console.warn('[ImageKit Service] Service not initialized, returning original URL');
      return url;
    }

    if (!url.includes(IMAGEKIT_CONFIG.urlEndpoint)) {
      return url; // Not an ImageKit URL
    }

    const optimizedUrl = imagekit.url({
      src: url,
      transformation: [
        {
          width: transformations.width,
          height: transformations.height,
          quality: transformations.quality || 80,
          format: transformations.format || 'webp',
          crop: transformations.crop || 'maintain_ratio',
        },
      ],
    });

    return optimizedUrl;
  } catch (error) {
    console.warn('[ImageKit Service] Failed to generate optimized URL:', error);
    return url; // Return original URL as fallback
  }
};

/**
 * Create vendor folder name using the specified format
 * @param {number} vendorId - Vendor ID
 * @param {string} personName - Person name from registration_and_other_details
 * @param {string} businessName - Business name from registration_and_other_details
 * @param {string} businessType - Business type from registration_and_other_details
 * @returns {string} Formatted folder name
 */
const createVendorFolderName = (vendorId, personName, businessName, businessType) => {
  // Clean the names to remove special characters
  const cleanPersonName = personName ? personName.replace(/[^a-zA-Z0-9]/g, '') : 'Unknown';
  const cleanBusinessName = businessName ? businessName.replace(/[^a-zA-Z0-9]/g, '') : 'Business';
  const cleanBusinessType = businessType ? businessType.replace(/[^a-zA-Z0-9]/g, '') : 'general';
  
  return `${vendorId}_${cleanPersonName}_${cleanBusinessName}_${cleanBusinessType}`;
};

/**
 * Upload gallery image to ImageKit with vendor folder structure
 * @param {string|Buffer} imageData - Image data (file path, base64, or buffer)
 * @param {string} vendorEmail - Vendor email for identification
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with CDN URL
 */
const uploadGalleryImage = async (imageData, vendorEmail, options = {}) => {
  try {
    console.log(`[ImageKit Service] Processing gallery image for vendor ${vendorEmail}`);

    // Get vendor details from database
    const { query } = require('../db');
    const vendorResult = await query(
      'SELECT sr_no, person_name, business_name, business_type FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error('Vendor not found');
    }
    
    const vendor = vendorResult.rows[0];
    const folderName = createVendorFolderName(
      vendor.sr_no,
      vendor.person_name,
      vendor.business_name,
      vendor.business_type
    );

    let webpBuffer;

    // Handle different types of input data
    if (typeof imageData === 'string') {
      // Check if it's a data URL or base64 string
      if (imageData.startsWith('data:image/') || 
          imageData.startsWith('/9j/') || 
          imageData.startsWith('iVBORw0KGgo') ||
          imageData.startsWith('UklGR') ||  // WebP signature
          imageData.startsWith('R0lGOD') || // GIF signature
          /^[A-Za-z0-9+/]+=*$/.test(imageData.substring(0, 100))) { // General base64 pattern check
        // Base64 data
        console.log('[ImageKit Service] Converting base64 to WebP');
        webpBuffer = await convertBase64ToWebPBuffer(imageData, {
          quality: 85,
          resize: true,
          width: 1200, // Standard resolution for gallery images
        });
      } else if (fs.existsSync(imageData)) {
        // File path
        console.log('[ImageKit Service] Converting file to WebP');
        const fileBuffer = fs.readFileSync(imageData);
        webpBuffer = await convertBufferToWebP(fileBuffer, {
          quality: 85,
          resize: true,
          width: 1200,
        });
      } else {
        // If it doesn't match file path, try to treat as base64 anyway
        console.log('[ImageKit Service] Attempting to process as base64 data');
        try {
          webpBuffer = await convertBase64ToWebPBuffer(imageData, {
            quality: 85,
            resize: true,
            width: 1200,
          });
        } catch (base64Error) {
          console.error('[ImageKit Service] Failed to process as base64:', base64Error.message);
          throw new Error('Invalid image data format');
        }
      }
    } else if (Buffer.isBuffer(imageData)) {
      // Buffer data
      console.log('[ImageKit Service] Converting buffer to WebP');
      webpBuffer = await convertBufferToWebP(imageData, {
        quality: 85,
        resize: true,
        width: 1200,
      });
    } else {
      throw new Error('Unsupported image data type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `gallery_${vendor.sr_no}_${timestamp}.webp`;

    // Upload to ImageKit
    const uploadOptions = {
      folder: `/${folderName}/gallery`,
      tags: ['gallery', `vendor_${vendor.sr_no}`, vendorEmail, folderName],
    };

    const uploadResult = await uploadImageBuffer(webpBuffer, fileName, uploadOptions);

    return {
      success: true,
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      name: uploadResult.name,
      size: uploadResult.size,
      filePath: uploadResult.filePath,
      vendorId: vendor.sr_no,
      folderName,
      storageType: 'imagekit',
    };

  } catch (error) {
    console.error(`[ImageKit Service] Failed to upload gallery image:`, error);
    throw error;
  }
};

/**
 * Upload transformation image (before/after) to ImageKit with vendor folder structure
 * @param {string|Buffer} imageData - Image data (file path, base64, or buffer)
 * @param {string} vendorEmail - Vendor email for identification
 * @param {string} imageType - Type of image ('before' or 'after')
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with CDN URL
 */
const uploadTransformationImage = async (imageData, vendorEmail, imageType, options = {}) => {
  try {
    console.log(`[ImageKit Service] Processing ${imageType} transformation image for vendor ${vendorEmail}`);

    // Get vendor details from database
    const { query } = require('../db');
    const vendorResult = await query(
      'SELECT sr_no, person_name, business_name, business_type FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error('Vendor not found');
    }
    
    const vendor = vendorResult.rows[0];
    const folderName = createVendorFolderName(
      vendor.sr_no,
      vendor.person_name,
      vendor.business_name,
      vendor.business_type
    );

    let webpBuffer;

    // Handle different types of input data
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/') || imageData.startsWith('/9j/') || imageData.startsWith('iVBORw0KGgo')) {
        // Base64 data
        console.log('[ImageKit Service] Converting base64 to WebP');
        webpBuffer = await convertBase64ToWebPBuffer(imageData, {
          quality: 90,
          resize: true,
          width: 1024, // Good resolution for before/after comparisons
        });
      } else if (fs.existsSync(imageData)) {
        // File path
        console.log('[ImageKit Service] Converting file to WebP');
        const fileBuffer = fs.readFileSync(imageData);
        webpBuffer = await convertBufferToWebP(fileBuffer, {
          quality: 90,
          resize: true,
          width: 1024,
        });
      } else {
        throw new Error('Invalid image data format');
      }
    } else if (Buffer.isBuffer(imageData)) {
      // Buffer data
      console.log('[ImageKit Service] Converting buffer to WebP');
      webpBuffer = await convertBufferToWebP(imageData, {
        quality: 90,
        resize: true,
        width: 1024,
      });
    } else {
      throw new Error('Unsupported image data type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `transformation_${imageType}_${vendor.sr_no}_${timestamp}.webp`;

    // Upload to ImageKit
    const uploadOptions = {
      folder: `/${folderName}/transformations`,
      tags: ['transformation', imageType, `vendor_${vendor.sr_no}`, vendorEmail, folderName],
    };

    const uploadResult = await uploadImageBuffer(webpBuffer, fileName, uploadOptions);

    return {
      success: true,
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      name: uploadResult.name,
      size: uploadResult.size,
      filePath: uploadResult.filePath,
      imageType,
      vendorId: vendor.sr_no,
      folderName,
      storageType: 'imagekit',
    };

  } catch (error) {
    console.error(`[ImageKit Service] Failed to upload ${imageType} transformation image:`, error);
    throw error;
  }
};

/**
 * Upload profile picture to ImageKit with vendor folder structure
 * @param {string|Buffer} imageData - Image data (file path, base64, or buffer)
 * @param {string} vendorEmail - Vendor email for identification
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with CDN URL
 */
const uploadProfilePicture = async (imageData, vendorEmail, options = {}) => {
  try {
    console.log(`[ImageKit Service] Processing profile picture for vendor ${vendorEmail}`);

    // Get vendor details from database
    const { query } = require('../db');
    const vendorResult = await query(
      'SELECT sr_no, person_name, business_name, business_type FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error('Vendor not found');
    }
    
    const vendor = vendorResult.rows[0];
    const folderName = createVendorFolderName(
      vendor.sr_no,
      vendor.person_name,
      vendor.business_name,
      vendor.business_type
    );

    let webpBuffer;

    // Handle different types of input data
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/') || imageData.startsWith('/9j/') || imageData.startsWith('iVBORw0KGgo')) {
        // Base64 data
        console.log('[ImageKit Service] Converting base64 to WebP');
        webpBuffer = await convertBase64ToWebPBuffer(imageData, {
          quality: 90,
          resize: true,
          width: 512, // Square profile picture resolution
          height: 512,
        });
      } else if (fs.existsSync(imageData)) {
        // File path
        console.log('[ImageKit Service] Converting file to WebP');
        const fileBuffer = fs.readFileSync(imageData);
        webpBuffer = await convertBufferToWebP(fileBuffer, {
          quality: 90,
          resize: true,
          width: 512,
          height: 512,
        });
      } else {
        throw new Error('Invalid image data format');
      }
    } else if (Buffer.isBuffer(imageData)) {
      // Buffer data
      console.log('[ImageKit Service] Converting buffer to WebP');
      webpBuffer = await convertBufferToWebP(imageData, {
        quality: 90,
        resize: true,
        width: 512,
        height: 512,
      });
    } else {
      throw new Error('Unsupported image data type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `profile_${vendor.sr_no}_${timestamp}.webp`;

    // Upload to ImageKit
    const uploadOptions = {
      folder: `/${folderName}/profile`,
      tags: ['profile', `vendor_${vendor.sr_no}`, vendorEmail, folderName],
    };

    const uploadResult = await uploadImageBuffer(webpBuffer, fileName, uploadOptions);

    return {
      success: true,
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      name: uploadResult.name,
      size: uploadResult.size,
      filePath: uploadResult.filePath,
      vendorId: vendor.sr_no,
      folderName,
      storageType: 'imagekit',
    };

  } catch (error) {
    console.error(`[ImageKit Service] Failed to upload profile picture:`, error);
    throw error;
  }
};

/**
 * Upload staff profile image to ImageKit with vendor folder structure
 * @param {string|Buffer} imageData - Image data (file path, base64, or buffer)
 * @param {string} vendorEmail - Vendor email for identification
 * @param {number} staffId - Staff member ID
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with CDN URL
 */
const uploadStaffImage = async (imageData, vendorEmail, staffId, options = {}) => {
  try {
    console.log(`[ImageKit Service] Processing staff image for vendor ${vendorEmail}, staff ID ${staffId}`);

    // Get vendor details from database
    const { query } = require('../db');
    const vendorResult = await query(
      'SELECT sr_no, person_name, business_name, business_type FROM registration_and_other_details WHERE business_email = $1',
      [vendorEmail]
    );
    
    if (vendorResult.rows.length === 0) {
      throw new Error('Vendor not found');
    }
    
    const vendor = vendorResult.rows[0];
    const folderName = createVendorFolderName(
      vendor.sr_no,
      vendor.person_name,
      vendor.business_name,
      vendor.business_type
    );

    let webpBuffer;

    // Handle different types of input data
    if (typeof imageData === 'string') {
      // Check if it's a data URL or base64 string
      if (imageData.startsWith('data:image/') || 
          imageData.startsWith('/9j/') || 
          imageData.startsWith('iVBORw0KGgo') ||
          imageData.startsWith('UklGR') ||  // WebP signature
          imageData.startsWith('R0lGOD') || // GIF signature
          /^[A-Za-z0-9+/]+=*$/.test(imageData.substring(0, 100))) { // General base64 pattern check
        // Base64 data
        console.log('[ImageKit Service] Converting base64 to WebP');
        webpBuffer = await convertBase64ToWebPBuffer(imageData, {
          quality: 85,
          resize: true,
          width: 512, // Smaller size for staff profile images
        });
      } else if (fs.existsSync(imageData)) {
        // File path
        console.log('[ImageKit Service] Converting file to WebP');
        const fileBuffer = fs.readFileSync(imageData);
        webpBuffer = await convertBufferToWebP(fileBuffer, {
          quality: 85,
          resize: true,
          width: 512,
        });
      } else {
        // If it doesn't match file path, try to treat as base64 anyway
        console.log('[ImageKit Service] Attempting to process as base64 data');
        try {
          webpBuffer = await convertBase64ToWebPBuffer(imageData, {
            quality: 85,
            resize: true,
            width: 512,
          });
        } catch (base64Error) {
          console.error('[ImageKit Service] Failed to process as base64:', base64Error.message);
          throw new Error('Invalid image data format');
        }
      }
    } else if (Buffer.isBuffer(imageData)) {
      // Buffer data
      console.log('[ImageKit Service] Converting buffer to WebP');
      webpBuffer = await convertBufferToWebP(imageData, {
        quality: 85,
        resize: true,
        width: 512,
      });
    } else {
      throw new Error('Unsupported image data type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `staff_${staffId}_${vendor.sr_no}_${timestamp}.webp`;

    // Upload to ImageKit
    const uploadOptions = {
      folder: `/${folderName}/staff`,
      tags: ['staff', `staff_${staffId}`, `vendor_${vendor.sr_no}`, vendorEmail, folderName],
    };

    const uploadResult = await uploadImageBuffer(webpBuffer, fileName, uploadOptions);

    return {
      fileId: uploadResult.fileId,
      url: uploadResult.url,
      name: uploadResult.name,
      size: uploadResult.size,
      staffId,
      vendorId: vendor.sr_no,
      folderName,
      storageType: 'imagekit',
    };

  } catch (error) {
    console.error(`[ImageKit Service] Failed to upload staff image:`, error);
    throw error;
  }
};

/**
 * Check if ImageKit service is properly configured
 * @returns {boolean} Configuration status
 */
const isConfigured = () => {
  return !!(IMAGEKIT_CONFIG.publicKey && IMAGEKIT_CONFIG.privateKey && IMAGEKIT_CONFIG.urlEndpoint && imagekit);
};

module.exports = {
  getAuthenticationParameters,
  uploadImageBuffer,
  uploadVerificationDocument,
  uploadGalleryImage,
  uploadTransformationImage,
  uploadProfilePicture,
  uploadStaffImage,
  createVendorFolderName,
  deleteFile,
  getOptimizedUrl,
  isConfigured,
  isImageKitReady,
  imagekit, // Export the instance for advanced usage
}; 