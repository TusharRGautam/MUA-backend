/**
 * Hybrid Storage Service
 * 
 * Automatically switches between Google Drive and local storage
 * based on availability and quota limits
 */

const googleDriveService = require('./googleDriveService');
const localImageService = require('../src/utils/localImageService');
const fs = require('fs');
const path = require('path');

class HybridStorageService {
  constructor() {
    this.preferredService = 'google-drive'; // Default to Google Drive
    this.googleDriveAvailable = true;
    this.quotaExceeded = false;
  }

  /**
   * Test Google Drive availability and quota
   */
  async testGoogleDriveAvailability() {
    try {
      console.log('Testing Google Drive availability...');
      
      // Try to initialize Google Drive service
      await googleDriveService.initialize();
      
      // Try a simple test upload by creating a temp file
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(process.cwd(), 'temp');
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const testFilePath = path.join(tempDir, 'test-availability.txt');
      fs.writeFileSync(testFilePath, 'test');
      
      try {
        // Use the actual findOrCreateUserGalleryFolder to get a valid folder ID
        const folderId = await googleDriveService.findOrCreateUserGalleryFolder('test_user');
        
        const result = await googleDriveService.uploadFile(
          testFilePath,
          'test-availability.txt',
          'text/plain',
          folderId
        );
        
        // If successful, clean up both the test file and temp file
        await googleDriveService.deleteFile(result.id);
        fs.unlinkSync(testFilePath);
      } catch (uploadError) {
        // Clean up temp file even if upload fails
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
        throw uploadError;
      }
      
      this.googleDriveAvailable = true;
      this.quotaExceeded = false;
      console.log('✅ Google Drive is available and working');
      return true;
      
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error.status === 403 && (
          error.message.includes('storageQuotaExceeded') || 
          error.message.includes('Service Accounts do not have storage quota')
        )) {
        console.warn('❌ Google Drive quota exceeded, switching to local storage');
        this.quotaExceeded = true;
        this.googleDriveAvailable = false;
        this.preferredService = 'local';
      } else {
        console.warn('❌ Google Drive is not available:', error.message);
        this.googleDriveAvailable = false;
      }
      
      return false;
    }
  }

  /**
   * Initialize the hybrid storage service
   */
  async initialize() {
    await this.testGoogleDriveAvailability();
    
    if (!this.googleDriveAvailable) {
      console.log('🔄 Using local storage as primary storage method');
      this.preferredService = 'local';
    }
  }

  /**
   * Upload a file using the best available storage method
   */
  async uploadFile(fileBuffer, fileName, mimeType, folderType) {
    try {
      // Try Google Drive first if available and not quota exceeded
      if (this.preferredService === 'google-drive' && this.googleDriveAvailable && !this.quotaExceeded) {
        try {
          const result = await googleDriveService.uploadFile(fileBuffer, fileName, mimeType, folderType);
          console.log('✅ File uploaded to Google Drive');
          return {
            ...result,
            storageType: 'google-drive',
            publicUrl: result.webViewLink,
            fileId: result.id
          };
        } catch (error) {
          // Check if quota exceeded
          if (error.status === 403 && (
              error.message.includes('storageQuotaExceeded') || 
              error.message.includes('Service Accounts do not have storage quota')
            )) {
            console.warn('Google Drive quota exceeded, switching to local storage');
            this.quotaExceeded = true;
            this.googleDriveAvailable = false;
            this.preferredService = 'local';
          } else {
            console.warn('Google Drive upload failed, falling back to local storage:', error.message);
            this.googleDriveAvailable = false;
            this.preferredService = 'local';
          }
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

  /**
   * Upload buffer to storage
   */
  async uploadBuffer(buffer, fileName, mimeType, folderType) {
    return await this.uploadFile(buffer, fileName, mimeType, folderType);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileId, storageType = null) {
    try {
      // If storage type is specified, use it
      if (storageType === 'google-drive' && this.googleDriveAvailable) {
        return await googleDriveService.deleteFile(fileId);
      } else if (storageType === 'local') {
        return await localImageService.deleteFile(fileId);
      }
      
      // Otherwise, try both storage methods
      if (this.googleDriveAvailable) {
        try {
          return await googleDriveService.deleteFile(fileId);
        } catch (error) {
          console.warn('Failed to delete from Google Drive, trying local storage:', error.message);
        }
      }
      
      return await localImageService.deleteFile(fileId);
      
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get current storage status
   */
  getStorageStatus() {
    return {
      preferredService: this.preferredService,
      googleDriveAvailable: this.googleDriveAvailable,
      quotaExceeded: this.quotaExceeded,
      currentService: this.quotaExceeded ? 'local' : this.preferredService
    };
  }

  /**
   * Force switch to local storage
   */
  switchToLocalStorage() {
    this.preferredService = 'local';
    this.googleDriveAvailable = false;
    console.log('🔄 Switched to local storage mode');
  }

  /**
   * Try to re-enable Google Drive (after quota cleanup)
   */
  async retryGoogleDrive() {
    console.log('🔄 Retrying Google Drive connection...');
    const available = await this.testGoogleDriveAvailability();
    
    if (available) {
      this.preferredService = 'google-drive';
      console.log('✅ Google Drive re-enabled');
    }
    
    return available;
  }
}

// Create singleton instance
const hybridStorageService = new HybridStorageService();

module.exports = hybridStorageService; 