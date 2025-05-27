const googleDriveService = require('./googleDriveService');
const localImageService = require('./localImageService');

class HybridImageService {
  constructor() {
    this.preferredService = 'google-drive'; // or 'local'
    this.googleDriveAvailable = null; // null = unknown, true/false = tested
  }

  async testGoogleDriveAvailability() {
    try {
      console.log('Testing Google Drive availability...');
      
      // Try to initialize Google Drive service
      await googleDriveService.initialize();
      
      // Try a simple test upload
      const testBuffer = Buffer.from('test');
      const result = await googleDriveService.uploadFile(
        testBuffer,
        'test-availability.txt',
        'text/plain',
        'SERVICE_IMAGES'
      );
      
      // If successful, clean up the test file
      await googleDriveService.deleteFile(result.fileId);
      
      this.googleDriveAvailable = true;
      console.log('✅ Google Drive is available and working');
      return true;
      
    } catch (error) {
      console.warn('❌ Google Drive is not available:', error.message);
      this.googleDriveAvailable = false;
      return false;
    }
  }

  async initialize() {
    try {
      // Test Google Drive availability
      const googleDriveWorking = await this.testGoogleDriveAvailability();
      
      if (googleDriveWorking) {
        console.log('Using Google Drive as primary storage service');
        this.preferredService = 'google-drive';
      } else {
        console.log('Falling back to local storage service');
        this.preferredService = 'local';
        await localImageService.initialize();
      }
      
      console.log('Hybrid image service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hybrid image service:', error);
      // Final fallback to local storage
      this.preferredService = 'local';
      await localImageService.initialize();
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, folderType) {
    try {
      if (this.preferredService === 'google-drive' && this.googleDriveAvailable) {
        try {
          const result = await googleDriveService.uploadFile(fileBuffer, fileName, mimeType, folderType);
          console.log('✅ File uploaded to Google Drive');
          return {
            ...result,
            storageType: 'google-drive'
          };
        } catch (error) {
          console.warn('Google Drive upload failed, falling back to local storage:', error.message);
          this.googleDriveAvailable = false;
          this.preferredService = 'local';
        }
      }
      
      // Use local storage (either as preference or fallback)
      const result = await localImageService.uploadFile(fileBuffer, fileName, mimeType, folderType);
      console.log('✅ File uploaded to local storage');
      return {
        ...result,
        storageType: 'local'
      };
      
    } catch (error) {
      console.error('Error uploading file with hybrid service:', error);
      throw error;
    }
  }

  async deleteFile(fileId, storageType = null) {
    try {
      // If storage type is specified, use that service directly
      if (storageType === 'google-drive') {
        return await googleDriveService.deleteFile(fileId);
      } else if (storageType === 'local') {
        return await localImageService.deleteFile(fileId);
      }
      
      // Auto-detect storage type based on file ID or try both
      if (this.isGoogleDriveFileId(fileId)) {
        try {
          return await googleDriveService.deleteFile(fileId);
        } catch (error) {
          console.warn('Failed to delete from Google Drive, trying local storage');
        }
      }
      
      // Try local storage
      return await localImageService.deleteFile(fileId);
      
    } catch (error) {
      console.error('Error deleting file with hybrid service:', error);
      throw error;
    }
  }

  // Helper method to detect Google Drive file IDs
  isGoogleDriveFileId(fileId) {
    // Google Drive file IDs are typically 33 characters long and alphanumeric with dashes/underscores
    return /^[a-zA-Z0-9_-]{25,}$/.test(fileId);
  }

  // Helper method to detect storage type from public link
  detectStorageType(publicLink) {
    if (publicLink.includes('drive.google.com')) {
      return 'google-drive';
    } else if (publicLink.includes('/static/uploads/')) {
      return 'local';
    }
    return 'unknown';
  }

  // Extract file ID from any type of link
  extractFileIdFromLink(publicLink) {
    const storageType = this.detectStorageType(publicLink);
    
    if (storageType === 'google-drive') {
      // Use Google Drive extraction logic
      const patterns = [
        /\/uc\?id=([a-zA-Z0-9_-]+)/,
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/
      ];
      
      for (const pattern of patterns) {
        const match = publicLink.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    } else if (storageType === 'local') {
      return localImageService.constructor.extractFileIdFromLink(publicLink);
    }
    
    return null;
  }

  // Check if a URL is from this service
  isServiceLink(url) {
    return this.detectStorageType(url) !== 'unknown';
  }

  // Get current service status
  getStatus() {
    return {
      preferredService: this.preferredService,
      googleDriveAvailable: this.googleDriveAvailable,
      localStorageAvailable: true // Local storage should always be available
    };
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
}

// Create a singleton instance
const hybridImageService = new HybridImageService();

module.exports = hybridImageService; 