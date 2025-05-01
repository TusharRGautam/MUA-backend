/**
 * Cross-Origin Resource Sharing (CORS) middleware
 * Enables secure cross-origin requests with proper options
 */

const corsMiddleware = (req, res, next) => {
  // Get the origin from the request header
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  
  // Allow specific methods
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  
  // Allow specific headers
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', true);
  
  // Set max age for preflight requests
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Move to the next middleware
  next();
};

module.exports = corsMiddleware; 