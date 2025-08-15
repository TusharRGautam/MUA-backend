const { cacheConfig, invalidateCache } = require('./cache');

/**
 * Enhanced Error Handling Middleware with Performance Monitoring
 */

// Error types for consistent handling
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Error metrics tracking
const errorMetrics = {
  totalErrors: 0,
  errorsByType: {},
  errorsByEndpoint: {},
  recentErrors: [],
  criticalErrors: 0,
  errorRate: 0,
  lastReset: Date.now()
};

// Critical error patterns that need immediate attention
const criticalErrorPatterns = [
  /database.*connection.*failed/i,
  /memory.*exceeded/i,
  /timeout.*exceeded/i,
  /authentication.*failed/i,
  /payment.*failed/i
];

// Update error metrics
const updateErrorMetrics = (error, endpoint, statusCode) => {
  errorMetrics.totalErrors++;
  errorMetrics.errorsByType[error.type] = (errorMetrics.errorsByType[error.type] || 0) + 1;
  errorMetrics.errorsByEndpoint[endpoint] = (errorMetrics.errorsByEndpoint[endpoint] || 0) + 1;

  // Track recent errors (last 100)
  errorMetrics.recentErrors.unshift({
    timestamp: new Date().toISOString(),
    endpoint,
    type: error.type,
    message: error.message,
    statusCode,
    stack: error.stack?.split('\n').slice(0, 3).join('\n') // Truncated stack
  });

  if (errorMetrics.recentErrors.length > 100) {
    errorMetrics.recentErrors.pop();
  }

  // Check for critical errors
  const isCritical = criticalErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.stack)
  );

  if (isCritical || statusCode >= 500) {
    errorMetrics.criticalErrors++;
    // In production, you might want to send alerts here
    console.error('🚨 CRITICAL ERROR DETECTED:', {
      endpoint,
      error: error.message,
      statusCode
    });
  }

  // Calculate error rate (errors per minute)
  const minutesElapsed = (Date.now() - errorMetrics.lastReset) / (1000 * 60);
  errorMetrics.errorRate = minutesElapsed > 0 ? (errorMetrics.totalErrors / minutesElapsed).toFixed(2) : 0;
};

// Custom Error classes for better error handling
class AppError extends Error {
  constructor(message, statusCode, type = ErrorTypes.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, details);
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, ErrorTypes.DATABASE_ERROR, {
      code: originalError?.code,
      detail: originalError?.detail,
      hint: originalError?.hint
    });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, ErrorTypes.NOT_FOUND_ERROR);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR);
  }
}

class ExternalApiError extends AppError {
  constructor(service, message, statusCode = 502) {
    super(`External service error (${service}): ${message}`, statusCode, ErrorTypes.EXTERNAL_API_ERROR);
  }
}

// Database error handler
const handleDatabaseError = (error) => {
  console.error('Database Error:', {
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    message: error.message
  });

  // Map common PostgreSQL errors
  switch (error.code) {
    case '23505': // unique_violation
      return new ValidationError('Resource already exists', {
        field: error.detail?.match(/Key \(([^)]+)\)/)?.[1],
        constraint: error.constraint
      });
    
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced resource does not exist', {
        constraint: error.constraint,
        detail: error.detail
      });
    
    case '23502': // not_null_violation
      return new ValidationError('Required field is missing', {
        field: error.column
      });
    
    case '42P01': // undefined_table
      return new DatabaseError('Database table not found');
    
    case '42703': // undefined_column
      return new DatabaseError('Database column not found');
    
    case '08006': // connection_failure
    case '08001': // sqlclient_unable_to_establish_sqlconnection
    case '08004': // sqlserver_rejected_establishment_of_sqlconnection
      return new DatabaseError('Database connection failed');
    
    case '53300': // too_many_connections
      return new DatabaseError('Database connection limit reached');
    
    default:
      return new DatabaseError('Database operation failed', error);
  }
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle different error types
  if (err.code && typeof err.code === 'string') {
    // Database errors
    error = handleDatabaseError(err);
  } else if (err.name === 'ValidationError') {
    error = new ValidationError(err.message, err.errors);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    error = new ValidationError('Invalid JSON in request body');
  } else if (!error.isOperational) {
    // Convert unknown errors to AppError
    error = new AppError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      err.statusCode || 500,
      ErrorTypes.INTERNAL_ERROR
    );
  }

  // Update metrics
  updateErrorMetrics(error, req.originalUrl, error.statusCode);

  // Log error details
  const errorLog = {
    timestamp: error.timestamp,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details
  };

  if (error.statusCode >= 500) {
    console.error('❌ Server Error:', errorLog);
    console.error('Stack trace:', error.stack);
  } else {
    console.warn('⚠️  Client Error:', errorLog);
  }

  // Invalidate relevant caches for certain errors
  if (error.type === ErrorTypes.DATABASE_ERROR) {
    invalidateCache.pattern('query');
    console.log('🗑️ Invalidated query cache due to database error');
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp
    }
  };

  // Include details in development mode or for validation errors
  if (process.env.NODE_ENV !== 'production' || error.type === ErrorTypes.VALIDATION_ERROR) {
    errorResponse.error.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(errorResponse);
};

// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Error metrics endpoint for monitoring
const getErrorMetrics = (req, res) => {
  res.json({
    success: true,
    data: {
      ...errorMetrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
};

// Reset error metrics (useful for monitoring systems)
const resetErrorMetrics = (req, res) => {
  const previousMetrics = { ...errorMetrics };
  
  errorMetrics.totalErrors = 0;
  errorMetrics.errorsByType = {};
  errorMetrics.errorsByEndpoint = {};
  errorMetrics.recentErrors = [];
  errorMetrics.criticalErrors = 0;
  errorMetrics.errorRate = 0;
  errorMetrics.lastReset = Date.now();

  res.json({
    success: true,
    message: 'Error metrics reset successfully',
    previousMetrics
  });
};

// Health check with error rate monitoring
const healthCheck = (req, res) => {
  const uptimeHours = (process.uptime() / 3600).toFixed(2);
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
  };

  const health = {
    status: 'healthy',
    uptime: `${uptimeHours} hours`,
    memory: memoryUsageMB,
    errors: {
      total: errorMetrics.totalErrors,
      rate: `${errorMetrics.errorRate}/min`,
      critical: errorMetrics.criticalErrors
    },
    timestamp: new Date().toISOString()
  };

  // Check for health issues
  if (errorMetrics.errorRate > 10) { // More than 10 errors per minute
    health.status = 'degraded';
    health.warnings = ['High error rate detected'];
  }

  if (errorMetrics.criticalErrors > 5) { // More than 5 critical errors
    health.status = 'unhealthy';
    health.alerts = ['Critical errors detected'];
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalApiError,

  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,

  // Monitoring endpoints
  getErrorMetrics,
  resetErrorMetrics,
  healthCheck,

  // Error types
  ErrorTypes,

  // Utilities
  updateErrorMetrics,
  handleDatabaseError
};