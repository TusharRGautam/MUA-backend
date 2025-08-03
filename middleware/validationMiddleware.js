/**
 * Validation Middleware
 * 
 * Provides request validation functionality for routes
 */

/**
 * Validate request body against a set of validation rules
 * 
 * @param {Object} rules - Validation rules
 * @returns {Function} - Express middleware function
 */
const validateRequest = (rules) => {
  return (req, res, next) => {
    // Only validate if rules were provided
    if (!rules) return next();
    
    const errors = {};
    
    // Check each field against its rules
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field].split('|');
      
      // Check required rule
      if (fieldRules.includes('required') && (req.body[field] === undefined || req.body[field] === null || req.body[field] === '')) {
        errors[field] = `${field} is required`;
      }
      
      // Check integer rule
      if (fieldRules.includes('integer') && req.body[field] !== undefined) {
        if (!Number.isInteger(Number(req.body[field]))) {
          errors[field] = `${field} must be an integer`;
        }
      }
      
      // Check numeric rule
      if (fieldRules.includes('numeric') && req.body[field] !== undefined) {
        if (isNaN(Number(req.body[field]))) {
          errors[field] = `${field} must be a number`;
        }
      }
      
      // Check string rule
      if (fieldRules.includes('string') && req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string') {
          errors[field] = `${field} must be a string`;
        }
      }
    });
    
    // Return errors if any
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Continue to the next middleware if validation passes
    next();
  };
};

module.exports = {
  validateRequest
}; 