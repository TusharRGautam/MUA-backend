const imagekitService = require('./imagekitService');
const localImageService = require('./localImageService');

class HybridImageService {
  constructor() {
    this.preferredService = 'imagekit'; // or 'local'
    this.imagekitAvailable = null; // null = unknown, true/false = tested
  }

  async testImageKitAvailability() {
    try {
      console.log('Testing ImageKit availability...');
      
      // Try to initialize ImageKit service
      await imagekitService.initialize();
      
      // Try a simple test upload
      const testBuffer = Buffer.from('test');
      const result = await imagekitService.uploadFile(
        testBuffer,
        'test-availability.txt',
        'text/plain',
        'SERVICE_IMAGES'
      );
      
      // If successful, clean up the test file
      await imagekitService.deleteFile(result.fileId);
      
      this.imagekitAvailable = true;
      console.log('✅ ImageKit is available and working');
      return true;
      
    } catch (error) {
      console.warn('❌ ImageKit is not available:', error.message);
      this.imagekitAvailable = false;
      return false;
    }
  }

  async initialize() {
    try {
      // Test ImageKit availability
      const imagekitWorking = await this.testImageKitAvailability();
      
      if (imagekitWorking) {
        console.log('Using ImageKit as primary storage service');
        this.preferredService = 'imagekit';
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
      if (this.preferredService === 'imagekit' && this.imagekitAvailable) {
        try {
          const result = await imagekitService.uploadFile(fileBuffer, fileName, mimeType, folderType);
          console.log('✅ File uploaded to ImageKit');
          return {
            ...result,
            storageType: 'imagekit'
          };
        } catch (error) {
          console.warn('ImageKit upload failed, falling back to local storage:', error.message);
          this.imagekitAvailable = false;
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
      if (storageType === 'imagekit') {
        return await imagekitService.deleteFile(fileId);
      } else if (storageType === 'local') {
        return await localImageService.deleteFile(fileId);
      }
      
      // Auto-detect storage type based on file ID or try both
      if (this.isImageKitFileId(fileId)) {
        try {
          return await imagekitService.deleteFile(fileId);
        } catch (error) {
          console.warn('Failed to delete from ImageKit, trying local storage');
        }
      }
      
      // Try local storage
      return await localImageService.deleteFile(fileId);
      
    } catch (error) {
      console.error('Error deleting file with hybrid service:', error);
      throw error;
    }
  }

  // Helper method to detect ImageKit file IDs
  isImageKitFileId(fileId) {
    // ImageKit file IDs are typically alphanumeric strings
    return /^[a-zA-Z0-9_-]{10,}$/.test(fileId);
  }

  // Helper method to detect storage type from public link
  detectStorageType(publicLink) {
    if (publicLink.includes('ik.imagekit.io') || (process.env.IMAGEKIT_URL_ENDPOINT && publicLink.includes(process.env.IMAGEKIT_URL_ENDPOINT))) {
      return 'imagekit';
    } else if (publicLink.includes('/static/uploads/')) {
      return 'local';
    }
    return 'unknown';
  }

  // Extract file ID from any type of link
  extractFileIdFromLink(publicLink) {
    const storageType = this.detectStorageType(publicLink);
    
    if (storageType === 'imagekit') {
      // Use ImageKit extraction logic
      return imagekitService.constructor.extractFileIdFromUrl(publicLink);
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
      imagekitAvailable: this.imagekitAvailable,
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