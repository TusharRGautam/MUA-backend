const jwt = require('jsonwebtoken');
const { query } = require('../db');

/**
 * Authentication middleware for API requests
 * Verifies the JWT token and attaches the user information to the request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        error: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mua-secret-key');
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        error: 'Invalid token'
      });
    }

    // Check the role in token to determine which database table to query
    const role = decoded.role || 'unknown';
    
    if (role === 'customer') {
      // CUSTOMER FLOW: Check Customer_Table_Details
      const userResult = await query(
        'SELECT id, full_name, email, phone_number FROM Customer_Table_Details WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          error: 'User not found'
        });
      }

      // Attach customer user to request
      req.user = {
        id: decoded.id,
        email: decoded.email || userResult.rows[0].email,
        role: 'customer',
        ...userResult.rows[0]
      };
    } 
    else if (role === 'business_owner' || role === 'vendor') {
      // BUSINESS/VENDOR FLOW: Check registration_and_other_details
      const vendorResult = await query(
        'SELECT sr_no, business_email, business_type, person_name, business_name FROM registration_and_other_details WHERE sr_no = $1',
        [decoded.id]
      );

      if (vendorResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          error: 'User not found'
        });
      }

      // Attach business/vendor user to request
      req.user = {
        id: decoded.id,
        email: decoded.email || vendorResult.rows[0].business_email,
        role: role,
        business_type: decoded.business_type || vendorResult.rows[0].business_type,
        // Add other relevant vendor fields
        ...vendorResult.rows[0]
      };
      
      // Also attach vendor info for convenience in vendor routes
      req.vendor = vendorResult.rows[0];
    }
    else {
      // Unknown role - reject
      return res.status(401).json({
        success: false,
        code: 'INVALID_ROLE',
        error: 'Invalid or unknown user role'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        error: 'Token has expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      code: 'AUTH_ERROR',
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't reject the request if no token or invalid token
 * Useful for routes that can work with or without authentication
 */
const optionalAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mua-secret-key');
    
    if (!decoded || !decoded.id) {
      req.user = null;
      return next();
    }

    // Check the role in token to determine which database table to query
    const role = decoded.role || 'unknown';
    
    if (role === 'customer') {
      // CUSTOMER FLOW: Check Customer_Table_Details
      const userResult = await query(
        'SELECT id, full_name, email, phone_number FROM Customer_Table_Details WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length > 0) {
        req.user = {
          id: decoded.id,
          email: decoded.email || userResult.rows[0].email,
          role: 'customer',
          ...userResult.rows[0]
        };
      } else {
        req.user = null;
      }
    } 
    else if (role === 'business_owner' || role === 'vendor') {
      // BUSINESS/VENDOR FLOW: Check registration_and_other_details
      const vendorResult = await query(
        'SELECT sr_no, business_email, business_type, person_name, business_name FROM registration_and_other_details WHERE sr_no = $1',
        [decoded.id]
      );

      if (vendorResult.rows.length > 0) {
        req.user = {
          id: decoded.id,
          email: decoded.email || vendorResult.rows[0].business_email,
          role: role,
          business_type: decoded.business_type || vendorResult.rows[0].business_type,
          ...vendorResult.rows[0]
        };
        // Also attach vendor info for convenience in vendor routes
        req.vendor = vendorResult.rows[0];
      } else {
        req.user = null;
      }
    }
    else {
      req.user = null;
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
  }
  
  next();
};

/**
 * Conditional authentication middleware for vendor routes
 * Bypasses authentication for specific public endpoints
 */
const conditionalVendorAuth = (req, res, next) => {
  // List of paths that should be publicly accessible
  const publicPaths = [
    '/profile-public',
    '/all-profiles'
  ];
  
  // Check if the current path matches any public path
  const isPublicPath = publicPaths.some(path => req.path === path);
  
  if (isPublicPath) {
    console.log(`Public access granted for: ${req.path}`);
    return next();
  }
  
  // If not a public path, apply the normal authentication middleware
  return authMiddleware(req, res, next);
};

module.exports = {
  authenticateToken: authMiddleware,
  optionalAuthentication,
  conditionalVendorAuth
}; 