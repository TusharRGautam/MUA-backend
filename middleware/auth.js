const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    // Check if JWT_SECRET is properly set
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      console.error('JWT_SECRET is missing or empty. Authentication cannot proceed.');
      return res.status(500).json({ error: 'Server authentication configuration error' });
    }
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Provide more specific error messages based on jwt error types
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please login again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not yet active. Please try again later.' });
    }
    
    res.status(403).json({ error: 'Invalid token' });
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
  authenticateToken,
  optionalAuthentication
}; 