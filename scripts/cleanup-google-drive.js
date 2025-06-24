/**
 * Google Drive Cleanup Script
 * 
 * This script helps clean up old files from Google Drive to free up storage space
 * Run this when you get "storageQuotaExceeded" errors
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                      path.join(process.cwd(), 'googledrivejson', 'caretake-460910-86321148e3d9.json');

// Initialize Google Drive client
const initializeDriveClient = () => {
  try {
    console.log('Using Google Drive credentials from:', credentialsPath);
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Google Drive credentials file not found at: ${credentialsPath}`);
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });
    
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Error initializing Google Drive client:', error);
    throw error;
  }
};

/**
 * Get storage quota information
 */
const getStorageQuota = async (drive) => {
  try {
    const response = await drive.about.get({
      fields: 'storageQuota'
    });
    
    const quota = response.data.storageQuota;
    const used = parseInt(quota.usage) || 0;
    const limit = parseInt(quota.limit) || 0;
    const usageInApp = parseInt(quota.usageInDrive) || 0;
    
    console.log('\n📊 Storage Quota Information:');
    console.log(`Total Used: ${(used / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Drive Usage: ${(usageInApp / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Total Limit: ${(limit / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Available: ${((limit - used) / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Usage Percentage: ${((used / limit) * 100).toFixed(1)}%`);
    
    return { used, limit, usageInApp, available: limit - used };
  } catch (error) {
    console.error('Error getting storage quota:', error);
    return null;
  }
};

/**
 * List old files that can be cleaned up
 */
const listOldFiles = async (drive, daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();
    
    console.log(`\n🔍 Looking for files older than ${daysOld} days (before ${cutoffDate.toDateString()})...`);
    
    const response = await drive.files.list({
      q: `createdTime < '${cutoffISO}' and trashed = false`,
      fields: 'files(id, name, size, createdTime, mimeType)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });
    
    const files = response.data.files || [];
    let totalSize = 0;
    
    console.log(`\n📁 Found ${files.length} old files:`);
    files.forEach((file, index) => {
      const size = parseInt(file.size) || 0;
      totalSize += size;
      const sizeInMB = (size / 1024 / 1024).toFixed(2);
      const createdDate = new Date(file.createdTime).toDateString();
      
      console.log(`${index + 1}. ${file.name} (${sizeInMB} MB) - Created: ${createdDate}`);
    });
    
    console.log(`\nTotal size of old files: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    
    return files;
  } catch (error) {
    console.error('Error listing old files:', error);
    return [];
  }
};

/**
 * Delete a list of files
 */
const deleteFiles = async (drive, files) => {
  console.log(`\n🗑️ Deleting ${files.length} files...`);
  
  let deletedCount = 0;
  let totalSizeDeleted = 0;
  
  for (const file of files) {
    try {
      await drive.files.delete({
        fileId: file.id
      });
      
      const size = parseInt(file.size) || 0;
      totalSizeDeleted += size;
      deletedCount++;
      
      console.log(`✅ Deleted: ${file.name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      console.error(`❌ Failed to delete ${file.name}:`, error.message);
    }
  }
  
  console.log(`\n✅ Cleanup completed!`);
  console.log(`Files deleted: ${deletedCount}/${files.length}`);
  console.log(`Space freed: ${(totalSizeDeleted / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  return { deletedCount, totalSizeDeleted };
};

/**
 * Main cleanup function
 */
const cleanupGoogleDrive = async () => {
  try {
    console.log('🚀 Starting Google Drive Cleanup...\n');
    
    const drive = initializeDriveClient();
    
    // Get current storage quota
    await getStorageQuota(drive);
    
    // List old files (older than 30 days)
    const oldFiles = await listOldFiles(drive, 30);
    
    if (oldFiles.length === 0) {
      console.log('\n✅ No old files found to clean up.');
      return;
    }
    
    // Confirm deletion
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`\n⚠️ Do you want to delete these ${oldFiles.length} old files? (y/N): `, async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await deleteFiles(drive, oldFiles);
        
        // Show updated storage quota
        console.log('\n📊 Updated storage information:');
        await getStorageQuota(drive);
      } else {
        console.log('❌ Cleanup cancelled.');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupGoogleDrive();
}

module.exports = {
  cleanupGoogleDrive,
  getStorageQuota,
  listOldFiles,
  deleteFiles
}; 