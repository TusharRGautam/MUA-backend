/**
 * Global error handling middleware
 * Provides consistent error responses across the application
 */

const errorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = undefined;

  // Add detailed error info in development but not in production
  if (process.env.NODE_ENV !== 'production') {
    errorDetails = {
      stack: err.stack,
      details: err.details || err.error
    };
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized - Invalid or expired token';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Database connection failed';
  } else if (err.code === '23505') {
    // PostgreSQL duplicate key error
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errorDetails && { details: errorDetails })
  });
};

module.exports = errorHandler; 