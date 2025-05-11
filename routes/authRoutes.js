const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

// Endpoint to get a new token - used primarily by the frontend
router.get('/token', async (req, res) => {
  try {
    // For testing purposes, we're using a dummy token
    // In a real app, this would verify credentials or refresh tokens
    const token = jwt.sign(
      { id: 1, role: 'vendor' },
      process.env.JWT_SECRET || 'mua-secret-key',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      message: 'Token generated successfully'
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token'
    });
  }
});

// Check if a token is valid - used by isAuthenticated()
router.get('/check', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        valid: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mua-secret-key'
    );
    
    // If verification didn't throw, token is valid
    res.json({
      valid: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.json({
      valid: false,
      message: 'Invalid token'
    });
  }
});

// Invalidate token (logout)
router.post('/invalidate-token', (req, res) => {
  // In a real app, you would add the token to a blacklist
  // For now, we just return success
  res.json({
    success: true,
    message: 'Token invalidated'
  });
});

/**
 * Token refresh endpoint
 * POST /api/auth/refresh-token
 */
router.post('/refresh-token', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required for refresh'
    });
  }
  
  try {
    // Try to decode token to get user info
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format'
      });
    }
    
    // Check if user exists
    const userQuery = 'SELECT sr_no, business_email, business_type FROM registration_and_other_details WHERE business_email = $1';
    const result = await query(userQuery, [decoded.email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    // Generate a fresh token
    const newToken = jwt.sign(
      { 
        id: user.sr_no, 
        email: user.business_email,
        role: 'business_owner', 
        business_type: user.business_type
      },
      process.env.JWT_SECRET || 'mua-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

module.exports = router; 