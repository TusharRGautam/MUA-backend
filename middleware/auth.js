const { supabase } = require('../src/config/supabase');

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
    
    // First try to verify with JWT directly for faster processing
    // and to bypass Supabase for non-supabase tokens
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_for_development');
      
      if (decoded && decoded.id && decoded.email) {
        // Get user info from database to ensure user still exists
        const { query } = require('../db');
        const userResult = await query(
          'SELECT sr_no, business_email, business_type FROM registration_and_other_details WHERE sr_no = $1',
          [decoded.id]
        );
        
        if (userResult.rows.length > 0) {
          // Attach user to request
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'business_owner',
            business_type: decoded.business_type
          };
          
          // Also attach vendor info for convenience in vendor routes
          req.vendor = userResult.rows[0];
          
          return next();
        }
      }
    } catch (jwtError) {
      console.log('JWT direct verification failed, trying Supabase:', jwtError.message);
      // Continue to Supabase verification
    }
    
    // Verify the token using Supabase Auth if direct JWT verification failed
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('Auth Error:', authError);
        
        // Format the proper error response
        const errorCode = authError.code === 'bad_jwt' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ 
          success: false,
          code: errorCode,
          error: 'Your session has expired. Please refresh your token or log in again.'
        });
      }
      
      if (!userData || !userData.user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          error: 'User not found'
        });
      }
      
      // Attach the user information to the request
      req.user = userData.user;
      
      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        code: 'AUTH_ERROR',
        error: 'Authentication error'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      error: 'Authentication error'
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
    
    // Try to verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data || !data.user) {
      console.log('Optional auth: Token invalid or expired');
      req.user = null;
    } else {
      req.user = data.user;
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
  }
  
  next();
};

module.exports = {
  authenticateToken: authMiddleware,
  optionalAuthentication
}; 