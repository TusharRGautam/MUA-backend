const jwt = require('jsonwebtoken');
const { query } = require('../db');

/**
 * Authentication middleware
 * Verifies the JWT token and attaches the user information to the request
 * This is crucial for vendor data isolation
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the user from the database to ensure they still exist
    const userResult = await query(
      'SELECT sr_no, business_email, person_name, business_type FROM registration_and_other_details WHERE sr_no = $1',
      [decoded.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Attach the user information to the request
    req.user = {
      id: userResult.rows[0].sr_no,
      email: userResult.rows[0].business_email,
      name: userResult.rows[0].person_name,
      businessType: userResult.rows[0].business_type,
      role: decoded.role
    };
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't reject the request if no token or invalid token
 * Useful for routes that can work with or without authentication
 */
const optionalAuthentication = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      req.user = null;
      return next();
    }
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
  } catch (error) {
    console.error('Optional token verification error:', error);
    req.user = null;
  }
  
  next();
};

module.exports = {
  authenticateToken: authMiddleware,
  optionalAuthentication
}; 