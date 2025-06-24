const express = require('express');
const router = express.Router();
const path = require('path');
const { google } = require('googleapis');
const { initializeDriveClient } = require('../utils/googleDriveService');

/**
 * Get Google Drive access token
 * POST /api/drive/token
 */
router.post('/token', async (req, res) => {
  try {
    console.log('🔑 Requesting Google Drive access token...');
    
    // Initialize the drive client to test authentication
    const drive = initializeDriveClient();
    
    // Get the auth client
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../googledrivejson/caretake-460910-86321148e3d9.json'),
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    // Get the access token
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    if (!accessToken.token) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate access token'
      });
    }
    
    console.log('✅ Google Drive access token generated successfully');
    
    res.json({
      success: true,
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: 3600 // 1 hour
    });
    
  } catch (error) {
    console.error('❌ Error generating Google Drive access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate access token',
      details: error.message
    });
  }
});

/**
 * Test Google Drive connection
 * GET /api/drive/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing Google Drive connection...');
    
    // Initialize the drive client
    const drive = initializeDriveClient();
    
    // Test by getting info about the root folder
    const response = await drive.about.get({ fields: 'user' });
    
    console.log('✅ Google Drive connection test successful');
    
    res.json({
      success: true,
      message: 'Google Drive service is working correctly',
      user: response.data.user?.emailAddress
    });
    
  } catch (error) {
    console.error('❌ Google Drive connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Google Drive connection test failed',
      details: error.message
    });
  }
});

module.exports = router; 