const ImageKit = require('imagekit');
const path = require('path');

// Load environment variables
require('dotenv').config();

// ImageKit configuration from environment variables
const IMAGEKIT_CONFIG = {
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
};

// Folder structure for organizing uploads
const FOLDER_NAMES = {
  SERVICE_IMAGES: 'services',
  ICON_IMAGES: 'icons',
  PRODUCT_IMAGES: 'products',
  GALLERY_IMAGES: 'gallery',
  PROFILE_IMAGES: 'profiles',
  TRANSFORMATION_IMAGES: 'transformations',
  VERIFICATION_IMAGES: 'verification-documents',
  PRP_ICONS: 'prp-icons',
  PACKAGE_ICONS: 'package-icons',
  SALON_SERVICES: 'salon-services'
};

class ImageKitService {
  constructor() {
    this.imagekit = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Validate required environment variables
      if (!IMAGEKIT_CONFIG.publicKey || !IMAGEKIT_CONFIG.privateKey || !IMAGEKIT_CONFIG.urlEndpoint) {
        throw new Error('Missing required ImageKit credentials in environment variables. Please check IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.');
      }
      
      // Initialize ImageKit instance
      this.imagekit = new ImageKit(IMAGEKIT_CONFIG);
      
      this.initialized = true;
      console.log('ImageKit service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImageKit service:', error);
      throw error;
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, folderType) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get the appropriate folder name
      const folderName = FOLDER_NAMES[folderType];
      if (!folderName) {
        throw new Error(`Invalid folder type: ${folderType}`);
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;

      // Upload file to ImageKit
      const uploadResponse = await this.imagekit.upload({
        file: fileBuffer,
        fileName: uniqueFileName,
        folder: `/${folderName}`,
        useUniqueFileName: true,
        responseFields: ['fileId', 'url', 'name', 'filePath']
      });

      console.log(`File uploaded successfully to ImageKit: ${uniqueFileName} (ID: ${uploadResponse.fileId})`);

      return {
        fileId: uploadResponse.fileId,
        fileName: uploadResponse.name,
        publicLink: uploadResponse.url,
        webViewLink: uploadResponse.url,
        filePath: uploadResponse.filePath
      };

    } catch (error) {
      console.error('Error uploading file to ImageKit:', error);
      throw error;
    }
  }

  // Upload file with custom folder path (for salon services)
  async uploadFileToCustomPath(fileBuffer, fileName, mimeType, customFolderPath) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;

      // Ensure the folder path starts with a forward slash
      const folderPath = customFolderPath.startsWith('/') ? customFolderPath : `/${customFolderPath}`;

      // Upload file to ImageKit with custom folder path
      const uploadResponse = await this.imagekit.upload({
        file: fileBuffer,
        fileName: uniqueFileName,
        folder: folderPath,
        useUniqueFileName: true,
        responseFields: ['fileId', 'url', 'name', 'filePath']
      });

      console.log(`File uploaded successfully to ImageKit at ${folderPath}: ${uniqueFileName} (ID: ${uploadResponse.fileId})`);

      return {
        fileId: uploadResponse.fileId,
        fileName: uploadResponse.name,
        publicLink: uploadResponse.url,
        webViewLink: uploadResponse.url,
        filePath: uploadResponse.filePath
      };

    } catch (error) {
      console.error('Error uploading file to ImageKit with custom path:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.imagekit.deleteFile(fileId);

      console.log(`File deleted successfully from ImageKit: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting file from ImageKit:', error);
      throw error;
    }
  }

  // Upload gallery image with specific options
  async uploadGalleryImage(imageBuffer, vendorName, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const timestamp = Date.now();
      const fileName = `gallery_${vendorName}_${timestamp}.webp`;
      
      // Upload to gallery folder
      const uploadResponse = await this.imagekit.upload({
        file: imageBuffer,
        fileName: fileName,
        folder: `/gallery/${vendorName}`,
        useUniqueFileName: true,
        transformation: {
          pre: options.quality ? `q-${options.quality}` : 'q-80',
          post: options.width ? [{ width: options.width }] : []
        }
      });

      return {
        fileId: uploadResponse.fileId,
        publicUrl: uploadResponse.url,
        webViewLink: uploadResponse.url
      };

    } catch (error) {
      console.error('Error uploading gallery image to ImageKit:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(imageBuffer, vendorId, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const timestamp = Date.now();
      const fileName = `profile_${vendorId}_${timestamp}.webp`;
      
      const uploadResponse = await this.imagekit.upload({
        file: imageBuffer,
        fileName: fileName,
        folder: `/profiles`,
        useUniqueFileName: true,
        transformation: {
          pre: 'q-80,w-400,h-400,c-maintain_ratio'
        }
      });

      return {
        fileId: uploadResponse.fileId,
        webViewLink: uploadResponse.url,
        url: uploadResponse.url
      };

    } catch (error) {
      console.error('Error uploading profile picture to ImageKit:', error);
      throw error;
    }
  }

  // Upload transformation images (before/after)
  async uploadTransformationImage(imageBuffer, imageType, vendorName, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const timestamp = Date.now();
      const fileName = `transformation_${imageType}_${vendorName}_${timestamp}.webp`;
      
      const uploadResponse = await this.imagekit.upload({
        file: imageBuffer,
        fileName: fileName,
        folder: `/transformations/${vendorName}`,
        useUniqueFileName: true,
        transformation: {
          pre: 'q-80,w-1200,c-maintain_ratio'
        }
      });

      return {
        fileId: uploadResponse.fileId,
        webViewLink: uploadResponse.url,
        imageUrl: uploadResponse.url,
        driveFileId: uploadResponse.fileId
      };

    } catch (error) {
      console.error('Error uploading transformation image to ImageKit:', error);
      throw error;
    }
  }

  // Upload verification documents
  async uploadVerificationDocument(imageBuffer, vendorId, documentType, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const timestamp = Date.now();
      const fileName = `${documentType}_${vendorId}_${timestamp}.webp`;
      
      const uploadResponse = await this.imagekit.upload({
        file: imageBuffer,
        fileName: fileName,
        folder: `/verification-documents/${vendorId}`,
        useUniqueFileName: true,
        transformation: {
          pre: 'q-85,w-1500,c-maintain_ratio'
        }
      });

      return {
        fileId: uploadResponse.fileId,
        url: uploadResponse.url,
        webViewLink: uploadResponse.url
      };

    } catch (error) {
      console.error('Error uploading verification document to ImageKit:', error);
      throw error;
    }
  }

  // Upload buffer to ImageKit (generic method)
  async uploadBufferToDrive(buffer, fileName, mimeType, folderPath) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: fileName,
        folder: folderPath,
        useUniqueFileName: true
      });

      return {
        id: uploadResponse.fileId,
        webViewLink: uploadResponse.url,
        webContentLink: uploadResponse.url
      };

    } catch (error) {
      console.error('Error uploading buffer to ImageKit:', error);
      throw error;
    }
  }

  // Create folder (ImageKit handles folders automatically)
  async createFolder(folderName, parentFolderId = null) {
    // ImageKit automatically creates folders when uploading files
    // Return a mock folder ID for compatibility
    return folderName;
  }

  // Find or create user gallery folder
  async findOrCreateUserGalleryFolder(userName) {
    // ImageKit handles folder creation automatically
    return `/gallery/${userName}`;
  }

  // Helper method to get folder type based on upload context
  static getFolderType(uploadType) {
    switch (uploadType) {
      case 'service':
        return 'SERVICE_IMAGES';
      case 'icon':
        return 'ICON_IMAGES';
      case 'product':
        return 'PRODUCT_IMAGES';
      case 'gallery':
        return 'GALLERY_IMAGES';
      case 'profile':
        return 'PROFILE_IMAGES';
      case 'transformation':
        return 'TRANSFORMATION_IMAGES';
      case 'verification':
        return 'VERIFICATION_IMAGES';
      case 'prp-icon':
        return 'PRP_ICONS';
      case 'package-icon':
        return 'PACKAGE_ICONS';
      default:
        throw new Error(`Unknown upload type: ${uploadType}`);
    }
  }

  // Helper method to extract file ID from ImageKit URL
  static extractFileIdFromUrl(url) {
    if (!url) return null;
    
    // ImageKit URLs have the file ID in the path
    const match = url.match(/\/([a-zA-Z0-9_-]+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
  }

  // Check if URL is an ImageKit URL
  static isImageKitUrl(url) {
    if (!url) return false;
    return url.includes('ik.imagekit.io') || url.includes(process.env.IMAGEKIT_URL_ENDPOINT);
  }
}

// Create a singleton instance
const imagekitService = new ImageKitService();

module.exports = imagekitService; 