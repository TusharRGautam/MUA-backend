const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Local storage configuration
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
const BASE_URL = 'http://localhost:3000/static/uploads';

// Ensure upload directories exist
const FOLDERS = {
  SERVICE_IMAGES: 'services',
  ICON_IMAGES: 'icons', 
  PRODUCT_IMAGES: 'products'
};

class LocalImageService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Create main upload directory
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      // Create subdirectories
      for (const folderName of Object.values(FOLDERS)) {
        const folderPath = path.join(UPLOAD_DIR, folderName);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }

      this.initialized = true;
      console.log('Local image service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local image service:', error);
      throw error;
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, folderType) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get the appropriate folder name
      const folderName = FOLDERS[folderType];
      if (!folderName) {
        throw new Error(`Invalid folder type: ${folderType}`);
      }

      // Generate unique filename with timestamp and hash
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseName}_${timestamp}_${hash}${fileExtension}`;

      // Full file path
      const filePath = path.join(UPLOAD_DIR, folderName, uniqueFileName);

      // Write file to disk
      fs.writeFileSync(filePath, fileBuffer);

      // Generate public URL
      const publicLink = `${BASE_URL}/${folderName}/${uniqueFileName}`;

      console.log(`File uploaded locally: ${uniqueFileName}`);

      return {
        fileId: uniqueFileName, // Use filename as ID for local storage
        fileName: uniqueFileName,
        publicLink: publicLink,
        webViewLink: publicLink,
        localPath: filePath
      };

    } catch (error) {
      console.error('Error uploading file locally:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Find and delete the file
      let deleted = false;
      for (const folderName of Object.values(FOLDERS)) {
        const filePath = path.join(UPLOAD_DIR, folderName, fileId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted = true;
          console.log(`File deleted locally: ${fileId}`);
          break;
        }
      }

      if (!deleted) {
        throw new Error(`File not found: ${fileId}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting local file:', error);
      throw error;
    }
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
      default:
        throw new Error(`Unknown upload type: ${uploadType}`);
    }
  }

  // Check if a link is a local storage link
  static isLocalLink(url) {
    return url.includes('/static/uploads/');
  }

  // Extract file ID from local link
  static extractFileIdFromLink(publicLink) {
    const match = publicLink.match(/\/static\/uploads\/[^\/]+\/(.+)$/);
    return match ? match[1] : null;
  }
}

// Create a singleton instance
const localImageService = new LocalImageService();

module.exports = localImageService; 